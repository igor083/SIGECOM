package com.sigecom.model.response.relatorio;

import com.sigecom.domain.enums.TipoPagamento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Resumo consolidado do relatório de vendas por período
 * (US — Relatório de Vendas por Período).
 *
 * @param totalVendas             soma dos totais das vendas do período
 * @param quantidadeTransacoes    número de vendas no período
 * @param ticketMedio             totalVendas / quantidadeTransacoes (0 quando não há vendas)
 * @param dataInicio              início efetivo do período considerado (inclusivo)
 * @param dataFim                 fim efetivo do período considerado (inclusivo)
 * @param funcionarioId           funcionário filtrado, ou null quando o relatório é geral
 * @param vendasPorDia            série diária (total/quantidade por dia) para o gráfico de barras;
 *                                só contém dias com vendas, em ordem cronológica
 * @param vendasPorFormaPagamento distribuição por forma de pagamento para o gráfico de rosca;
 *                                só contém formas usadas no período, do maior total para o menor
 */
public record RelatorioVendasResponse(
        BigDecimal totalVendas,
        long quantidadeTransacoes,
        BigDecimal ticketMedio,
        LocalDate dataInicio,
        LocalDate dataFim,
        Long funcionarioId,
        List<VendaDiaria> vendasPorDia,
        List<VendaPorFormaPagamento> vendasPorFormaPagamento
) {

    /** Ponto da série diária de vendas. */
    public record VendaDiaria(LocalDate data, BigDecimal total, long quantidade) {}

    /** Fatia da distribuição de vendas por forma de pagamento. */
    public record VendaPorFormaPagamento(TipoPagamento tipoPagamento, BigDecimal total, long quantidade) {}
}
