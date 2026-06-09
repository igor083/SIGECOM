package com.sigecom.config;

import com.sigecom.exception.GlobalExceptionHandler;
import com.sigecom.service.JwtService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String AUTH_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String ROLE_PREFIX = "ROLE_";

    private final JwtService jwtService;
    private final GlobalExceptionHandler exceptionHandler;

    public JwtAuthFilter(JwtService jwtService, GlobalExceptionHandler exceptionHandler) {
        this.jwtService = jwtService;
        this.exceptionHandler = exceptionHandler;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String token = extractToken(request);
        if (token == null || jaAutenticado()) {
            chain.doFilter(request, response);
            return;
        }

        try {
            autenticarComToken(token, request);
        } catch (JwtException e) {
            exceptionHandler.commence(request, response, new BadCredentialsException("Token inválido ou expirado"));
            return;
        }

        chain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader(AUTH_HEADER);
        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            return null;
        }
        return header.substring(BEARER_PREFIX.length());
    }

    private boolean jaAutenticado() {
        return SecurityContextHolder.getContext().getAuthentication() != null;
    }

    private void autenticarComToken(String token, HttpServletRequest request) {
        String email = jwtService.extractEmail(token);
        String role = jwtService.extractRole(token);

        var authorities = List.of(new SimpleGrantedAuthority(ROLE_PREFIX + role));
        var auth = new UsernamePasswordAuthenticationToken(email, null, authorities);
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
