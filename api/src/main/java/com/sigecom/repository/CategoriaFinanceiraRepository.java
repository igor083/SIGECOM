package com.sigecom.repository;

import com.sigecom.domain.CategoriaFinanceira;
import com.sigecom.domain.enums.TipoLancamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoriaFinanceiraRepository extends JpaRepository<CategoriaFinanceira, Long> {

    List<CategoriaFinanceira> findByTipo(TipoLancamento tipo);

    boolean existsByNomeIgnoreCaseAndTipo(String nome, TipoLancamento tipo);
}
