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
import java.time.LocalTime;
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
 *
 * O que sustenta essa idempotencia e o gerador pseudoaleatorio ser isolado por
 * slot (ver randomDoSlot): a composicao de uma venda depende so do par
 * (dia, slot), nunca de quantos slots o seeder processou antes dela.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VendaSeedService {

    private static final int MAX_ITENS_POR_VENDA = 5;
    private static final int MAX_QTD_POR_ITEM = 4;

    /**
     * Grade de horarios do dia: 9h em diante, de 70 em 70 minutos. Cobre ate
     * 19h30 no dia mais movimentado, entao o historico gerado se espalha pelo
     * expediente inteiro em vez de amontoar tudo na primeira hora.
     */
    private static final LocalTime ABERTURA = LocalTime.of(9, 0);
    private static final int MINUTOS_ENTRE_SLOTS = 70;

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
        int jaExistiam = 0;
        int semEstoque = 0;

        for (int offset = props.getDias() - 1; offset >= 0; offset--) {
            LocalDate dia = hoje.minusDays(offset);

            int vendasDoDia = quantidadeDeVendas(dia, offset);
            for (int slot = 0; slot < vendasDoDia; slot++) {
                LocalDateTime instante = instanteDaVenda(dia, slot);

                // Nunca gera venda no futuro: no dia corrente, para no horario atual.
                if (instante.isAfter(agora)) {
                    break;
                }

                Usuario vendedor = vendedores.get((int) (Math.abs(dia.toEpochDay() + slot) % vendedores.size()));

                if (vendaRepository.existsByDataHoraAndUsuarioId(instante, vendedor.getId())) {
                    jaExistiam++;
                    continue;
                }

                if (registrarVenda(instante, vendedor, produtos, categoriaVenda, randomDoSlot(dia, slot))) {
                    criadas++;
                } else {
                    semEstoque++;
                }
            }
        }

        // semEstoque fica FORA de `ignorados` de proposito. Os dois casos ja
        // foram contados juntos, e o resultado era uma segunda execucao
        // reportando "ignorados: 34" num banco que estava vazio - numero
        // impossivel, que dava a idempotencia como provada quando ela nao
        // estava. `ignorados` agora significa uma coisa so: ja existia.
        String observacao = "cada venda gerada tambem deu baixa no estoque e lancou a receita no financeiro";
        if (semEstoque > 0) {
            observacao += "; " + semEstoque + " horario(s) ficaram sem venda por falta de estoque "
                    + "no catalogo - aumente o estoque inicial em SeedCatalogo ou reduza sigecom.seed.dias";
        }

        log.info("Vendas: {} criadas, {} ja existiam, {} sem estoque (janela de {} dias).",
                criadas, jaExistiam, semEstoque, props.getDias());
        return SeedResult.de("vendas", criadas, jaExistiam, observacao);
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

    /**
     * Gerador exclusivo do par (dia, slot).
     *
     * Precisa ser por slot, e nao um Random por dia compartilhado entre eles.
     * Com o gerador compartilhado, o slot que ja existia saia pelo `continue`
     * sem consumir sorteio nenhum, enquanto montar uma venda consome varios:
     * a composicao de um slot passava a depender de quantos slots antes dele
     * ja estavam no banco. Na segunda execucao o fluxo chegava dessincronizado
     * nos slots que a primeira tinha deixado vazios por falta de estoque, eles
     * sorteavam outros produtos, achavam estoque, e nasciam vendas novas -
     * `POST /seed` duas vezes seguidas criava 916 e depois mais 29.
     *
     * Isolado por slot, o mesmo par (dia, slot) sorteia sempre os mesmos
     * produtos. Como o estoque so diminui de uma execucao para a outra, o slot
     * que nao teve estoque continua sem ter, e a segunda execucao e no-op.
     */
    private Random randomDoSlot(LocalDate dia, int slot) {
        return new Random(props.getRandomSeed() * 31L + dia.toEpochDay() * 97L + slot);
    }

    /**
     * Quantas vendas o dia teve. Domingo fechado, sabado move mais.
     *
     * O volume cresce conforme o dia se aproxima de hoje: a janela inteira
     * tem historico, mas a semana corrente concentra dado o bastante para as
     * telas de hoje e dos ultimos 7 dias nao ficarem vazias. Os patamares
     * somados dao ~200 vendas numa janela de 90 dias.
     *
     * Depende da distancia ate hoje, nao so da data, entao o volume de um dia
     * so vale na primeira vez que ele e semeado - depois disso o dia envelhece
     * e cai de patamar. Nao duplica nada: patamar so encolhe com o tempo, e
     * venda que ja existe e reconhecida pelo instante.
     */
    private int quantidadeDeVendas(LocalDate dia, int diasAtras) {
        if (dia.getDayOfWeek() == DayOfWeek.SUNDAY) {
            return 0;
        }

        Random rnd = new Random(props.getRandomSeed() * 13L + dia.toEpochDay());

        int base;
        if (diasAtras <= 6) {
            base = 4 + rnd.nextInt(4);          // hoje e a semana corrente
        } else if (diasAtras <= 29) {
            base = 2 + rnd.nextInt(3);          // resto do mes corrente
        } else if (diasAtras <= 59) {
            base = 1 + rnd.nextInt(3);          // mes passado
        } else {
            base = 1 + rnd.nextInt(2);          // mes retrasado e antes
        }

        return dia.getDayOfWeek() == DayOfWeek.SATURDAY ? base + 2 : base;
    }

    /**
     * Instante deterministico do slot do dia. Sem componente aleatorio de
     * proposito - e este valor que serve de chave de idempotencia.
     */
    private LocalDateTime instanteDaVenda(LocalDate dia, int slot) {
        return dia.atTime(ABERTURA).plusMinutes((long) slot * MINUTOS_ENTRE_SLOTS);
    }

    private TipoPagamento formaPagamento(Random rnd) {
        int sorteio = rnd.nextInt(100);
        if (sorteio < 38) return TipoPagamento.PIX;
        if (sorteio < 66) return TipoPagamento.DEBITO;
        if (sorteio < 87) return TipoPagamento.CREDITO;
        return TipoPagamento.DINHEIRO;
    }
}
