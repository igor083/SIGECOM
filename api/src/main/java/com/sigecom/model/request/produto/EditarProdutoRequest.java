package com.sigecom.model.request.produto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record EditarProdutoRequest (
	
	@NotBlank(message = "O nome é obrigatório")
	@Size(max = 255)
	String nome,
	
	@Size(max = 500)
	String descricao,

	// SCRUM-160: opcional. Produto sem imagem continua valido.
	@Size(max = 500, message = "O link da imagem deve ter no máximo 500 caracteres")
	@Pattern(regexp = "^$|^https?://.*", message = "O link da imagem deve começar com http:// ou https://")
	String imagemUrl,

	@NotNull(message = "O preço é obrigatório")
	@DecimalMin(value = "0.00", message = "O preço não pode ser negativo")
	BigDecimal preco,
	
	@NotNull(message = "A categoria é obrigatória")
	Long categoriaId,
	
	@NotNull(message = "O estoque mínimo é obrigatório")
	@Min(value = 0, message = "O estoque mínimo não pode ser negativo")
	Integer estoqueMinimo
	)
{}
