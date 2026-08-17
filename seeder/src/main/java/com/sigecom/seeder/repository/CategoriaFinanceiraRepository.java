package com.sigecom.seeder.repository;

import com.sigecom.seeder.domain.CategoriaFinanceira;
import com.sigecom.seeder.domain.enums.TipoLancamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoriaFinanceiraRepository extends JpaRepository<CategoriaFinanceira, Long> {

    // Identidade da categoria financeira e o par (nome, tipo) - mesma
    // convencao usada pelo CategoriaFinanceiraService da aplicacao original.
    Optional<CategoriaFinanceira> findFirstByNomeIgnoreCaseAndTipo(String nome, TipoLancamento tipo);
}
