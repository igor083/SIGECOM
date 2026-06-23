package com.sigecom.repository;

import com.sigecom.domain.CategoriaProduto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoriaProdutoRepository extends JpaRepository<CategoriaProduto, Long> {

    boolean existsByNomeIgnoreCase(String nome);
}
