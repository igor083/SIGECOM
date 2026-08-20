package com.sigecom.controller.auth;

import com.sigecom.domain.enums.TipoUsuario;
import com.sigecom.model.request.auth.CadastroRequest;
import com.sigecom.model.request.auth.EditUserRequest;
import com.sigecom.model.request.auth.LoginRequest;
import com.sigecom.model.request.auth.ResetSenhaRequest;
import com.sigecom.model.request.auth.TrocarSenhaRequest;
import com.sigecom.model.response.auth.LoginResponse;
import com.sigecom.model.response.auth.UsuarioResponse;
import com.sigecom.service.AuthService;
import com.sigecom.service.ControleTentativasLogin;
import com.sigecom.service.UserDetailsServiceImpl;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final UserDetailsServiceImpl userDetailsService;
    private final ControleTentativasLogin controleTentativas;

    public AuthController(AuthService authService,
                          UserDetailsServiceImpl userDetailsService,
                          ControleTentativasLogin controleTentativas) {
        this.authService = authService;
        this.userDetailsService = userDetailsService;
        this.controleTentativas = controleTentativas;
    }

    /**
     * O freio de força bruta mora aqui, e não no AuthService, por dois motivos:
     * é aqui que o IP do cliente existe, e assim o serviço continua sem
     * depender da camada web (o AuthServiceTest não precisa saber que HTTP
     * existe).
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request,
                                               HttpServletRequest http) {
        String chave = controleTentativas.chave(request.email(), http.getRemoteAddr());
        controleTentativas.verificar(chave);

        try {
            LoginResponse resposta = authService.login(request);
            controleTentativas.registrarSucesso(chave);
            return ResponseEntity.ok(resposta);
        } catch (AuthenticationException e) {
            // Só credencial errada alimenta o contador. Erro de infra (banco
            // fora, por exemplo) não é tentativa de invasão e não pode
            // bloquear quem sabe a senha.
            controleTentativas.registrarFalha(chave);
            throw e;
        }
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> me(Authentication authentication) {
        return ResponseEntity.ok(userDetailsService.buscarPorEmail(authentication.getName()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/cadastro")
    public ResponseEntity<UsuarioResponse> cadastro(@Valid @RequestBody CadastroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.cadastro(request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/usuarios")
    public ResponseEntity<Page<UsuarioResponse>> listarUsuarios(
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) TipoUsuario perfil,
            Pageable pageable) {
        return ResponseEntity.ok(userDetailsService.listarTodos(busca, perfil, pageable));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/usuarios/funcionarios")
    public ResponseEntity<List<UsuarioResponse>> listarFuncionarios() {
        return ResponseEntity.ok(userDetailsService.listarPorPerfil(TipoUsuario.FUNCIONARIO));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/usuarios/{id}")
    public ResponseEntity<UsuarioResponse> editar(@PathVariable Long id,
                                                  @Valid @RequestBody EditUserRequest request) {
        return ResponseEntity.ok(authService.editar(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        authService.remover(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/me/senha")
    public ResponseEntity<LoginResponse> trocarMinhaSenha(Authentication authentication,
                                                         @Valid @RequestBody TrocarSenhaRequest request) {
        return ResponseEntity.ok(authService.trocarMinhaSenha(authentication.getName(), request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/usuarios/{id}/senha")
    public ResponseEntity<Void> resetarSenhaFuncionario(@PathVariable Long id,
                                                       @Valid @RequestBody ResetSenhaRequest request) {
        authService.resetarSenhaFuncionario(id, request);
        return ResponseEntity.noContent().build();
    }
}
