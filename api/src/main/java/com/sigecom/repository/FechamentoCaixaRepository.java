package com.sigecom.repository;

import com.sigecom.domain.FechamentoCaixa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;


@Repository
public interface FechamentoCaixaRepository extends JpaRepository<FechamentoCaixa, Long> {

    // spring ler e gera o SQL equivalente ao "select exists..."
    boolean existsByDataFechamento(LocalDate dataFechamento);
}
