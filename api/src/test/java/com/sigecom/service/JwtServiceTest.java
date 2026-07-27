package com.sigecom.service;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

// D-2. O JwtService decide quem entra no sistema e nao tinha teste nenhum.
// Sem isso, um token adulterado sendo aceito passaria despercebido no build.
class JwtServiceTest {

    // chave de teste, nao e a de producao
    private static final String SEGREDO =
            "dGVzdGUtc2VjcmV0LWtleS1jb20tdGFtYW5oby1zdWZpY2llbnRlLXBhcmEtaG1hYy1zaGE1MTItb2s=";

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", SEGREDO);
        ReflectionTestUtils.setField(jwtService, "expirationMs", 3600000L);
    }

    @Test
    void generateToken_DeveGuardarOsDadosDoUsuario() {
        String token = jwtService.generateToken(7L, "admin@sigecom.com", "ADMIN", false);

        assertEquals("admin@sigecom.com", jwtService.extractEmail(token));
        assertEquals("ADMIN", jwtService.extractRole(token));
        assertFalse(jwtService.extractPwdResetRequired(token));
    }

    @Test
    void extractRole_DeveDevolverFuncionario_QuandoForEsseOPerfil() {
        String token = jwtService.generateToken(2L, "func@sigecom.com", "FUNCIONARIO", false);

        assertEquals("FUNCIONARIO", jwtService.extractRole(token));
    }

    @Test
    void extractPwdResetRequired_DeveSerTrue_QuandoSenhaForTemporaria() {
        String token = jwtService.generateToken(3L, "novo@sigecom.com", "FUNCIONARIO", true);

        assertTrue(jwtService.extractPwdResetRequired(token));
    }

    // o que mais importa aqui: trocar uma letra do token tem que derrubar a assinatura
    @Test
    void extractEmail_DeveRecusar_QuandoOTokenForAdulterado() {
        String token = jwtService.generateToken(1L, "admin@sigecom.com", "ADMIN", false);
        String adulterado = token.substring(0, token.length() - 4) + "AAAA";

        assertThrows(SignatureException.class, () -> jwtService.extractEmail(adulterado));
    }

    // token assinado com outra chave nao pode passar, senao qualquer um forja acesso
    @Test
    void extractEmail_DeveRecusar_QuandoAChaveForOutra() {
        JwtService intruso = new JwtService();
        ReflectionTestUtils.setField(intruso, "secret",
                "b3V0cmEtY2hhdmUtcXVhbHF1ZXItY29tLXRhbWFuaG8tc3VmaWNpZW50ZS1wYXJhLWhtYWMtNTEyLXg=");
        ReflectionTestUtils.setField(intruso, "expirationMs", 3600000L);

        String tokenDoIntruso = intruso.generateToken(1L, "hacker@sigecom.com", "ADMIN", false);

        assertThrows(SignatureException.class, () -> jwtService.extractEmail(tokenDoIntruso));
    }

    @Test
    void extractEmail_DeveRecusar_QuandoOTokenTiverExpirado() {
        ReflectionTestUtils.setField(jwtService, "expirationMs", -1000L); // ja nasce vencido
        String vencido = jwtService.generateToken(1L, "admin@sigecom.com", "ADMIN", false);

        assertThrows(ExpiredJwtException.class, () -> jwtService.extractEmail(vencido));
    }
}
