package com.sigecom.seeder.repository;

import com.sigecom.seeder.domain.FechamentoCaixa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FechamentoCaixaRepository extends JpaRepository<FechamentoCaixa, Long> {

    // Um fechamento por dia: a propria data ja e a chave de idempotencia.
    Optional<FechamentoCaixa> findByDataFechamento(LocalDate dataFechamento);

    boolean existsByDataFechamento(LocalDate dataFechamento);

    // Marcador mestre da limpeza (ver VendaRepository).
    List<FechamentoCaixa> findByUsuarioIdIn(List<Long> usuarioIds);

    boolean existsByUsuarioId(Long usuarioId);
}
