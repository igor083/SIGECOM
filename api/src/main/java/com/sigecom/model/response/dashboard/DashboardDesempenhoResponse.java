package com.sigecom.model.response.dashboard;

import com.sigecom.domain.enums.TipoPagamento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DashboardDesempenhoResponse(
        BigDecimal totalVendas,
        long quantidadeTransacoes,
        BigDecimal ticketMedio,
        long itensEmAlerta,
        BigDecimal totalReceitas,
        BigDecimal totalDespesas,
        BigDecimal saldoFinanceiro,
        LocalDate dataInicio,
        LocalDate dataFim,
        List<VendaDiaria> vendasPorDia,
        List<FormaPagamento> vendasPorFormaPagamento,
        List<TopProduto> topProdutos
) {
    public record VendaDiaria(LocalDate data, BigDecimal total, long quantidade) {}
    public record FormaPagamento(TipoPagamento tipo, BigDecimal total, long quantidade) {}
    public record TopProduto(Long produtoId, String nome, String categoria, long unidades, BigDecimal receita) {}
}
