package com.sigecom.service;

import com.sigecom.domain.ItemVenda;
import com.sigecom.domain.Produto;
import com.sigecom.domain.Usuario;
import com.sigecom.domain.Venda;
import com.sigecom.domain.enums.TipoDesconto;
import com.sigecom.model.request.venda.ItemVendaRequest;
import com.sigecom.model.request.venda.VendaRequest;
import com.sigecom.model.response.venda.CalculoVendaResponse;
import com.sigecom.model.response.venda.ItemVendaResponse;
import com.sigecom.model.response.venda.VendaResponse;
import com.sigecom.model.response.venda.VendaResumoResponse;
import com.sigecom.repository.ProdutoRepository;
import com.sigecom.repository.UsuarioRepository;
import com.sigecom.repository.VendaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Regras de negócio de venda (PDV — Sprint 3).
 *
 * US-026 — Cálculo automático do total:
 *   - subtotal, desconto total e total final calculados a partir dos itens
 *   - desconto por item (PERCENTUAL ou VALOR_FIXO); nunca deixa total negativo
 *   - 2 casas decimais com arredondamento HALF_UP
 *
 * US-027 — Confirmar e registrar venda:
 *   - persistência + baixa de estoque numa única transação (@Transactional)
 *   - rollback total em caso de falha (estoque insuficiente, etc.)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VendaService {

    private final VendaRepository vendaRepository;
    private final ProdutoRepository produtoRepository;
    private final UsuarioRepository usuarioRepository;

    private static final int ESCALA = 2;
    private static final RoundingMode ARREDONDAMENTO = RoundingMode.HALF_UP;
    private static final BigDecimal CEM = new BigDecimal("100");

    // ── Preview (US-026) ─────────────────────────────────────────

    /**
     * Calcula subtotal, desconto total e total final sem persistir.
     * Chamado sempre que o carrinho muda no front (CA: recálculo automático).
     */
    @Transactional(readOnly = true)
    public CalculoVendaResponse calcular(VendaRequest request) {
        Map<Long, Produto> produtos = carregarProdutos(request);

        List<ItemVenda> itensCalculados = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal descontoTotal = BigDecimal.ZERO;

        for (ItemVendaRequest req : request.itens()) {
            Produto produto = produtos.get(req.produtoId());
            ItemVenda item = calcularItem(req, produto);

            itensCalculados.add(item);
            subtotal = subtotal.add(brutoDoItem(item));
            descontoTotal = descontoTotal.add(item.getDescontoAplicado());
        }

        BigDecimal total = totalNaoNegativo(subtotal, descontoTotal);

        return CalculoVendaResponse.builder()
                .itens(itensCalculados.stream().map(ItemVendaResponse::toResponse).toList())
                .subtotal(escala(subtotal))
                .descontoTotal(escala(descontoTotal))
                .total(escala(total))
                .build();
    }

    // ── Histórico paginado ───────────────────────────────────────

    /**
     * Lista vendas paginadas com filtro opcional por intervalo de data.
     * O default (via controller) é ordenar por dataHora desc.
     */
    @Transactional(readOnly = true)
    public Page<VendaResumoResponse> listar(LocalDateTime dataInicio,
                                            LocalDateTime dataFim,
                                            Pageable pageable) {
        return vendaRepository.findAllFiltrado(dataInicio, dataFim, pageable)
                .map(VendaResumoResponse::toResponse);
    }

    // ── Confirmação (US-027) ─────────────────────────────────────

    /**
     * Persiste a venda e decrementa o estoque de todos os itens numa
     * única transação. Em qualquer falha, o rollback devolve estoque
     * e venda ao estado original (D-8).
     */
    @Transactional
    public VendaResponse confirmar(VendaRequest request) {
        if (request.tipoPagamento() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A forma de pagamento é obrigatória");
        }
        Usuario operador = usuarioAutenticado();
        Map<Long, Produto> produtos = carregarProdutos(request);

        Venda venda = Venda.builder()
                .usuario(operador)
                .itens(new ArrayList<>())
                .tipoPagamento(request.tipoPagamento())
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal descontoTotal = BigDecimal.ZERO;

        for (ItemVendaRequest req : request.itens()) {
            Produto produto = produtos.get(req.produtoId());
            baixarEstoque(produto, req.quantidade());

            ItemVenda item = calcularItem(req, produto);
            item.setVenda(venda);
            venda.getItens().add(item);

            subtotal = subtotal.add(brutoDoItem(item));
            descontoTotal = descontoTotal.add(item.getDescontoAplicado());
        }

        BigDecimal total = totalNaoNegativo(subtotal, descontoTotal);
        venda.setDesconto(escala(descontoTotal));
        venda.setTotal(escala(total));

        Venda salva = vendaRepository.save(venda);
        log.info("Venda {} registrada por {} — total={}", salva.getId(), operador.getEmail(), salva.getTotal());

        return VendaResponse.toResponse(salva, escala(subtotal));
    }

    // ── Helpers ──────────────────────────────────────────────────

    private Map<Long, Produto> carregarProdutos(VendaRequest request) {
        List<Long> ids = request.itens().stream().map(ItemVendaRequest::produtoId).distinct().toList();
        Map<Long, Produto> produtos = new HashMap<>();
        for (Long id : ids) {
            Produto p = produtoRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Produto " + id + " não encontrado"));
            produtos.put(id, p);
        }
        return produtos;
    }

    private ItemVenda calcularItem(ItemVendaRequest req, Produto produto) {
        BigDecimal preco = produto.getPreco();
        int qtd = req.quantidade();
        BigDecimal bruto = preco.multiply(BigDecimal.valueOf(qtd));

        BigDecimal descontoAplicado = calcularDescontoItem(req, bruto);
        // Desconto do item nunca ultrapassa o bruto do item (CA: total nunca negativo)
        if (descontoAplicado.compareTo(bruto) > 0) {
            descontoAplicado = bruto;
        }
        BigDecimal subtotalItem = bruto.subtract(descontoAplicado);

        return ItemVenda.builder()
                .produto(produto)
                .quantidade(qtd)
                .precoUnitario(preco)
                .tipoDesconto(req.tipoDesconto())
                .valorDesconto(req.valorDesconto() != null ? escala(req.valorDesconto()) : BigDecimal.ZERO)
                .descontoAplicado(escala(descontoAplicado))
                .subtotal(escala(subtotalItem))
                .build();
    }

    private BigDecimal calcularDescontoItem(ItemVendaRequest req, BigDecimal bruto) {
        if (req.tipoDesconto() == null || req.valorDesconto() == null
                || req.valorDesconto().compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        if (req.tipoDesconto() == TipoDesconto.PERCENTUAL) {
            BigDecimal percentual = req.valorDesconto();
            if (percentual.compareTo(CEM) > 0) percentual = CEM; // CA: total nunca negativo
            return bruto.multiply(percentual).divide(CEM, ESCALA, ARREDONDAMENTO);
        }
        return req.valorDesconto();
    }

    private BigDecimal brutoDoItem(ItemVenda item) {
        return item.getSubtotal().add(item.getDescontoAplicado());
    }

    private BigDecimal totalNaoNegativo(BigDecimal subtotal, BigDecimal descontoTotal) {
        BigDecimal total = subtotal.subtract(descontoTotal);
        return total.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : total;
    }

    private BigDecimal escala(BigDecimal valor) {
        return valor.setScale(ESCALA, ARREDONDAMENTO);
    }

    private void baixarEstoque(Produto produto, int qtd) {
        // D-8: precisa acontecer dentro da mesma transação da venda
        if (produto.getQtdEstoque() < qtd) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Estoque insuficiente para o produto " + produto.getNome());
        }
        produto.setQtdEstoque(produto.getQtdEstoque() - qtd);
        produtoRepository.save(produto);
    }

    private Usuario usuarioAutenticado() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Operador não identificado"));
    }
}
