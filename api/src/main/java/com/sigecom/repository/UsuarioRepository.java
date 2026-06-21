package com.sigecom.repository;

import com.sigecom.domain.Usuario;
import com.sigecom.domain.enums.TipoUsuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Usuario> findByPerfil(TipoUsuario perfil);
}
