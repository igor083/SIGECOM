package com.sigecom.service;

import com.sigecom.domain.Usuario;
import com.sigecom.domain.enums.TipoUsuario;
import com.sigecom.model.request.auth.*;
import com.sigecom.model.response.auth.LoginResponse;
import com.sigecom.model.response.auth.UsuarioResponse;
import com.sigecom.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private Usuario usuario;

    @BeforeEach
    void setUp() {
        usuario = Usuario.builder()
                .id(1L)
                .nome("Usuario Teste")
                .email("usuario@teste.com")
                .senhaHash("senha_encriptada")
                .perfil(TipoUsuario.ADMIN)
                .ativo(true)
                .senhaTemporaria(false)
                .build();
    }

    @Test
    void login_DeveRetornarLoginResponse_QuandoDadosValidos() {
        LoginRequest request = new LoginRequest("usuario@teste.com", "senha123");
        when(usuarioRepository.findByEmail("usuario@teste.com")).thenReturn(Optional.of(usuario));
        when(jwtService.generateToken(anyLong(), anyString(), anyString(), anyBoolean())).thenReturn("token_jwt");
        when(jwtService.getExpirationMs()).thenReturn(3600000L);

        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("token_jwt", response.token());
        assertEquals(3600000L, response.expiresIn());
        assertFalse(response.senhaTemporaria());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void login_DeveLancarExcecao_QuandoUsuarioNaoEncontrado() {
        LoginRequest request = new LoginRequest("inexistente@teste.com", "senha123");
        when(usuarioRepository.findByEmail("inexistente@teste.com")).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> authService.login(request));
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void cadastro_DeveCadastrarNovoUsuario_QuandoEmailNaoExistir() {
        CadastroRequest request = new CadastroRequest("Novo", "novo@teste.com", "senha123", TipoUsuario.FUNCIONARIO);
        when(usuarioRepository.existsByEmail("novo@teste.com")).thenReturn(false);
        when(passwordEncoder.encode("senha123")).thenReturn("senha_encriptada_nova");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UsuarioResponse response = authService.cadastro(request);

        assertNotNull(response);
        assertEquals("novo@teste.com", response.email());
        assertEquals("Novo", response.nome());
        assertEquals(TipoUsuario.FUNCIONARIO, response.perfil());
        verify(usuarioRepository).save(any(Usuario.class));
    }

    @Test
    void cadastro_DeveLancarConflito_QuandoEmailJaExistir() {
        CadastroRequest request = new CadastroRequest("Novo", "usuario@teste.com", "senha123", TipoUsuario.FUNCIONARIO);
        when(usuarioRepository.existsByEmail("usuario@teste.com")).thenReturn(true);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            authService.cadastro(request);
        });

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals("E-mail já cadastrado", exception.getReason());
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void editar_DeveAtualizarUsuario_QuandoDadosValidos() {
        EditUserRequest request = new EditUserRequest("Nome Editado", "novo@teste.com", TipoUsuario.FUNCIONARIO);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.existsByEmail("novo@teste.com")).thenReturn(false);
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UsuarioResponse response = authService.editar(1L, request);

        assertNotNull(response);
        assertEquals("Nome Editado", response.nome());
        assertEquals("novo@teste.com", response.email());
        assertEquals(TipoUsuario.FUNCIONARIO, response.perfil());
        verify(usuarioRepository).save(usuario);
    }

    @Test
    void editar_NaoDeveDesativarUsuario_PorqueRemocaoSoPassaPeloRemover() {
        // Editar não pode virar uma segunda porta de remoção: é o remover que
        // guarda a regra de não deixar o admin se remover sozinho.
        EditUserRequest request = new EditUserRequest("Nome Editado", null, null);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UsuarioResponse response = authService.editar(1L, request);

        assertTrue(response.ativo());
        assertTrue(usuario.isAtivo());
    }

    @Test
    void editar_DeveTirarOsEspacosDasPontasDoNome() {
        EditUserRequest request = new EditUserRequest("  Danilo  ", null, null);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UsuarioResponse response = authService.editar(1L, request);

        assertEquals("Danilo", response.nome());
    }

    @Test
    void editar_DeveLancarNaoEncontrado_QuandoUsuarioNaoExistir() {
        EditUserRequest request = new EditUserRequest("Nome", "email@teste.com", null);
        when(usuarioRepository.findById(2L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            authService.editar(2L, request);
        });

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertEquals("Usuário não encontrado", exception.getReason());
    }

    @Test
    void editar_DeveLancarConflito_QuandoEmailJaEstiverEmUsoPorOutroUsuario() {
        EditUserRequest request = new EditUserRequest(null, "outro@teste.com", null);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.existsByEmail("outro@teste.com")).thenReturn(true);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            authService.editar(1L, request);
        });

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals("E-mail já cadastrado", exception.getReason());
    }

    @Test
    void remover_DeveDesativarUsuario_QuandoNaoForOProprioUsuarioAutenticado() {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("outro_usuario@teste.com");
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));

        assertDoesNotThrow(() -> authService.remover(1L));

        assertFalse(usuario.isAtivo());
        verify(usuarioRepository).save(usuario);
    }

    @Test
    void remover_NuncaDeveApagarALinha_PorqueVendasEFinanceiroApontamParaEla() {
        // A FK de venda/lancamento_financeiro/fechamento_caixa é NOT NULL: um
        // delete físico estouraria a constraint, e em cascata levaria junto o
        // histórico contábil do operador. A remoção tem que ser sempre lógica.
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("outro_usuario@teste.com");
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));

        authService.remover(1L);

        verify(usuarioRepository, never()).delete(any(Usuario.class));
        verify(usuarioRepository, never()).deleteById(anyLong());
    }

    @Test
    void remover_DeveSerIdempotente_QuandoUsuarioJaEstiverRemovido() {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("outro_usuario@teste.com");
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        usuario.setAtivo(false);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));

        assertDoesNotThrow(() -> authService.remover(1L));
        assertFalse(usuario.isAtivo());
    }

    @Test
    void remover_DeveLancarConflito_QuandoForOProprioUsuarioAutenticado() {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("usuario@teste.com");
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            authService.remover(1L);
        });

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals("Não é permitido remover o próprio usuário", exception.getReason());
        assertTrue(usuario.isAtivo());
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void remover_DeveLancarNaoEncontrado_QuandoUsuarioNaoExistir() {
        when(usuarioRepository.findById(2L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            authService.remover(2L);
        });

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertEquals("Usuário não encontrado", exception.getReason());
    }

    @Test
    void trocarMinhaSenha_DeveAtualizarSenha_QuandoSenhaAtualEstiverCorreta() {
        TrocarSenhaRequest request = new TrocarSenhaRequest("senha123", "nova_senha");
        when(usuarioRepository.findByEmail("usuario@teste.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("senha123", "senha_encriptada")).thenReturn(true);
        when(passwordEncoder.encode("nova_senha")).thenReturn("nova_senha_encriptada");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken(anyLong(), anyString(), anyString(), anyBoolean())).thenReturn("novo_token_jwt");

        LoginResponse response = authService.trocarMinhaSenha("usuario@teste.com", request);

        assertNotNull(response);
        assertEquals("novo_token_jwt", response.token());
        assertFalse(usuario.isSenhaTemporaria());
        verify(usuarioRepository).save(usuario);
    }

    @Test
    void trocarMinhaSenha_DeveLancarNaoAutorizado_QuandoSenhaAtualEstiverIncorreta() {
        TrocarSenhaRequest request = new TrocarSenhaRequest("senha_errada", "nova_senha");
        when(usuarioRepository.findByEmail("usuario@teste.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("senha_errada", "senha_encriptada")).thenReturn(false);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            authService.trocarMinhaSenha("usuario@teste.com", request);
        });

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());
        assertEquals("Senha atual incorreta", exception.getReason());
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void trocarMinhaSenha_DeveLancarNaoEncontrado_QuandoUsuarioNaoExistir() {
        TrocarSenhaRequest request = new TrocarSenhaRequest("senha123", "nova_senha");
        when(usuarioRepository.findByEmail("inexistente@teste.com")).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            authService.trocarMinhaSenha("inexistente@teste.com", request);
        });

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertEquals("Usuário não encontrado", exception.getReason());
    }

    @Test
    void resetarSenhaFuncionario_DeveResetarSenha_QuandoUsuarioForFuncionario() {
        Usuario funcionario = Usuario.builder()
                .id(2L)
                .email("funcionario@teste.com")
                .perfil(TipoUsuario.FUNCIONARIO)
                .ativo(true)
                .senhaTemporaria(false)
                .build();
        ResetSenhaRequest request = new ResetSenhaRequest("nova_senha_func");
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(funcionario));
        when(passwordEncoder.encode("nova_senha_func")).thenReturn("nova_senha_func_encriptada");

        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("admin@teste.com");
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        assertDoesNotThrow(() -> authService.resetarSenhaFuncionario(2L, request));
        assertTrue(funcionario.isSenhaTemporaria());
        verify(usuarioRepository).save(funcionario);
    }

    @Test
    void resetarSenhaFuncionario_DeveLancarProibido_QuandoUsuarioForAdmin() {
        ResetSenhaRequest request = new ResetSenhaRequest("nova_senha_admin");
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            authService.resetarSenhaFuncionario(1L, request);
        });

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        assertEquals("Não é permitido redefinir senha de outro administrador", exception.getReason());
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void resetarSenhaFuncionario_DeveLancarNaoEncontrado_QuandoUsuarioNaoExistir() {
        ResetSenhaRequest request = new ResetSenhaRequest("nova_senha");
        when(usuarioRepository.findById(3L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            authService.resetarSenhaFuncionario(3L, request);
        });

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertEquals("Usuário não encontrado", exception.getReason());
    }
}
