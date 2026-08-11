package com.sigecom.service;

import com.sigecom.domain.enums.PeriodoRelatorio;
import com.sigecom.domain.enums.TipoPagamento;
import com.sigecom.model.response.dashboard.DashboardDesempenhoResponse;
import com.sigecom.model.response.relatorio.RelatorioEstoqueResponse;
import com.sigecom.model.response.relatorio.RelatorioFinanceiroResponse;
import com.sigecom.model.response.relatorio.RelatorioVendasResponse;
import com.sigecom.repository.ItemVendaRepository;
import com.sigecom.repository.VendaRepository;
import com.sigecom.repository.projection.MovimentacaoProdutoAgregado;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock private VendaRepository vendaRepository;
    @Mock private RelatorioVendasService relatorioVendasService;
    @Mock private RelatorioFinanceiroService relatorioFinanceiroService;
    @Mock private RelatorioEstoqueService relatorioEstoqueService;
    @Mock private ItemVendaRepository itemVendaRepository;

    @InjectMocks
    private DashboardService dashboardService;

    private RelatorioVendasResponse vendasResponse;
    private RelatorioFinanceiroResponse financeiroResponse;
    private RelatorioEstoqueResponse estoqueResponse;

    @BeforeEach
    void setUp() {
        vendasResponse = new RelatorioVendasResponse(
                new BigDecimal("5000.00"), 25, new BigDecimal("200.00"),
                LocalDate.now(), LocalDate.now(), null,
                List.of(new RelatorioVendasResponse.VendaDiaria(LocalDate.now(), new BigDecimal("5000"), 25)),
                List.of(new RelatorioVendasResponse.VendaPorFormaPagamento(TipoPagamento.PIX, new BigDecimal("3000"), 15))
        );

        financeiroResponse = new RelatorioFinanceiroResponse(
                new BigDecimal("8000.00"), new BigDecimal("3000.00"), new BigDecimal("5000.00"),
                LocalDate.now(), LocalDate.now(), List.of()
        );

        estoqueResponse = new RelatorioEstoqueResponse(
                new RelatorioEstoqueResponse.Resumo(50, 3, 1, new BigDecimal("10000")),
                List.of()
        );
    }

    @Test
    void desempenho_ComPeriodoSemana_DeveAgregarDadosDosTresRelatorios() {
        when(relatorioVendasService.gerar(any(), isNull(), isNull(), isNull())).thenReturn(vendasResponse);
        when(relatorioFinanceiroService.gerar(any(), isNull(), isNull(), isNull())).thenReturn(financeiroResponse);
        when(relatorioEstoqueService.gerar(isNull(), isNull(), any())).thenReturn(estoqueResponse);
        when(itemVendaRepository.agregarPorProduto(any(), any(), isNull(), isNull())).thenReturn(List.of(
                new MovimentacaoProdutoAgregado(1L, "Ração", "Alimentação", 42L, new BigDecimal("4200"), 10L)
        ));

        DashboardDesempenhoResponse result = dashboardService.desempenho(PeriodoRelatorio.SEMANA);

        assertThat(result.totalVendas()).isEqualByComparingTo("5000.00");
        assertThat(result.quantidadeTransacoes()).isEqualTo(25);
        assertThat(result.ticketMedio()).isEqualByComparingTo("200.00");
        assertThat(result.itensEmAlerta()).isEqualTo(4);
        assertThat(result.totalReceitas()).isEqualByComparingTo("8000.00");
        assertThat(result.totalDespesas()).isEqualByComparingTo("3000.00");
        assertThat(result.saldoFinanceiro()).isEqualByComparingTo("5000.00");
        assertThat(result.vendasPorDia()).hasSize(1);
        assertThat(result.vendasPorFormaPagamento()).hasSize(1);
        assertThat(result.topProdutos()).hasSize(1);
        assertThat(result.topProdutos().get(0).nome()).isEqualTo("Ração");
    }

    @Test
    void desempenho_ComPeriodoNull_DevePadronizarParaSemana() {
        when(relatorioVendasService.gerar(any(), isNull(), isNull(), isNull())).thenReturn(vendasResponse);
        when(relatorioFinanceiroService.gerar(any(), isNull(), isNull(), isNull())).thenReturn(financeiroResponse);
        when(relatorioEstoqueService.gerar(isNull(), isNull(), any())).thenReturn(estoqueResponse);
        when(itemVendaRepository.agregarPorProduto(any(), any(), isNull(), isNull())).thenReturn(List.of());

        DashboardDesempenhoResponse result = dashboardService.desempenho(null);

        assertThat(result).isNotNull();
        assertThat(result.dataInicio()).isNotNull();
        assertThat(result.dataFim()).isNotNull();
    }

    @Test
    void desempenho_SemDados_DeveRetornarListasVazias() {
        RelatorioVendasResponse vazio = new RelatorioVendasResponse(
                BigDecimal.ZERO, 0, BigDecimal.ZERO,
                LocalDate.now(), LocalDate.now(), null, List.of(), List.of()
        );
        RelatorioFinanceiroResponse finVazio = new RelatorioFinanceiroResponse(
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                LocalDate.now(), LocalDate.now(), List.of()
        );
        RelatorioEstoqueResponse estVazio = new RelatorioEstoqueResponse(
                new RelatorioEstoqueResponse.Resumo(0, 0, 0, BigDecimal.ZERO), List.of()
        );

        when(relatorioVendasService.gerar(any(), isNull(), isNull(), isNull())).thenReturn(vazio);
        when(relatorioFinanceiroService.gerar(any(), isNull(), isNull(), isNull())).thenReturn(finVazio);
        when(relatorioEstoqueService.gerar(isNull(), isNull(), any())).thenReturn(estVazio);
        when(itemVendaRepository.agregarPorProduto(any(), any(), isNull(), isNull())).thenReturn(List.of());

        DashboardDesempenhoResponse result = dashboardService.desempenho(PeriodoRelatorio.DIA);

        assertThat(result.totalVendas()).isEqualByComparingTo("0");
        assertThat(result.quantidadeTransacoes()).isZero();
        assertThat(result.itensEmAlerta()).isZero();
        assertThat(result.vendasPorDia()).isEmpty();
        assertThat(result.vendasPorFormaPagamento()).isEmpty();
        assertThat(result.topProdutos()).isEmpty();
    }

    @Test
    void desempenho_TopProdutosDeveLimitarA5() {
        when(relatorioVendasService.gerar(any(), isNull(), isNull(), isNull())).thenReturn(vendasResponse);
        when(relatorioFinanceiroService.gerar(any(), isNull(), isNull(), isNull())).thenReturn(financeiroResponse);
        when(relatorioEstoqueService.gerar(isNull(), isNull(), any())).thenReturn(estoqueResponse);

        List<MovimentacaoProdutoAgregado> sete = List.of(
                new MovimentacaoProdutoAgregado(1L, "P1", "C1", 10L, BigDecimal.TEN, 5L),
                new MovimentacaoProdutoAgregado(2L, "P2", "C1", 9L, BigDecimal.TEN, 4L),
                new MovimentacaoProdutoAgregado(3L, "P3", "C1", 8L, BigDecimal.TEN, 3L),
                new MovimentacaoProdutoAgregado(4L, "P4", "C1", 7L, BigDecimal.TEN, 2L),
                new MovimentacaoProdutoAgregado(5L, "P5", "C1", 6L, BigDecimal.TEN, 1L),
                new MovimentacaoProdutoAgregado(6L, "P6", "C1", 5L, BigDecimal.TEN, 1L),
                new MovimentacaoProdutoAgregado(7L, "P7", "C1", 4L, BigDecimal.TEN, 1L)
        );
        when(itemVendaRepository.agregarPorProduto(any(), any(), isNull(), isNull())).thenReturn(sete);

        DashboardDesempenhoResponse result = dashboardService.desempenho(PeriodoRelatorio.MES);

        assertThat(result.topProdutos()).hasSize(5);
        assertThat(result.topProdutos().get(0).nome()).isEqualTo("P1");
        assertThat(result.topProdutos().get(4).nome()).isEqualTo("P5");
    }
}
