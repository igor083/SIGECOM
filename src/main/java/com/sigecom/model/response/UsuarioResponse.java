package com.sigecom.model.response;

import com.sigecom.domain.enums.TipoUsuario;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record UsuarioResponse(
        Long id,
        String nome,
        String email,
        TipoUsuario perfil,
        boolean ativo,
        LocalDateTime criadoEm
) {}
