package com.sigecom.service;

import com.sigecom.domain.enums.PeriodoRelatorio;
import com.sigecom.domain.enums.TipoLancamento;
import com.sigecom.model.response.relatorio.RelatorioFinanceiroResponse;
import com.sigecom.model.response.relatorio.RelatorioFinanceiroResponse.CategoriaFinanceiraTotal;
import com.sigecom.repository.LancamentoFinanceiroRepository;
import com.sigecom.repository.projection.CategoriaFinanceiraAgregado;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RelatorioFinanceiroServiceTest {

    @Mock
    private LancamentoFinanceiroRepository lancamentoFinanceiroRepository;

    @InjectMocks
    private RelatorioFinanceiroService relatorioFinanceiroService;

    // helper: cria um agregado anônimo sem precisar de classe concreta
    private CategoriaFinanceiraAgregado agregado(Long id, String nome, TipoLancamento tipo, String valor) {
        return new CategoriaFinanceiraAgregado() {
            public Long getCategoriaId()  { return id; }
            public String getCategoriaNome() { return nome; }
            public TipoLancamento getTipo()  { return tipo; }
            public BigDecimal getTotal()     { return new BigDecimal(valor); }
        };
    }

    @Test
    @DisplayName("gerar: resolve MES como default quando periodo e datas sao nulos")
    void gerar_PeriodoNuloEDatasNulas_UsaMesCorrente() {
        when(lancamentoFinanceiroRepository.somarAgrupadoPorCategoria(any(), any(), any()))
                .thenReturn(List.of());

        RelatorioFinanceiroResponse resp = relatorioFinanceiroService.gerar(null, null, null, null);

        LocalDate hoje = LocalDate.now();
        assertThat(resp.dataInicio()).isEqualTo(hoje.withDayOfMonth(1));
        assertThat(resp.dataFim()).isEqualTo(hoje.withDayOfMonth(hoje.lengthOfMonth()));
        assertThat(resp.totalReceitas()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(resp.totalDespesas()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(resp.saldo()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("gerar: usa PeriodoRelatorio.DIA quando informado")
    void gerar_PeriodoDia_UsaHoje() {
        when(lancamentoFinanceiroRepository.somarAgrupadoPorCategoria(any(), any(), any()))
                .thenReturn(List.of());

        RelatorioFinanceiroResponse resp = relatorioFinanceiroService.gerar(PeriodoRelatorio.DIA, null, null, null);

        assertThat(resp.dataInicio()).isEqualTo(LocalDate.now());
        assertThat(resp.dataFim()).isEqualTo(LocalDate.now());
    }

    @Test
    @DisplayName("gerar: datas personalizadas tem prioridade sobre o preset")
    void gerar_DatasPersonalizadas_IgnoraPreset() {
        LocalDate ini = LocalDate.of(2026, 7, 1);
        LocalDate fim = LocalDate.of(2026, 7, 15);
        when(lancamentoFinanceiroRepository.somarAgrupadoPorCategoria(any(), any(), any()))
                .thenReturn(List.of());

        RelatorioFinanceiroResponse resp = relatorioFinanceiroService.gerar(PeriodoRelatorio.DIA, ini, fim, null);

        assertThat(resp.dataInicio()).isEqualTo(ini);
        assertThat(resp.dataFim()).isEqualTo(fim);
    }

    @Test
    @DisplayName("gerar: dataInicio depois de dataFim lanca 400")
    void gerar_DataInicioDepoisFim_Lanca400() {
        LocalDate ini = LocalDate.of(2026, 7, 20);
        LocalDate fim = LocalDate.of(2026, 7, 10);

        assertThatThrownBy(() -> relatorioFinanceiroService.gerar(null, ini, fim, null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("início não pode ser posterior");
    }

    @Test
    @DisplayName("gerar: calcula totais somando porCategoria por tipo")
    void gerar_ComLancamentos_CalculaTotaisCorretamente() {
        LocalDate ini = LocalDate.of(2026, 7, 1);
        LocalDate fim = LocalDate.of(2026, 7, 31);

        List<CategoriaFinanceiraAgregado> agregados = List.of(
                agregado(1L, "Venda", TipoLancamento.RECEITA, "3000.00"),
                agregado(2L, "Aluguel", TipoLancamento.DESPESA, "1500.00"),
                agregado(3L, "Luz", TipoLancamento.DESPESA, "350.00")
        );
        when(lancamentoFinanceiroRepository.somarAgrupadoPorCategoria(any(), any(), eq(null)))
                .thenReturn(agregados);

        RelatorioFinanceiroResponse resp = relatorioFinanceiroService.gerar(null, ini, fim, null);

        assertThat(resp.totalReceitas()).isEqualByComparingTo("3000.00");
        assertThat(resp.totalDespesas()).isEqualByComparingTo("1850.00");
        assertThat(resp.saldo()).isEqualByComparingTo("1150.00");
        assertThat(resp.porCategoria()).hasSize(3);
    }

    @Test
    @DisplayName("gerar: filtro de categoriaId e repassa ao repository")
    void gerar_ComCategoriaId_RepassaFiltroAoRepository() {
        LocalDate ini = LocalDate.of(2026, 7, 1);
        LocalDate fim = LocalDate.of(2026, 7, 31);

        List<CategoriaFinanceiraAgregado> agregados = List.of(
                agregado(2L, "Aluguel", TipoLancamento.DESPESA, "1500.00")
        );
        when(lancamentoFinanceiroRepository.somarAgrupadoPorCategoria(any(), any(), eq(2L)))
                .thenReturn(agregados);

        RelatorioFinanceiroResponse resp = relatorioFinanceiroService.gerar(null, ini, fim, 2L);

        // so a categoria filtrada aparece no resultado
        assertThat(resp.porCategoria()).hasSize(1);
        assertThat(resp.porCategoria().get(0).categoriaNome()).isEqualTo("Aluguel");
        assertThat(resp.totalDespesas()).isEqualByComparingTo("1500.00");
        assertThat(resp.totalReceitas()).isEqualByComparingTo(BigDecimal.ZERO);

        // confirma que o id passou pro repository
        verify(lancamentoFinanceiroRepository).somarAgrupadoPorCategoria(any(), any(), eq(2L));
    }

    @Test
    @DisplayName("gerar: periodo sem lancamentos retorna zeros sem NullPointerException")
    void gerar_SemLancamentos_RetornaZerosSemNPE() {
        LocalDate ini = LocalDate.of(2026, 1, 1);
        LocalDate fim = LocalDate.of(2026, 1, 31);
        when(lancamentoFinanceiroRepository.somarAgrupadoPorCategoria(any(), any(), any()))
                .thenReturn(List.of());

        RelatorioFinanceiroResponse resp = relatorioFinanceiroService.gerar(null, ini, fim, null);

        assertThat(resp.porCategoria()).isEmpty();
        assertThat(resp.totalReceitas()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(resp.totalDespesas()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(resp.saldo()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("gerar: dtFim usa LocalTime.MAX (nao atStartOfDay)")
    void gerar_DtFimUsaLocalTimeMax() {
        LocalDate ini = LocalDate.of(2026, 7, 1);
        LocalDate fim = LocalDate.of(2026, 7, 31);
        when(lancamentoFinanceiroRepository.somarAgrupadoPorCategoria(any(), any(), any()))
                .thenReturn(List.of());

        relatorioFinanceiroService.gerar(null, ini, fim, null);

        // captura o argumento dtFim repassado ao repository
        var captor = org.mockito.ArgumentCaptor.forClass(LocalDateTime.class);
        verify(lancamentoFinanceiroRepository)
                .somarAgrupadoPorCategoria(any(), captor.capture(), any());

        // fim do dia — se fosse atStartOfDay(), lancamentos das 14h seriam perdidos
        assertThat(captor.getValue().toLocalTime()).isEqualTo(LocalTime.MAX);
    }
}
