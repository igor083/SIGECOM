package com.sigecom.repository;

import com.sigecom.domain.Produto;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

    /**
     * Listagem paginada com filtros opcionais de nome, categoria e nível de
     * estoque.
     *
     * O recorte de estoque chega como dois flags (de {@link com.sigecom.domain.enums.FiltroEstoque}),
     * nunca nulos, em vez de um parâmetro anulável: cada cláusula só restringe
     * quando o outro lado está excluído. Com os dois em true, ambas são
     * sempre verdadeiras e a query devolve tudo.
     */
    @Query("SELECT p FROM Produto p WHERE p.ativo = true " +
           "AND (:nome IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS String), '%'))) " +
           "AND (:categoriaId IS NULL OR p.categoria.id = :categoriaId) " +
           "AND (:incluiBaixo = TRUE OR p.qtdEstoque > p.estoqueMinimo) " +
           "AND (:incluiNormal = TRUE OR p.qtdEstoque <= p.estoqueMinimo)")
    Page<Produto> findAllFiltrado(@Param("nome") String nome,
                                  @Param("categoriaId") Long categoriaId,
                                  @Param("incluiBaixo") boolean incluiBaixo,
                                  @Param("incluiNormal") boolean incluiNormal,
                                  Pageable pageable);

    @Query("SELECT p FROM Produto p WHERE p.ativo = true " +
           "AND (:categoriaId IS NULL OR p.categoria.id = :categoriaId) " +
           "AND (:nome IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS String), '%')))")
    List<Produto> findParaRelatorioEstoque(@Param("categoriaId") Long categoriaId,
                                           @Param("nome") String nome,
                                           Sort sort);
}
