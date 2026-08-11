package com.sigecom.service;

import com.sigecom.domain.enums.PeriodoRelatorio;
import com.sigecom.model.response.dashboard.DashboardDesempenhoResponse;
import com.sigecom.model.response.dashboard.MetaVendaDiariaResponse;
import com.sigecom.model.response.relatorio.RelatorioEstoqueResponse;
import com.sigecom.model.response.relatorio.RelatorioFinanceiroResponse;
import com.sigecom.model.response.relatorio.RelatorioVendasResponse;
import com.sigecom.repository.ItemVendaRepository;
import com.sigecom.repository.VendaRepository;
import com.sigecom.repository.projection.MovimentacaoProdutoAgregado;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final VendaRepository vendaRepository;
    private final RelatorioVendasService relatorioVendasService;
    private final RelatorioFinanceiroService relatorioFinanceiroService;
    private final RelatorioEstoqueService relatorioEstoqueService;
    private final ItemVendaRepository itemVendaRepository;

    // Valor fixo até US-034 (módulo Financeiro, Sprint 4) fornecer custos + margem
    private static final BigDecimal META_DIA_PLACEHOLDER = new BigDecimal("1000.00");

    public MetaVendaDiariaResponse metaVendaDiaria() {
        LocalDateTime inicioDia = LocalDate.now().atStartOfDay();
        LocalDateTime fimDia = inicioDia.plusDays(1).minusNanos(1);

        BigDecimal realizadoHoje = vendaRepository
                .findAllFiltrado(inicioDia, fimDia, null, PageRequest.of(0, Integer.MAX_VALUE))
                .getContent()
                .stream()
                .map(v -> v.getTotal() != null ? v.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal percentual = META_DIA_PLACEHOLDER.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : realizadoHoje
                        .multiply(new BigDecimal("100"))
                        .divide(META_DIA_PLACEHOLDER, 2, RoundingMode.HALF_UP);

        log.info("meta-diaria: meta={}, realizado={}, percentual={}%",
                META_DIA_PLACEHOLDER, realizadoHoje, percentual);

        return new MetaVendaDiariaResponse(
                META_DIA_PLACEHOLDER,
                realizadoHoje,
                percentual,
                realizadoHoje.compareTo(META_DIA_PLACEHOLDER) >= 0
        );
    }

    @Transactional(readOnly = true)
    public DashboardDesempenhoResponse desempenho(PeriodoRelatorio periodo) {
        PeriodoRelatorio p = periodo != null ? periodo : PeriodoRelatorio.SEMANA;
        PeriodoRelatorio.Intervalo intervalo = p.intervalo(LocalDate.now());

        RelatorioVendasResponse vendas = relatorioVendasService.gerar(p, null, null, null);

        RelatorioFinanceiroResponse financeiro = relatorioFinanceiroService.gerar(p, null, null, null);

        RelatorioEstoqueResponse estoque = relatorioEstoqueService.gerar(null, null,
                RelatorioEstoqueService.Ordenacao.QUANTIDADE_ASC);

        LocalDateTime inicio = intervalo.inicio().atStartOfDay();
        LocalDateTime fim = intervalo.fim().atTime(LocalTime.MAX);
        List<MovimentacaoProdutoAgregado> topProdutosRaw = itemVendaRepository
                .agregarPorProduto(inicio, fim, null, null)
                .stream().limit(5).toList();

        return new DashboardDesempenhoResponse(
                vendas.totalVendas(),
                vendas.quantidadeTransacoes(),
                vendas.ticketMedio(),
                estoque.resumo().emAlerta() + estoque.resumo().emCritico(),
                financeiro.totalReceitas(),
                financeiro.totalDespesas(),
                financeiro.saldo(),
                intervalo.inicio(),
                intervalo.fim(),
                vendas.vendasPorDia().stream()
                        .map(v -> new DashboardDesempenhoResponse.VendaDiaria(v.data(), v.total(), v.quantidade()))
                        .toList(),
                vendas.vendasPorFormaPagamento().stream()
                        .map(v -> new DashboardDesempenhoResponse.FormaPagamento(v.tipoPagamento(), v.total(), v.quantidade()))
                        .toList(),
                topProdutosRaw.stream()
                        .map(m -> new DashboardDesempenhoResponse.TopProduto(m.produtoId(), m.produtoNome(), m.categoriaNome(), m.unidades(), m.receita()))
                        .toList()
        );
    }
}
