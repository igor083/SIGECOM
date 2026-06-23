package com.sigecom.model.response.categoria;

import com.sigecom.domain.CategoriaProduto;
import lombok.Builder;

@Builder
public record CategoriaProdutoResponse(
        Long id,
        String nome
) {

    public static CategoriaProdutoResponse toResponse(CategoriaProduto categoria) {
        return CategoriaProdutoResponse.builder()
                .id(categoria.getId())
                .nome(categoria.getNome())
                .build();
    }
}
