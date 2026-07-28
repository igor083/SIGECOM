package com.sigecom.model.request.lancamento;

import com.sigecom.domain.enums.TipoLancamento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// tipo é opcional: quando nulo, mantém o tipo atual da categoria.
// Só é possível alterar o tipo enquanto a categoria não tiver lançamentos.
public record EditCategoriaFinanceiraRequest(

        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres")
        String nome,

        TipoLancamento tipo
) {}
