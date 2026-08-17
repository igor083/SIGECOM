package com.sigecom.config;

import com.sigecom.domain.Usuario;
import com.sigecom.domain.enums.TipoUsuario;
import com.sigecom.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Único dado semeado pela aplicação: o administrador inicial.
 *
 * Existe porque o cadastro de usuário exige um ADMIN autenticado — sem este
 * registro, um banco novo não teria como criar o primeiro login. Todo o resto
 * do volume de dados (catálogo, vendas, financeiro, caixa) saiu daqui e vive
 * na API seeder (`seeder/`), que roda sob demanda e fora do boot.
 *
 * Idempotente pelo e-mail: se o usuário já existe, nada acontece — nem
 * atualização de senha, nem de perfil. Trocar a senha do admin pela aplicação
 * não é desfeito no próximo start.
 *
 * Não roda nos testes: eles usam H2, e a condição abaixo restringe ao Postgres.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(0)
@ConditionalOnProperty(name = "spring.datasource.driver-class-name",
                       havingValue = "org.postgresql.Driver")
public class AdminInicialSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${sigecom.admin-inicial.email:adm@adm.com}")
    private String email;

    @Value("${sigecom.admin-inicial.senha:senha123}")
    private String senha;

    @Value("${sigecom.admin-inicial.nome:Administrador}")
    private String nome;

    @Override
    public void run(String... args) {
        if (usuarioRepository.existsByEmail(email)) {
            log.debug("Admin inicial '{}' já existe — seed ignorado.", email);
            return;
        }

        usuarioRepository.save(Usuario.builder()
                .nome(nome)
                .email(email)
                .senhaHash(passwordEncoder.encode(senha))
                .perfil(TipoUsuario.ADMIN)
                .ativo(true)
                // false de propósito: é a credencial padrão de desenvolvimento,
                // e forçar troca no primeiro login travaria o uso imediato.
                .senhaTemporaria(false)
                .criadoEm(LocalDateTime.now())
                .build());

        log.info("Admin inicial criado: {}", email);
    }
}
