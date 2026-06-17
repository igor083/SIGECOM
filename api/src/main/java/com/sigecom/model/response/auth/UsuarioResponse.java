package com.sigecom.model.response.auth;

import com.sigecom.domain.Usuario;
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
        LocalDateTime criadoEm,
        boolean senhaTemporaria

) {

    public static UsuarioResponse toResponse(Usuario usuario) {
        return UsuarioResponse.builder()
                .id(usuario.getId())
                .nome(usuario.getNome())
                .email(usuario.getEmail())
                .perfil(usuario.getPerfil())
                .ativo(usuario.isAtivo())
                .criadoEm(usuario.getCriadoEm())
                .senhaTemporaria(usuario.isSenhaTemporaria())

                .build();
    }
}
