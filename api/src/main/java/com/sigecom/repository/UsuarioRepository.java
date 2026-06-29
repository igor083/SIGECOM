package com.sigecom.repository;

import com.sigecom.domain.Usuario;
import com.sigecom.domain.enums.TipoUsuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Usuario> findByPerfil(TipoUsuario perfil);

    @Query(value =
           "SELECT u FROM Usuario u WHERE " +
           "(:busca IS NULL OR LOWER(u.nome) LIKE LOWER(CONCAT('%', CAST(:busca AS String), '%')) " +
           "   OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:busca AS String), '%'))) " +
           "AND (:perfil IS NULL OR u.perfil = :perfil)",
           countQuery =
           "SELECT count(u) FROM Usuario u WHERE " +
           "(:busca IS NULL OR LOWER(u.nome) LIKE LOWER(CONCAT('%', CAST(:busca AS String), '%')) " +
           "   OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:busca AS String), '%'))) " +
           "AND (:perfil IS NULL OR u.perfil = :perfil)")
    Page<Usuario> findAllFiltrado(@Param("busca") String busca,
                                  @Param("perfil") TipoUsuario perfil,
                                  Pageable pageable);
}
