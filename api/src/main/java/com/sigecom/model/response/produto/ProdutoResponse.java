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
        CategoriaInfo categoria,
        Integer qtdEstoque,
        Integer estoqueMinimo,
        boolean ativo
) {

    public record CategoriaInfo(Long id, String nome) {}

    public static ProdutoResponse toResponse(Produto produto) {
        return ProdutoResponse.builder()
                .id(produto.getId())
                .nome(produto.getNome())
                .descricao(produto.getDescricao())
                .preco(produto.getPreco())
                .categoria(new CategoriaInfo(produto.getCategoria().getId(), produto.getCategoria().getNome()))
                .qtdEstoque(produto.getQtdEstoque())
                .estoqueMinimo(produto.getEstoqueMinimo())
                .ativo(produto.isAtivo())
                .build();
    }
}
