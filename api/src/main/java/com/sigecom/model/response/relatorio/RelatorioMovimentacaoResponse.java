package com.sigecom.model.response.relatorio;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record RelatorioMovimentacaoResponse(
        LocalDate dataInicio,
        LocalDate dataFim,
        Long produtoId,
        Long categoriaId,
        Resumo resumo,
        List<MovimentacaoProduto> porProduto,
        List<MovimentacaoDia> porDia
) {

    public record Resumo(
            long totalUnidades,
            BigDecimal totalReceita,
            long produtosDistintos
    ) {}

    public record MovimentacaoProduto(
            Long produtoId,
            String produtoNome,
            String categoriaNome,
            long unidades,
            BigDecimal receita,
            long numVendas
    ) {}

    public record MovimentacaoDia(
            LocalDate data,
            long unidades,
            BigDecimal receita
    ) {}
}
