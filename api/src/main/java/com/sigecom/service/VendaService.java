package com.sigecom.service;

import com.sigecom.domain.CategoriaFinanceira;
import com.sigecom.domain.ItemVenda;
import com.sigecom.domain.LancamentoFinanceiro;
import com.sigecom.domain.Produto;
import com.sigecom.domain.Usuario;
import com.sigecom.domain.Venda;
import com.sigecom.domain.enums.TipoDesconto;
import com.sigecom.domain.enums.TipoLancamento;
import com.sigecom.model.request.venda.ItemVendaRequest;
import com.sigecom.model.request.venda.VendaRequest;
import com.sigecom.model.response.venda.CalculoVendaResponse;
import com.sigecom.model.response.venda.ItemVendaResponse;
import com.sigecom.model.response.venda.VendaResponse;
import com.sigecom.model.response.venda.VendaResumoResponse;
import com.sigecom.repository.CategoriaFinanceiraRepository;
import com.sigecom.repository.LancamentoFinanceiroRepository;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
 *   - toda venda é reportada no financeiro como uma receita (categoria "Venda"),
 *     dentro da mesma transação: se o lançamento falhar, a venda também sofre rollback
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VendaService {

    private final VendaRepository vendaRepository;
    private final ProdutoRepository produtoRepository;
    private final UsuarioRepository usuarioRepository;
    private final LancamentoFinanceiroRepository lancamentoFinanceiroRepository;
    private final CategoriaFinanceiraRepository categoriaFinanceiraRepository;

    private static final int ESCALA = 2;
    private static final RoundingMode ARREDONDAMENTO = RoundingMode.HALF_UP;
    private static final BigDecimal CEM = new BigDecimal("100");

    // Categoria de receita usada para lançar toda venda no financeiro.
    // Cadastrada pelo admin na tela de categorias financeiras — é pré-requisito
    // de operação, e sua ausência é reportada em registrarReceitaNoFinanceiro.
    private static final String CATEGORIA_VENDA = "Venda";

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
     * Lista vendas paginadas com filtro opcional por intervalo de data e por
     * funcionário responsável. O default (via controller) é ordenar por dataHora desc.
     */
    @Transactional(readOnly = true)
    public Page<VendaResumoResponse> listar(LocalDate dataInicio,
                                            LocalDate dataFim,
                                            Long funcionarioId,
                                            Pageable pageable) {
        // O front manda a data como YYYY-MM-DD; converte para a faixa do dia.
        // Nunca passar null ao repositorio: no Postgres um parametro nulo em
        // "(:param IS NULL OR ...)" nao tem tipo e estoura "could not determine
        // data type of parameter" (500). Por isso usa limites amplos quando nulo.
        LocalDateTime inicio = (dataInicio != null)
                ? dataInicio.atStartOfDay()
                : LocalDate.of(1970, 1, 1).atStartOfDay();
        LocalDateTime fim = (dataFim != null)
                ? dataFim.atTime(LocalTime.MAX)
                : LocalDateTime.now().plusYears(100);

        return vendaRepository.findAllFiltrado(inicio, fim, funcionarioId, pageable)
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

        registrarReceitaNoFinanceiro(salva, operador);

        return VendaResponse.toResponse(salva, escala(subtotal));
    }

    /**
     * Reporta a venda no financeiro como um lançamento de receita.
     *
     * Roda na mesma transação de confirmar(): se o save do lançamento falhar,
     * a venda inteira (e a baixa de estoque) sofre rollback — mantendo o
     * financeiro e o histórico de vendas sempre consistentes entre si.
     */
    private void registrarReceitaNoFinanceiro(Venda venda, Usuario operador) {
        CategoriaFinanceira categoria = categoriaFinanceiraRepository
                .findFirstByNomeIgnoreCaseAndTipo(CATEGORIA_VENDA, TipoLancamento.RECEITA)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Categoria financeira '" + CATEGORIA_VENDA + "' (RECEITA) não encontrada. "
                        + "Cadastre-a em Financeiro > Categorias antes de registrar vendas."));

        LancamentoFinanceiro lancamento = LancamentoFinanceiro.builder()
                .usuario(operador)
                .categoria(categoria)
                .tipo(TipoLancamento.RECEITA)
                .descricao("Venda #" + venda.getId())
                .valor(venda.getTotal())
                .dataHora(venda.getDataHora())
                .build();

        lancamentoFinanceiroRepository.save(lancamento);
        log.info("Receita da venda {} lançada no financeiro — valor={}", venda.getId(), venda.getTotal());
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
