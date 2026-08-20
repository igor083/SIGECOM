package com.sigecom.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sigecom.model.response.ApiError;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler(objectMapper);
        request = new MockHttpServletRequest("GET", "/api/teste");
    }

    // ===== MVC dispatcher (@ExceptionHandler) =====

    @Test
    void handleValidation_DeveDevolver400ComListaDeErros() {
        BindingResult bindingResult = mock(BindingResult.class);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(
                new FieldError("produto", "nome", "não pode ser vazio"),
                new FieldError("produto", "preco", "deve ser positivo")
        ));
        MethodParameter param = new MethodParameter(
                Object.class.getDeclaredMethods()[0], -1);
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(param, bindingResult);

        ResponseEntity<ApiError> response = handler.handleValidation(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        ApiError body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.status()).isEqualTo(400);
        assertThat(body.usuarioMensagem()).isEqualTo("Dados inválidos");
        assertThat(body.path()).isEqualTo("/api/teste");
        assertThat(body.erros()).hasSize(2);
        assertThat(body.erros()).contains("nome: não pode ser vazio", "preco: deve ser positivo");
    }

    @Test
    void handleResponseStatus_DeveDevolver404ComMotivoCustom() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado");

        ResponseEntity<ApiError> response = handler.handleResponseStatus(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        ApiError body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.status()).isEqualTo(404);
        assertThat(body.usuarioMensagem()).isEqualTo("Produto não encontrado");
    }

    @Test
    void handleResponseStatus_DeveDevolver409ParaConflito() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.CONFLICT, "Fechamento já existe");

        ResponseEntity<ApiError> response = handler.handleResponseStatus(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().status()).isEqualTo(409);
        assertThat(response.getBody().usuarioMensagem()).isEqualTo("Fechamento já existe");
    }

    @Test
    void handleAccessDeniedMvc_DeveDevolver403ComMensagemPadrao() {
        AccessDeniedException ex = new AccessDeniedException("Acesso negado");

        ResponseEntity<ApiError> response = handler.handleAccessDeniedMvc(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        ApiError body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.status()).isEqualTo(403);
        assertThat(body.usuarioMensagem()).isEqualTo("Você não tem permissão para acessar este recurso.");
    }

    @Test
    void handleAuthenticationMvc_DeveDevolver401FalandoDeCredenciais_NaoDeToken() {
        // Este caminho é o do login com senha errada: quem chega aqui não tem
        // token nenhum, e mandá-lo "informar um token válido" só confunde.
        BadCredentialsException ex = new BadCredentialsException("Credenciais inválidas");

        ResponseEntity<ApiError> response = handler.handleAuthenticationMvc(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        ApiError body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.status()).isEqualTo(401);
        assertThat(body.usuarioMensagem()).isEqualTo("Credenciais informadas inválidas.");
        assertThat(body.usuarioMensagem()).doesNotContain("token");
    }

    @Test
    void handleGeneric_DeveDevolver500SemVazarDetalhes() {
        NullPointerException ex = new NullPointerException("campo X é null");

        ResponseEntity<ApiError> response = handler.handleGeneric(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        ApiError body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.status()).isEqualTo(500);
        assertThat(body.usuarioMensagem()).isEqualTo("Ocorreu um erro interno. Tente novamente mais tarde.");
        assertThat(body.usuarioMensagem()).doesNotContain("null", "NullPointer");
    }

    // ===== Filter chain (Spring Security) =====

    @Test
    void commence_DeveEscrever401ComoJsonNaResponse() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        BadCredentialsException ex = new BadCredentialsException("Token expirado");

        handler.commence(request, response, ex);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).startsWith("application/json");

        ApiError body = objectMapper.readValue(response.getContentAsString(), ApiError.class);
        assertThat(body.status()).isEqualTo(401);
        assertThat(body.usuarioMensagem()).isEqualTo("Autenticação necessária. Informe um token válido.");
        assertThat(body.path()).isEqualTo("/api/teste");
    }

    @Test
    void handle_DeveEscrever403ComoJsonNaResponse() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        AccessDeniedException ex = new AccessDeniedException("Sem role ADMIN");

        handler.handle(request, response, ex);

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentType()).startsWith("application/json");

        ApiError body = objectMapper.readValue(response.getContentAsString(), ApiError.class);
        assertThat(body.status()).isEqualTo(403);
        assertThat(body.usuarioMensagem()).isEqualTo("Você não tem permissão para acessar este recurso.");
        assertThat(body.path()).isEqualTo("/api/teste");
    }
}
