package com.sigecom.service;

import com.sigecom.domain.Usuario;
import com.sigecom.model.request.CadastroRequest;
import com.sigecom.model.request.LoginRequest;
import com.sigecom.model.response.LoginResponse;
import com.sigecom.model.response.UsuarioResponse;
import com.sigecom.repository.UsuarioRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service

@AllArgsConstructor
public class AuthService {

    @Autowired
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

        Usuario usuario = new Usuario();
        usuario.setNome(request.nome());
        usuario.setEmail(request.email());
        usuario.setSenhaHash(passwordEncoder.encode(request.senha()));
        usuario.setPerfil(request.perfil());

        usuarioRepository.save(usuario);
        log.info("Novo usuário cadastrado: {}", usuario.getEmail());

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
