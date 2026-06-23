package com.sigecom.model.response.produto;

import com.sigecom.domain.Produto;
import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record ProdutoResponse(
        Long id,
        String nome,
        String descricao,
        BigDecimal preco,
        Long categoriaId,
        String categoriaNome,
        Integer qtdEstoque,
        boolean ativo
) {

    public static ProdutoResponse toResponse(Produto produto) {
        return ProdutoResponse.builder()
                .id(produto.getId())
                .nome(produto.getNome())
                .descricao(produto.getDescricao())
                .preco(produto.getPreco())
                .categoriaId(produto.getCategoria().getId())
                .categoriaNome(produto.getCategoria().getNome())
                .qtdEstoque(produto.getQtdEstoque())
                .ativo(produto.isAtivo())
                .build();
    }
}
