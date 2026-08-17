package com.sigecom.seeder.repository;

import com.sigecom.seeder.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Chave natural do usuario: o email. Base de toda idempotencia aqui.
    Optional<Usuario> findByEmail(String email);

    List<Usuario> findByEmailIn(List<String> emails);
}
