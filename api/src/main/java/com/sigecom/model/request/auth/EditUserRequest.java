package com.sigecom.model.request.auth;

import com.sigecom.domain.enums.TipoUsuario;
import jakarta.validation.constraints.Email;
import lombok.Builder;

@Builder
public record EditUserRequest(

        String nome,

        @Email
        String email,

        TipoUsuario perfil,

        Boolean ativo
) {}
