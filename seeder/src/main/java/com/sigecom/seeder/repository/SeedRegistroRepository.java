package com.sigecom.seeder.repository;

import com.sigecom.seeder.domain.SeedRegistro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SeedRegistroRepository extends JpaRepository<SeedRegistro, Long> {

    List<SeedRegistro> findByRecurso(SeedRegistro.Recurso recurso);

    boolean existsByRecursoAndRegistroId(SeedRegistro.Recurso recurso, Long registroId);

    void deleteByRecursoAndRegistroId(SeedRegistro.Recurso recurso, Long registroId);

    long countByRecurso(SeedRegistro.Recurso recurso);
}
