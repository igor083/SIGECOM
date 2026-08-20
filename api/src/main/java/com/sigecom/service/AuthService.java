package com.sigecom.service;

import com.sigecom.domain.Usuario;
import com.sigecom.domain.enums.TipoUsuario;
import com.sigecom.model.request.auth.CadastroRequest;
import com.sigecom.model.request.auth.EditUserRequest;
import com.sigecom.model.request.auth.LoginRequest;
import com.sigecom.model.request.auth.ResetSenhaRequest;
import com.sigecom.model.request.auth.TrocarSenhaRequest;
import com.sigecom.model.response.auth.LoginResponse;
import com.sigecom.model.response.auth.UsuarioResponse;
import com.sigecom.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static com.sigecom.model.response.auth.UsuarioResponse.toResponse;

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

        return montarLoginResponse(usuario);
    }

    @Transactional
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

    @Transactional
    public UsuarioResponse editar(Long id, EditUserRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        if (request.nome() != null) {
            // trim igual ao ProdutoService, senao "  Danilo  " grava com os espacos
            usuario.setNome(request.nome().trim());
        }

        if (request.email() != null && !request.email().equalsIgnoreCase(usuario.getEmail())) {
            if (usuarioRepository.existsByEmail(request.email())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
            }
            usuario.setEmail(request.email());
        }

        if (request.perfil() != null) {
            usuario.setPerfil(request.perfil());
        }

        Usuario atualizado = usuarioRepository.save(usuario);
        log.info("Usuário atualizado: {}", atualizado.getEmail());

        return toResponse(atualizado);
    }

    /**
     * Remove o usuário desligando a flag `ativo` — a linha continua no banco.
     *
     * O DELETE físico não é possível aqui: venda, lancamento_financeiro e
     * fechamento_caixa referenciam usuario com FK NOT NULL, e são registros
     * contábeis. Apagar a linha violaria a constraint; apagar em cascata
     * levaria junto as vendas do operador e o histórico de caixa deixaria de
     * fechar. A flag resolve sem tocar em nada disso: o usuário some da
     * listagem, perde o acesso, e a autoria dos registros dele fica intacta.
     *
     * Perder o acesso não é efeito colateral de UI: o UserDetailsServiceImpl
     * passa `ativo` como o flag `enabled` do Spring Security, então o login é
     * recusado no próprio AuthenticationManager.
     *
     * Não há reativação por decisão de produto — uma vez removido, o usuário
     * não volta a aparecer em lugar nenhum.
     */
    @Transactional
    public void remover(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        String emailAutenticado = SecurityContextHolder.getContext().getAuthentication().getName();
        if (usuario.getEmail().equalsIgnoreCase(emailAutenticado)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Não é permitido remover o próprio usuário");
        }

        // Idempotente: remover duas vezes não é erro, o estado final é o mesmo.
        usuario.setAtivo(false);
        usuarioRepository.save(usuario);
        log.info("Usuário removido (desativado): {}", usuario.getEmail());
    }

    @Transactional
    public LoginResponse trocarMinhaSenha(String email, TrocarSenhaRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        if (!passwordEncoder.matches(request.senhaAtual(), usuario.getSenhaHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Senha atual incorreta");
        }

        usuario.setSenhaHash(passwordEncoder.encode(request.senhaNova()));
        usuario.setSenhaTemporaria(false);
        Usuario atualizado = usuarioRepository.save(usuario);
        log.info("Senha trocada pelo próprio usuário: {}", atualizado.getEmail());

        return montarLoginResponse(atualizado);
    }

    @Transactional
    public void resetarSenhaFuncionario(Long id, ResetSenhaRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        if (usuario.getPerfil() == TipoUsuario.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Não é permitido redefinir senha de outro administrador");
        }

        usuario.setSenhaHash(passwordEncoder.encode(request.senhaNova()));
        usuario.setSenhaTemporaria(true);
        usuarioRepository.save(usuario);
        log.info("Senha do funcionário {} resetada por {}", usuario.getEmail(),
                SecurityContextHolder.getContext().getAuthentication().getName());
    }

    private LoginResponse montarLoginResponse(Usuario usuario) {
        String token = jwtService.generateToken(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getPerfil().name(),
                usuario.isSenhaTemporaria()
        );
        return LoginResponse.builder()
                .token(token)
                .expiresIn(jwtService.getExpirationMs())
                .senhaTemporaria(usuario.isSenhaTemporaria())
                .build();
    }
}
