package com.sigecom.repository.projection;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Total e quantidade de vendas agrupados por dia (US — Relatório de Vendas).
 *
 * Alimenta o gráfico de "vendas por dia" no front. Preenchido por uma
 * constructor expression JPQL em
 * {@link com.sigecom.repository.VendaRepository#agregarPorDia}:
 *  - data       → CAST(v.dataHora AS date) (dia da venda)
 *  - total      → COALESCE(SUM(v.total), 0) (nunca null)
 *  - quantidade → COUNT(v.id)
 *
 * Só aparecem dias com pelo menos uma venda; dias vazios são omitidos.
 */
public record VendasPorDiaAgregado(LocalDate data, BigDecimal total, Long quantidade) {}