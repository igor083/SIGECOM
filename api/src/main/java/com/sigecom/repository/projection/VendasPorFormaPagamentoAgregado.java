package com.sigecom.repository.projection;

import com.sigecom.domain.enums.TipoPagamento;

import java.math.BigDecimal;

/**
 * Total e quantidade de vendas agrupados por forma de pagamento
 * (US — Relatório de Vendas).
 *
 * Alimenta o gráfico de distribuição por forma de pagamento no front.
 * Preenchido por uma constructor expression JPQL em
 * {@link com.sigecom.repository.VendaRepository#agregarPorFormaPagamento}:
 *  - tipoPagamento → v.tipoPagamento
 *  - total         → COALESCE(SUM(v.total), 0) (nunca null)
 *  - quantidade    → COUNT(v.id)
 *
 * Só aparecem formas de pagamento efetivamente usadas no período.
 */
public record VendasPorFormaPagamentoAgregado(TipoPagamento tipoPagamento,
                                              BigDecimal total,
                                              Long quantidade) {}
