package com.sigecom.service;

import com.sigecom.domain.enums.PeriodoRelatorio;
import com.sigecom.model.response.relatorio.RelatorioVendasResponse;
import com.sigecom.repository.UsuarioRepository;
import com.sigecom.repository.VendaRepository;
import com.sigecom.repository.projection.RelatorioVendasAgregado;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RelatorioVendasServiceTest {

    @Mock
    private VendaRepository vendaRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private RelatorioVendasService relatorioVendasService;

    private void mockAgregado(BigDecimal total, long quantidade) {
        when(vendaRepository.agregarPorPeriodo(any(), any(), any()))
                .thenReturn(new RelatorioVendasAgregado(total, quantidade));
    }

    // ── Cálculo do resumo ────────────────────────────────────────

    @Test
    void gerar_DeveCalcularTicketMedioComoTotalDivididoPelaQuantidade() {
        mockAgregado(new BigDecimal("1000.00"), 4);

        RelatorioVendasResponse resposta = relatorioVendasService.gerar(
                PeriodoRelatorio.MES, null, null, null);

        assertEquals(new BigDecimal("1000.00"), resposta.totalVendas());
        assertEquals(4L, resposta.quantidadeTransacoes());
        assertEquals(new BigDecimal("250.00"), resposta.ticketMedio());
    }

    @Test
    void gerar_DeveArredondarTicketMedioComHalfUpEmDuasCasas() {
        // 100 / 3 = 33.333... → 33.33
        mockAgregado(new BigDecimal("100.00"), 3);

        RelatorioVendasResponse resposta = relatorioVendasService.gerar(
                PeriodoRelatorio.MES, null, null, null);

        assertEquals(new BigDecimal("33.33"), resposta.ticketMedio());
    }

    @Test
    void gerar_SemVendas_DeveDevolverZerosSemDividirPorZero() {
        mockAgregado(BigDecimal.ZERO, 0);

        RelatorioVendasResponse resposta = relatorioVendasService.gerar(
                PeriodoRelatorio.MES, null, null, null);

        assertEquals(new BigDecimal("0.00"), resposta.totalVendas());
        assertEquals(0L, resposta.quantidadeTransacoes());
        assertEquals(new BigDecimal("0.00"), resposta.ticketMedio());
    }

    @Test
    void gerar_DefendeContraAgregadoComCamposNulos() {
        // Se a query mudar e devolver null, o service não pode estourar NPE.
        when(vendaRepository.agregarPorPeriodo(any(), any(), any()))
                .thenReturn(new RelatorioVendasAgregado(null, null));

        RelatorioVendasResponse resposta = relatorioVendasService.gerar(
                PeriodoRelatorio.DIA, null, null, null);

        assertEquals(new BigDecimal("0.00"), resposta.totalVendas());
        assertEquals(0L, resposta.quantidadeTransacoes());
        assertEquals(new BigDecimal("0.00"), resposta.ticketMedio());
    }

    // ── Resolução do período ─────────────────────────────────────

    @Test
    void gerar_PresetDia_DeveConsultarOIntervaloDoDiaDeHoje() {
        mockAgregado(new BigDecimal("50.00"), 1);

        RelatorioVendasResponse resposta = relatorioVendasService.gerar(
                PeriodoRelatorio.DIA, null, null, null);

        LocalDate hoje = LocalDate.now();
        assertEquals(hoje, resposta.dataInicio());
        assertEquals(hoje, resposta.dataFim());

        // Datas convertidas: início no começo do dia, fim no último instante.
        verify(vendaRepository).agregarPorPeriodo(
                eq(hoje.atStartOfDay()), eq(hoje.atTime(LocalTime.MAX)), isNull());
    }

    @Test
    void gerar_SemPeriodoESemDatas_DeveUsarMesCorrenteComoPadrao() {
        mockAgregado(new BigDecimal("500.00"), 5);

        RelatorioVendasResponse resposta = relatorioVendasService.gerar(
                null, null, null, null);

        PeriodoRelatorio.Intervalo mes = PeriodoRelatorio.MES.intervalo(LocalDate.now());
        assertEquals(mes.inicio(), resposta.dataInicio());
        assertEquals(mes.fim(), resposta.dataFim());
    }

    @Test
    void gerar_PeriodoPersonalizado_TemPrioridadeSobreOPreset() {
        mockAgregado(new BigDecimal("800.00"), 8);
        LocalDate inicio = LocalDate.of(2026, 3, 1);
        LocalDate fim = LocalDate.of(2026, 3, 15);

        // Mesmo passando o preset DIA, as datas explícitas devem vencer.
        RelatorioVendasResponse resposta = relatorioVendasService.gerar(
                PeriodoRelatorio.DIA, inicio, fim, null);

        assertEquals(inicio, resposta.dataInicio());
        assertEquals(fim, resposta.dataFim());

        ArgumentCaptor<LocalDateTime> inicioCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> fimCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(vendaRepository).agregarPorPeriodo(inicioCaptor.capture(), fimCaptor.capture(), isNull());
        assertEquals(inicio.atStartOfDay(), inicioCaptor.getValue());
        assertEquals(fim.atTime(LocalTime.MAX), fimCaptor.getValue());
    }

    @Test
    void gerar_PeriodoPersonalizadoComParIncompleto_DeveDevolver400() {
        // só dataInicio
        ResponseStatusException apenasInicio = assertThrows(ResponseStatusException.class,
                () -> relatorioVendasService.gerar(null, LocalDate.of(2026, 3, 1), null, null));
        assertEquals(HttpStatus.BAD_REQUEST, apenasInicio.getStatusCode());

        // só dataFim
        ResponseStatusException apenasFim = assertThrows(ResponseStatusException.class,
                () -> relatorioVendasService.gerar(null, null, LocalDate.of(2026, 3, 1), null));
        assertEquals(HttpStatus.BAD_REQUEST, apenasFim.getStatusCode());

        verifyNoInteractions(vendaRepository);
    }

    @Test
    void gerar_PeriodoPersonalizadoInvertido_DeveDevolver400() {
        LocalDate inicio = LocalDate.of(2026, 3, 15);
        LocalDate fim = LocalDate.of(2026, 3, 1);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> relatorioVendasService.gerar(null, inicio, fim, null));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verify(vendaRepository, never()).agregarPorPeriodo(any(), any(), any());
    }

    // ── Filtro por funcionário ───────────────────────────────────

    @Test
    void gerar_ComFuncionarioExistente_DeveRepassarOIdParaAConsulta() {
        when(usuarioRepository.existsById(7L)).thenReturn(true);
        mockAgregado(new BigDecimal("300.00"), 2);

        RelatorioVendasResponse resposta = relatorioVendasService.gerar(
                PeriodoRelatorio.MES, null, null, 7L);

        assertEquals(7L, resposta.funcionarioId());
        verify(vendaRepository).agregarPorPeriodo(any(), any(), eq(7L));
    }

    @Test
    void gerar_ComFuncionarioInexistente_DeveDevolver404SemConsultarVendas() {
        when(usuarioRepository.existsById(99L)).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> relatorioVendasService.gerar(PeriodoRelatorio.MES, null, null, 99L));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        verify(vendaRepository, never()).agregarPorPeriodo(any(), any(), any());
    }

    @Test
    void gerar_SemFuncionario_NaoConsultaExistenciaEPassaNull() {
        mockAgregado(new BigDecimal("100.00"), 1);

        RelatorioVendasResponse resposta = relatorioVendasService.gerar(
                PeriodoRelatorio.MES, null, null, null);

        assertNull(resposta.funcionarioId());
        verifyNoInteractions(usuarioRepository);
        verify(vendaRepository).agregarPorPeriodo(any(), any(), isNull());
    }
}
