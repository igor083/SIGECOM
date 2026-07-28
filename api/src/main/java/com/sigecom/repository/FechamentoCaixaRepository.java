package com.sigecom.repository;

import com.sigecom.domain.FechamentoCaixa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;


@Repository
public interface FechamentoCaixaRepository extends JpaRepository<FechamentoCaixa, Long> {

    // spring ler e gera o SQL equivalente ao "select exists..."
    boolean existsByDataFechamento(LocalDate dataFechamento);

    // usado pela tela para saber se o dia já está fechado (US-022), join chama o usuário
    @Query("select f from FechamentoCaixa f join fetch f.usuario where f.dataFechamento = :data")
    Optional<FechamentoCaixa> findByDataFechamento(@Param("data") LocalDate data);
}
