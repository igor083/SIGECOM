package com.sigecom.seeder.repository;

import com.sigecom.seeder.domain.CategoriaProduto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoriaProdutoRepository extends JpaRepository<CategoriaProduto, Long> {

    Optional<CategoriaProduto> findByNomeIgnoreCase(String nome);
}
