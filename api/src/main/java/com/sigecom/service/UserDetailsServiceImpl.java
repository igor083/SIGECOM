package com.sigecom.service;

import com.sigecom.domain.Usuario;
import com.sigecom.domain.enums.TipoUsuario;
import com.sigecom.model.response.auth.UsuarioResponse;
import com.sigecom.repository.UsuarioRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public UserDetailsServiceImpl(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = buscarUsuario(email);

        return new User(
                usuario.getEmail(),
                usuario.getSenhaHash(),
                usuario.isAtivo(),
                true,
                true,
                true,
                List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getPerfil().name()))
        );
    }

    public UsuarioResponse buscarPorEmail(String email) {
        return UsuarioResponse.toResponse(buscarUsuario(email));
    }

    public List<UsuarioResponse> listarPorPerfil(TipoUsuario perfil) {
        return usuarioRepository.findByPerfil(perfil).stream()
                .map(UsuarioResponse::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<UsuarioResponse> listarTodos(String busca, TipoUsuario perfil, Pageable pageable) {
        return usuarioRepository.findAllFiltrado(busca, perfil, pageable)
                .map(UsuarioResponse::toResponse);
    }

    private Usuario buscarUsuario(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));
    }

}
