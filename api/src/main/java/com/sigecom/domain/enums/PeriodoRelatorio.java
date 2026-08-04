package com.sigecom.domain.enums;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

/**
 * Presets de período do relatório de vendas (US — Relatório de Vendas por Período).
 *
 * Cada valor sabe converter uma data de referência (normalmente "hoje") no
 * intervalo de datas correspondente. A lógica de datas fica aqui — encapsulada
 * e testável de forma isolada — em vez de espalhada no service.
 *
 * Convenções:
 *  - DIA    → o próprio dia de referência.
 *  - SEMANA → semana ISO que contém a referência (segunda a domingo).
 *  - MES    → primeiro ao último dia do mês da referência.
 *
 * O intervalo é sempre inclusivo nas duas pontas ([inicio, fim]); a conversão
 * para LocalDateTime (com atStartOfDay / atTime(MAX)) é responsabilidade do service.
 */
public enum PeriodoRelatorio {

    DIA {
        @Override
        public Intervalo intervalo(LocalDate referencia) {
            return new Intervalo(referencia, referencia);
        }
    },

    SEMANA {
        @Override
        public Intervalo intervalo(LocalDate referencia) {
            LocalDate inicio = referencia.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            LocalDate fim = referencia.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
            return new Intervalo(inicio, fim);
        }
    },

    MES {
        @Override
        public Intervalo intervalo(LocalDate referencia) {
            LocalDate inicio = referencia.with(TemporalAdjusters.firstDayOfMonth());
            LocalDate fim = referencia.with(TemporalAdjusters.lastDayOfMonth());
            return new Intervalo(inicio, fim);
        }
    };

    /**
     * Intervalo de datas inclusivo resolvido a partir da data de referência.
     */
    public abstract Intervalo intervalo(LocalDate referencia);

    /**
     * Par de datas [inicio, fim] inclusivo. Valor imutável usado para
     * transportar o resultado de {@link #intervalo(LocalDate)}.
     */
    public record Intervalo(LocalDate inicio, LocalDate fim) {}
}
