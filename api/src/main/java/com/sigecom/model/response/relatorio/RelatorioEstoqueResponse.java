package com.sigecom.model.response.relatorio;

import com.sigecom.domain.enums.StatusEstoque;

import java.math.BigDecimal;
import java.util.List;

public record RelatorioEstoqueResponse(Resumo resumo, List<ItemEstoque> itens) {

    public record Resumo(
            long totalProdutos,
            long emAlerta,
            long emCritico,
            BigDecimal valorTotalEstoque
    ) {}

    public record ItemEstoque(
            Long id,
            String nome,
            Long categoriaId,
            String categoriaNome,
            Integer qtdEstoque,
            Integer estoqueMinimo,
            BigDecimal preco,
            BigDecimal valorEmEstoque,
            StatusEstoque status
    ) {}
}
