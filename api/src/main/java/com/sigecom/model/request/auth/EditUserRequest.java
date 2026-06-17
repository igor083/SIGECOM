package com.sigecom.model.request.auth;

import com.sigecom.domain.enums.TipoUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
public record EditUserRequest(

        String nome,

        @Email
        String email,

        @Size(min = 6)
        String senha,

        TipoUsuario perfil,

        Boolean ativo
) {}
