package com.sigecom.seeder.repository;

import com.sigecom.seeder.domain.Produto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    // A tabela nao tem unique em nome; o seeder trata o nome como chave
    // natural do seu catalogo fixo e usa "First" para nao quebrar caso
    // exista um homonimo cadastrado pela aplicacao.
    Optional<Produto> findFirstByNomeIgnoreCase(String nome);

    boolean existsByCategoriaId(Long categoriaId);
}
