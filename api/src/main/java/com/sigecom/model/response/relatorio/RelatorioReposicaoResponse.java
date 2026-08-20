package com.sigecom.model.response.relatorio;

import com.sigecom.domain.enums.StatusEstoque;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record RelatorioReposicaoResponse(Resumo resumo, List<ItemReposicao> itens) {

    public record Resumo(
            long produtosParaRepor,
            long unidadesSugeridas,
            // Produto nao tem custo cadastrado, entao o valor sai do preco de venda
            BigDecimal valorEstimadoPrecoVenda,
            int janelaDias,
            int coberturaDias,
            LocalDate dataInicio,
            LocalDate dataFim
    ) {}

    public record ItemReposicao(
            Long produtoId,
            String nome,
            Long categoriaId,
            String categoriaNome,
            Integer qtdEstoque,
            Integer estoqueMinimo,
            long unidadesVendidas,
            BigDecimal giroDiario,
            int sugestaoCompra,
            BigDecimal precoUnitario,
            BigDecimal valorEstimadoPrecoVenda,
            StatusEstoque status
    ) {}
}
