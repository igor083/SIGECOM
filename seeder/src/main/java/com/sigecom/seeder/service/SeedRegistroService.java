package com.sigecom.seeder.service;

import com.sigecom.seeder.domain.SeedRegistro;
import com.sigecom.seeder.domain.SeedRegistro.Recurso;
import com.sigecom.seeder.repository.SeedRegistroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Anota o que o seeder criou, para a limpeza saber exatamente o que apagar.
 *
 * A distincao importa: o seeder tambem REAPROVEITA registros que ja existiam
 * (mesma categoria, mesmo produto, mesmo usuario). Reaproveitado nao entra
 * aqui - e por isso que a limpeza nunca remove cadastro que a aplicacao ja
 * tinha antes de o seeder rodar pela primeira vez.
 */
@Service
@RequiredArgsConstructor
public class SeedRegistroService {

    private final SeedRegistroRepository repository;

    @Transactional
    public void marcar(Recurso recurso, Long registroId) {
        if (registroId == null || repository.existsByRecursoAndRegistroId(recurso, registroId)) {
            return;
        }
        repository.save(SeedRegistro.builder()
                .recurso(recurso)
                .registroId(registroId)
                .build());
    }

    @Transactional(readOnly = true)
    public List<Long> idsCriados(Recurso recurso) {
        return repository.findByRecurso(recurso).stream()
                .map(SeedRegistro::getRegistroId)
                .toList();
    }

    @Transactional(readOnly = true)
    public long quantidade(Recurso recurso) {
        return repository.countByRecurso(recurso);
    }

    @Transactional
    public void desmarcar(Recurso recurso, Long registroId) {
        repository.deleteByRecursoAndRegistroId(recurso, registroId);
    }
}
