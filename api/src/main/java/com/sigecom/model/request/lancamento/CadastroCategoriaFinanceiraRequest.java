package com.sigecom.model.request.lancamento;

import com.sigecom.domain.enums.TipoLancamento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CadastroCategoriaFinanceiraRequest(

        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres")
        String nome,

        @NotNull(message = "O tipo é obrigatório")
        TipoLancamento tipo
) {}
