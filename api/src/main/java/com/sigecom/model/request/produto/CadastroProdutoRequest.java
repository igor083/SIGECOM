package com.sigecom.model.request.produto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CadastroProdutoRequest(

        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 255, message = "O nome deve ter no máximo 255 caracteres")
        String nome,

        @Size(max = 500, message = "A descrição deve ter no máximo 500 caracteres")
        String descricao,

        // SCRUM-160: opcional. Produto sem imagem continua valido.
        @Size(max = 500, message = "O link da imagem deve ter no máximo 500 caracteres")
        @Pattern(regexp = "^$|^https?://.*", message = "O link da imagem deve começar com http:// ou https://")
        String imagemUrl,

        @DecimalMin(value = "0.00", message = "O preço não pode ser negativo")
        BigDecimal preco,

        @NotNull(message = "A categoria é obrigatória")
        Long categoriaId,

        @Min(value = 0, message = "A quantidade inicial não pode ser negativa")
        Integer qtdEstoqueInicial
) {}
