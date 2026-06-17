package com.sigecom.service;

import com.sigecom.domain.Usuario;
import com.sigecom.model.request.auth.CadastroRequest;
import com.sigecom.model.request.auth.EditUserRequest;
import com.sigecom.model.request.auth.LoginRequest;
import com.sigecom.model.response.auth.LoginResponse;
import com.sigecom.model.response.auth.UsuarioResponse;
import com.sigecom.repository.UsuarioRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@AllArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.senha())
        );

        Usuario usuario = usuarioRepository.findByEmail(request.email()).orElseThrow();

        String token = jwtService.generateToken(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getPerfil().name()
        );

        return new LoginResponse(token, jwtService.getExpirationMs());
    }

    public UsuarioResponse cadastro(CadastroRequest request) {
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
        }

        Usuario usuario = Usuario.builder()
                .nome(request.nome())
                .email(request.email())
                .senhaHash(passwordEncoder.encode(request.senha()))
                .perfil(request.perfil())
                .build();

        Usuario salvo = usuarioRepository.save(usuario);
        log.info("Novo usuário cadastrado: {}", salvo.getEmail());

        return toResponse(salvo);
    }

    public UsuarioResponse editar(Long id, EditUserRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        if (request.nome() != null) {
            usuario.setNome(request.nome());
        }

        if (request.email() != null && !request.email().equalsIgnoreCase(usuario.getEmail())) {
            if (usuarioRepository.existsByEmail(request.email())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
            }
            usuario.setEmail(request.email());
        }

        if (request.senha() != null) {
            usuario.setSenhaHash(passwordEncoder.encode(request.senha()));
        }

        if (request.perfil() != null) {
            usuario.setPerfil(request.perfil());
        }

        if (request.ativo() != null) {
            usuario.setAtivo(request.ativo());
        }

        Usuario atualizado = usuarioRepository.save(usuario);
        log.info("Usuário atualizado: {}", atualizado.getEmail());

        return toResponse(atualizado);
    }

    public void remover(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        String emailAutenticado = SecurityContextHolder.getContext().getAuthentication().getName();
        if (usuario.getEmail().equalsIgnoreCase(emailAutenticado)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Não é permitido remover o próprio usuário");
        }

        usuarioRepository.delete(usuario);
        log.info("Usuário removido: {}", usuario.getEmail());
    }

    private UsuarioResponse toResponse(Usuario usuario) {
        return UsuarioResponse.builder()
                .id(usuario.getId())
                .nome(usuario.getNome())
                .email(usuario.getEmail())
                .perfil(usuario.getPerfil())
                .ativo(usuario.isAtivo())
                .criadoEm(usuario.getCriadoEm())
                .build();
    }
}
