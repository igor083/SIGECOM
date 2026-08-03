package com.sigecom.model.response.relatorio;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Resumo consolidado do relatório de vendas por período
 * (US — Relatório de Vendas por Período).
 *
 * @param totalVendas          soma dos totais das vendas do período
 * @param quantidadeTransacoes número de vendas no período
 * @param ticketMedio          totalVendas / quantidadeTransacoes (0 quando não há vendas)
 * @param dataInicio           início efetivo do período considerado (inclusivo)
 * @param dataFim              fim efetivo do período considerado (inclusivo)
 * @param funcionarioId        funcionário filtrado, ou null quando o relatório é geral
 */
public record RelatorioVendasResponse(
        BigDecimal totalVendas,
        long quantidadeTransacoes,
        BigDecimal ticketMedio,
        LocalDate dataInicio,
        LocalDate dataFim,
        Long funcionarioId
) {}
