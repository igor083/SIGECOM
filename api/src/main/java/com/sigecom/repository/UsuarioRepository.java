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
    /**
     * Alimenta o seletor de funcionários (/auth/usuarios/funcionarios). Só
     * ativos: usuário removido não deve aparecer em campo de escolha, senão
     * dá para atribuir trabalho novo a quem já saiu.
     */
    List<Usuario> findByPerfilAndAtivoTrue(TipoUsuario perfil);

    /**
     * Usuários da tela de gestão. Só os ativos: remover um usuário desliga a
     * flag (ver AuthService.remover), e removido não reaparece — não existe
     * reativação, então uma listagem "todos" só mostraria lixo inacessível.
     */
    @Query(value =
           "SELECT u FROM Usuario u WHERE u.ativo = true AND " +
           "(:busca IS NULL OR LOWER(u.nome) LIKE LOWER(CONCAT('%', CAST(:busca AS String), '%')) " +
           "   OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:busca AS String), '%'))) " +
           "AND (:perfil IS NULL OR u.perfil = :perfil)",
           countQuery =
           "SELECT count(u) FROM Usuario u WHERE u.ativo = true AND " +
           "(:busca IS NULL OR LOWER(u.nome) LIKE LOWER(CONCAT('%', CAST(:busca AS String), '%')) " +
           "   OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:busca AS String), '%'))) " +
           "AND (:perfil IS NULL OR u.perfil = :perfil)")
    Page<Usuario> findAllFiltrado(@Param("busca") String busca,
                                  @Param("perfil") TipoUsuario perfil,
                                  Pageable pageable);
}
