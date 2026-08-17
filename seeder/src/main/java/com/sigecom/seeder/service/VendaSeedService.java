package com.sigecom.seeder.service;

import com.sigecom.seeder.config.SeedProperties;
import com.sigecom.seeder.domain.*;
import com.sigecom.seeder.domain.SeedRegistro.Recurso;
import com.sigecom.seeder.domain.enums.TipoLancamento;
import com.sigecom.seeder.domain.enums.TipoPagamento;
import com.sigecom.seeder.model.SeedResult;
import com.sigecom.seeder.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Gera o historico de vendas da janela configurada.
 *
 * Cada venda gerada reproduz exatamente o que a aplicacao original faria ao
 * confirmar uma venda no PDV: grava a venda com seus itens, da baixa no
 * estoque do produto e lanca a receita no financeiro com a descricao
 * "Venda #id". Sem isso o banco ficaria internamente inconsistente e os
 * relatorios mostrariam numeros que a aplicacao nunca produziria.
 *
 * Idempotencia: o instante de cada venda e deterministico (dia + slot fixo)
 * e o vendedor e sempre um usuario de teste, entao a checagem
 * (dataHora, usuario) identifica com seguranca uma venda ja gerada. Rodar de
 * novo o mesmo dia e no-op; rodar amanha acrescenta so o dia novo.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VendaSeedService {

    private static final int MAX_ITENS_POR_VENDA = 5;
    private static final int MAX_QTD_POR_ITEM = 4;

    private final VendaRepository vendaRepository;
    private final LancamentoFinanceiroRepository lancamentoFinanceiroRepository;
    private final CategoriaFinanceiraRepository categoriaFinanceiraRepository;
    private final ProdutoRepository produtoRepository;
    private final UsuarioSeedService usuarioSeedService;
    private final CatalogoSeedService catalogoSeedService;
    private final SeedRegistroService registro;
    private final SeedProperties props;

    @Transactional
    public SeedResult semear() {
        List<Usuario> vendedores = usuarioSeedService.carregarUsuariosSeed();
        if (vendedores.isEmpty()) {
            return SeedResult.de("vendas", 0, 0,
                    "nenhum usuario de teste no banco - rode /seed/usuarios antes");
        }

        List<Produto> produtos = catalogoSeedService.carregarProdutosDoCatalogo();
        if (produtos.isEmpty()) {
            return SeedResult.de("vendas", 0, 0,
                    "catalogo de produtos vazio - rode /seed/produtos antes");
        }

        CategoriaFinanceira categoriaVenda = categoriaFinanceiraRepository
                .findFirstByNomeIgnoreCaseAndTipo(SeedCatalogo.CATEGORIA_VENDA, TipoLancamento.RECEITA)
                .orElse(null);
        if (categoriaVenda == null) {
            return SeedResult.de("vendas", 0, 0,
                    "categoria financeira 'Venda' (RECEITA) nao existe - crie pela tela de "
                    + "categorias financeiras ou rode /seed/categorias-financeiras antes");
        }

        LocalDate hoje = LocalDate.now();
        LocalDateTime agora = LocalDateTime.now();
        int criadas = 0;
        int ignoradas = 0;

        for (int offset = props.getDias() - 1; offset >= 0; offset--) {
            LocalDate dia = hoje.minusDays(offset);

            // Random derivado do dia: a composicao de um dia nao muda quando a
            // janela (sigecom.seed.dias) aumenta ou diminui.
            Random rnd = randomDoDia(dia);

            int vendasDoDia = quantidadeDeVendas(dia, rnd);
            for (int i = 0; i < vendasDoDia; i++) {
                LocalDateTime instante = instanteDaVenda(dia, i);

                // Nunca gera venda no futuro: no dia corrente, para no horario atual.
                if (instante.isAfter(agora)) {
                    break;
                }

                Usuario vendedor = vendedores.get((int) (Math.abs(dia.toEpochDay() + i) % vendedores.size()));

                if (vendaRepository.existsByDataHoraAndUsuarioId(instante, vendedor.getId())) {
                    ignoradas++;
                    continue;
                }

                if (registrarVenda(instante, vendedor, produtos, categoriaVenda, rnd)) {
                    criadas++;
                } else {
                    ignoradas++;
                }
            }
        }

        log.info("Vendas: {} criadas, {} ja existiam (janela de {} dias).",
                criadas, ignoradas, props.getDias());
        return SeedResult.de("vendas", criadas, ignoradas,
                "cada venda gerada tambem deu baixa no estoque e lancou a receita no financeiro");
    }

    /**
     * Monta e persiste uma venda com seus itens, a baixa de estoque e a
     * receita correspondente. Devolve false quando nao sobrou estoque para
     * montar nenhum item - dia com catalogo esgotado simplesmente nao vende.
     */
    private boolean registrarVenda(LocalDateTime instante,
                                   Usuario vendedor,
                                   List<Produto> produtos,
                                   CategoriaFinanceira categoriaVenda,
                                   Random rnd) {

        int qtdItens = 1 + rnd.nextInt(MAX_ITENS_POR_VENDA);
        List<ItemVenda> itens = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal descontoTotal = BigDecimal.ZERO;

        for (int i = 0; i < qtdItens; i++) {
            Produto produto = produtos.get(rnd.nextInt(produtos.size()));

            if (produto.getQtdEstoque() <= 0) {
                continue;
            }

            int quantidade = Math.min(1 + rnd.nextInt(MAX_QTD_POR_ITEM), produto.getQtdEstoque());
            BigDecimal precoUnitario = produto.getPreco();
            BigDecimal bruto = precoUnitario.multiply(BigDecimal.valueOf(quantidade));

            // Desconto em ~1 de cada 6 itens, sempre um percentual pequeno.
            BigDecimal desconto = BigDecimal.ZERO;
            if (rnd.nextInt(6) == 0) {
                desconto = bruto.multiply(BigDecimal.valueOf(5L + rnd.nextInt(6)))
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            }

            BigDecimal subtotal = bruto.subtract(desconto).setScale(2, RoundingMode.HALF_UP);

            itens.add(ItemVenda.builder()
                    .produto(produto)
                    .quantidade(quantidade)
                    .precoUnitario(precoUnitario)
                    .descontoAplicado(desconto)
                    .valorDesconto(BigDecimal.ZERO)
                    .subtotal(subtotal)
                    .build());

            total = total.add(subtotal);
            descontoTotal = descontoTotal.add(desconto);

            produto.setQtdEstoque(produto.getQtdEstoque() - quantidade);
        }

        if (itens.isEmpty()) {
            return false;
        }

        Venda venda = Venda.builder()
                .usuario(vendedor)
                .total(total.setScale(2, RoundingMode.HALF_UP))
                .desconto(descontoTotal.setScale(2, RoundingMode.HALF_UP))
                .tipoPagamento(formaPagamento(rnd))
                .dataHora(instante)
                .build();

        Venda salva = vendaRepository.save(venda);
        registro.marcar(Recurso.VENDA, salva.getId());

        for (ItemVenda item : itens) {
            item.setVenda(salva);
        }
        salva.getItens().addAll(itens);
        vendaRepository.save(salva);

        produtoRepository.saveAll(itens.stream().map(ItemVenda::getProduto).distinct().toList());

        // Mesma convencao de descricao do VendaService: e o que impede o
        // VendaFinanceiroBackfillRunner da aplicacao de lancar a receita de novo.
        String descricao = "Venda #" + salva.getId();
        if (!lancamentoFinanceiroRepository.existsByDescricao(descricao)) {
            LancamentoFinanceiro receita = lancamentoFinanceiroRepository.save(LancamentoFinanceiro.builder()
                    .usuario(vendedor)
                    .categoria(categoriaVenda)
                    .tipo(TipoLancamento.RECEITA)
                    .descricao(descricao)
                    .valor(salva.getTotal())
                    .dataHora(salva.getDataHora())
                    .build());
            registro.marcar(Recurso.LANCAMENTO, receita.getId());
        }

        return true;
    }

    private Random randomDoDia(LocalDate dia) {
        return new Random(props.getRandomSeed() * 31L + dia.toEpochDay());
    }

    /** Domingo fechado; sabado move mais; dias uteis com volume medio. */
    private int quantidadeDeVendas(LocalDate dia, Random rnd) {
        return switch (dia.getDayOfWeek()) {
            case SUNDAY -> 0;
            case SATURDAY -> 18 + rnd.nextInt(9);
            case FRIDAY -> 14 + rnd.nextInt(8);
            default -> 8 + rnd.nextInt(8);
        };
    }

    /**
     * Instante deterministico do slot i do dia: 9h em diante, de 20 em 20
     * minutos. Sem componente aleatorio de proposito - e este valor que serve
     * de chave de idempotencia.
     */
    private LocalDateTime instanteDaVenda(LocalDate dia, int slot) {
        int minutosDesdeAbertura = slot * 20;
        return dia.atTime(9, 0).plusMinutes(minutosDesdeAbertura);
    }

    private TipoPagamento formaPagamento(Random rnd) {
        int sorteio = rnd.nextInt(100);
        if (sorteio < 38) return TipoPagamento.PIX;
        if (sorteio < 66) return TipoPagamento.DEBITO;
        if (sorteio < 87) return TipoPagamento.CREDITO;
        return TipoPagamento.DINHEIRO;
    }

    /** Dias uteis com venda usados pelo fechamento de caixa. */
    public boolean diaTemVenda(LocalDate dia) {
        return dia.getDayOfWeek() != DayOfWeek.SUNDAY;
    }
}
