package com.sigecom.config;

import com.sigecom.exception.GlobalExceptionHandler;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
public class PwdResetRequiredFilter extends OncePerRequestFilter {

    private static final Set<String> ROTAS_PERMITIDAS = Set.of(
            "GET:/auth/me",
            "PATCH:/auth/me/senha"
    );

    private final GlobalExceptionHandler exceptionHandler;

    public PwdResetRequiredFilter(GlobalExceptionHandler exceptionHandler) {
        this.exceptionHandler = exceptionHandler;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        if (precisaTrocarSenha() && !rotaPermitida(request)) {
            exceptionHandler.handle(request, response,
                    new AccessDeniedException("Troca de senha obrigatória antes de acessar outros recursos"));
            return;
        }
        chain.doFilter(request, response);
    }

    private boolean precisaTrocarSenha() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> JwtAuthFilter.PWD_RESET_AUTHORITY.equals(a.getAuthority()));
    }

    private boolean rotaPermitida(HttpServletRequest request) {
        return ROTAS_PERMITIDAS.contains(request.getMethod() + ":" + request.getRequestURI());
    }
}
