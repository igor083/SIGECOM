package com.sigecom.repository;

import com.sigecom.domain.Produto;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    boolean existsByCategoriaId(Long categoriaId);
    
    @Query("SELECT p FROM Produto p WHERE p.ativo = true AND p.qtdEstoque <= p.estoqueMinimo")
    List<Produto> findProdutosComEstoqueBaixo();
}
