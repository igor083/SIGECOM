package com.sigecom.repository;

import com.sigecom.domain.Produto;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    boolean existsByCategoriaId(Long categoriaId);

    long countByCategoriaIdAndAtivoTrue(Long categoriaId);

    List<Produto> findByAtivoTrueAndCategoriaId(Long categoriaId);
    Page<Produto> findByAtivoTrueAndCategoriaId(Long categoriaId, Pageable pageable);

    @Query("SELECT p FROM Produto p WHERE p.ativo = true AND p.qtdEstoque <= p.estoqueMinimo")
    List<Produto> findProdutosComEstoqueBaixo();

    @Query("SELECT p FROM Produto p WHERE p.ativo = true AND p.qtdEstoque <= p.estoqueMinimo")
    Page<Produto> findProdutosComEstoqueBaixo(Pageable pageable);

    @Query("SELECT p FROM Produto p WHERE p.ativo = true " +
           "AND (:nome IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS String), '%'))) " +
           "AND (:categoriaId IS NULL OR p.categoria.id = :categoriaId)")
    Page<Produto> findAllFiltrado(@Param("nome") String nome,
                                  @Param("categoriaId") Long categoriaId,
                                  Pageable pageable);
}
