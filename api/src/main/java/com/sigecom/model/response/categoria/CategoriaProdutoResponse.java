package com.sigecom.model.response.categoria;

import com.sigecom.domain.CategoriaProduto;
import lombok.Builder;

@Builder
public record CategoriaProdutoResponse(
        Long id,
        String nome,
        Long quantidadeProdutos
) {

    public static CategoriaProdutoResponse toResponse(CategoriaProduto categoria) {
        return CategoriaProdutoResponse.builder()
                .id(categoria.getId())
                .nome(categoria.getNome())
                .quantidadeProdutos(0L)
                .build();
    }

    public static CategoriaProdutoResponse toResponse(CategoriaProduto categoria, long count) {
        return CategoriaProdutoResponse.builder()
                .id(categoria.getId())
                .nome(categoria.getNome())
                .quantidadeProdutos(count)
                .build();
    }
}
