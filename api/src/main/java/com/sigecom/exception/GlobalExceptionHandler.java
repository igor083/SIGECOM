package com.sigecom.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sigecom.model.response.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Handler único de erros da aplicação.
 * Cobre os três caminhos pelos quais exceções chegam:
 *  - @RestControllerAdvice → exceções lançadas dentro do dispatcher (controllers/services)
 *  - AuthenticationEntryPoint.commence() → 401 do filter chain (sem token, token inválido)
 *  - AccessDeniedHandler.handle() → 403 do filter chain (autenticado mas sem permissão)
 */
@RestControllerAdvice
public class GlobalExceptionHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    private static final String MSG_UNAUTHORIZED = "Autenticação necessária. Informe um token válido.";
    private static final String MSG_FORBIDDEN = "Você não tem permissão para acessar este recurso.";
    private static final String MSG_INTERNAL = "Ocorreu um erro interno. Tente novamente mais tarde.";
    // Não diz se o e-mail existe nem quantas tentativas faltavam: contar isso
    // ao cliente entregaria informação útil para quem está sondando contas.
    private static final String MSG_TOO_MANY_REQUESTS =
            "Muitas tentativas de login. Aguarde um minuto e tente novamente.";
    private static final String MSG_INVALID_BODY = "Dados inválidos";

    private final ObjectMapper objectMapper;

    public GlobalExceptionHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    // ===== MVC dispatcher =====

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<String> erros = ex.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .toList();
        return respond(HttpStatus.BAD_REQUEST, MSG_INVALID_BODY, ex.getMessage(), request, erros);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatus(ResponseStatusException ex, HttpServletRequest request) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        return respond(status, ex.getReason(), ex.getMessage(), request, null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDeniedMvc(AccessDeniedException ex, HttpServletRequest request) {
        return respond(HttpStatus.FORBIDDEN, MSG_FORBIDDEN, ex.getMessage(), request, null);
    }

    @ExceptionHandler(TentativasExcedidasException.class)
    public ResponseEntity<ApiError> handleTentativasExcedidas(TentativasExcedidasException ex,
                                                              HttpServletRequest request) {
        // Retry-After em segundos: o cliente sabe quando voltar em vez de
        // insistir em vão. Precisa de ResponseEntity montado à mão porque o
        // respond() padrão não carrega cabeçalho.
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getSegundosParaLiberar()))
                .body(build(HttpStatus.TOO_MANY_REQUESTS, MSG_TOO_MANY_REQUESTS, ex.getMessage(), request, null));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthenticationMvc(AuthenticationException ex, HttpServletRequest request) {
        return respond(HttpStatus.UNAUTHORIZED, MSG_UNAUTHORIZED, ex.getMessage(), request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception ex, HttpServletRequest request) {
        return respond(HttpStatus.INTERNAL_SERVER_ERROR, MSG_INTERNAL, ex.getMessage(), request, null);
    }

    // ===== Filter chain (Spring Security) =====

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException ex) throws IOException {
        write(response, request, HttpStatus.UNAUTHORIZED, MSG_UNAUTHORIZED, ex.getMessage());
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException ex) throws IOException {
        write(response, request, HttpStatus.FORBIDDEN, MSG_FORBIDDEN, ex.getMessage());
    }

    // ===== Helpers =====

    private ResponseEntity<ApiError> respond(HttpStatus status, String usuarioMensagem, String devMensagem,
                                              HttpServletRequest request, List<String> erros) {
        return ResponseEntity.status(status).body(build(status, usuarioMensagem, devMensagem, request, erros));
    }

    private void write(HttpServletResponse response, HttpServletRequest request,
                       HttpStatus status, String usuarioMensagem, String devMensagem) throws IOException {
        ApiError error = build(status, usuarioMensagem, devMensagem, request, null);
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), error);
    }

    private ApiError build(HttpStatus status, String usuarioMensagem, String devMensagem,
                           HttpServletRequest request, List<String> erros) {
        return ApiError.builder()
                .status(status.value())
                .usuarioMensagem(usuarioMensagem)
                .devMensagem(devMensagem)
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .erros(erros)
                .build();
    }
}
