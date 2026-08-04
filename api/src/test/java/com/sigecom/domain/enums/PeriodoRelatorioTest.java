package com.sigecom.domain.enums;

import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PeriodoRelatorioTest {

    @Test
    void dia_DeveDevolverOProprioDiaNasDuasPontas() {
        LocalDate ref = LocalDate.of(2026, 8, 3); // segunda-feira

        PeriodoRelatorio.Intervalo intervalo = PeriodoRelatorio.DIA.intervalo(ref);

        assertEquals(ref, intervalo.inicio());
        assertEquals(ref, intervalo.fim());
    }

    @Test
    void semana_DeveIrDeSegundaADomingoContendoAReferencia() {
        // Quarta-feira: a semana ISO vai de 03/08 (seg) a 09/08 (dom).
        LocalDate quarta = LocalDate.of(2026, 8, 5);

        PeriodoRelatorio.Intervalo intervalo = PeriodoRelatorio.SEMANA.intervalo(quarta);

        assertEquals(LocalDate.of(2026, 8, 3), intervalo.inicio());
        assertEquals(LocalDate.of(2026, 8, 9), intervalo.fim());
        assertEquals(DayOfWeek.MONDAY, intervalo.inicio().getDayOfWeek());
        assertEquals(DayOfWeek.SUNDAY, intervalo.fim().getDayOfWeek());
    }

    @Test
    void semana_QuandoReferenciaEhDomingo_NaoAvancaParaProximaSemana() {
        LocalDate domingo = LocalDate.of(2026, 8, 9);

        PeriodoRelatorio.Intervalo intervalo = PeriodoRelatorio.SEMANA.intervalo(domingo);

        assertEquals(LocalDate.of(2026, 8, 3), intervalo.inicio());
        assertEquals(domingo, intervalo.fim());
    }

    @Test
    void mes_DeveIrDoPrimeiroAoUltimoDiaDoMes() {
        LocalDate ref = LocalDate.of(2026, 2, 15); // fevereiro de 2026 tem 28 dias

        PeriodoRelatorio.Intervalo intervalo = PeriodoRelatorio.MES.intervalo(ref);

        assertEquals(LocalDate.of(2026, 2, 1), intervalo.inicio());
        assertEquals(LocalDate.of(2026, 2, 28), intervalo.fim());
    }

    @Test
    void mes_DeveRespeitarUltimoDiaEmMesDe31Dias() {
        LocalDate ref = LocalDate.of(2026, 1, 10);

        PeriodoRelatorio.Intervalo intervalo = PeriodoRelatorio.MES.intervalo(ref);

        assertEquals(LocalDate.of(2026, 1, 1), intervalo.inicio());
        assertEquals(LocalDate.of(2026, 1, 31), intervalo.fim());
    }
}
