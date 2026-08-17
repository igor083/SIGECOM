package com.sigecom.seeder.service;

import com.sigecom.seeder.config.SeedProperties;
import com.sigecom.seeder.domain.SeedRegistro.Recurso;
import com.sigecom.seeder.domain.Usuario;
import com.sigecom.seeder.model.SeedResult;
import com.sigecom.seeder.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Cria os usuarios de teste.
 *
 * Idempotente pelo email: usuario que ja existe e reaproveitado como esta,
 * sem reescrever nome, perfil ou senha - reexecutar o seeder nunca desfaz
 * um ajuste feito na aplicacao.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UsuarioSeedService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final SeedRegistroService registro;
    private final SeedProperties props;

    @Transactional
    public SeedResult semear() {
        int criados = 0;
        int ignorados = 0;

        for (SeedCatalogo.UsuarioSeed def : SeedCatalogo.USUARIOS) {
            if (usuarioRepository.findByEmail(def.email()).isPresent()) {
                ignorados++;
                continue;
            }

            Usuario salvo = usuarioRepository.save(Usuario.builder()
                    .nome(def.nome())
                    .email(def.email())
                    .senhaHash(passwordEncoder.encode(props.getSenhaPadrao()))
                    .perfil(def.perfil())
                    .ativo(true)
                    .senhaTemporaria(false)
                    .criadoEm(LocalDateTime.now())
                    .build());
            registro.marcar(Recurso.USUARIO, salvo.getId());
            criados++;
        }

        log.info("Usuarios de teste: {} criados, {} ja existiam.", criados, ignorados);
        return SeedResult.de("usuarios", criados, ignorados,
                "senha de todos: " + props.getSenhaPadrao());
    }

    /**
     * Usuarios de teste presentes no banco, na ordem do catalogo.
     * Vazio quando o seed de usuarios ainda nao rodou.
     */
    @Transactional(readOnly = true)
    public List<Usuario> carregarUsuariosSeed() {
        List<Usuario> encontrados = new ArrayList<>();
        for (SeedCatalogo.UsuarioSeed def : SeedCatalogo.USUARIOS) {
            usuarioRepository.findByEmail(def.email()).ifPresent(encontrados::add);
        }
        return encontrados;
    }
}
