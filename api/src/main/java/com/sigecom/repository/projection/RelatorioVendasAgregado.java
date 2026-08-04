package com.sigecom.repository.projection;

import java.math.BigDecimal;

/**
 * Resultado bruto da agregação de vendas por período (US — Relatório de Vendas).
 *
 * Preenchido por uma constructor expression JPQL em
 * {@link com.sigecom.repository.VendaRepository#agregarPorPeriodo}:
 *  - totalVendas          → COALESCE(SUM(v.total), 0) (nunca null)
 *  - quantidadeTransacoes → COUNT(v.id) (0 quando não há vendas)
 *
 * O ticket médio NÃO é calculado aqui: é uma regra de negócio (divisão com
 * guarda de divisão por zero) que pertence ao service.
 */
public record RelatorioVendasAgregado(BigDecimal totalVendas, Long quantidadeTransacoes) {}