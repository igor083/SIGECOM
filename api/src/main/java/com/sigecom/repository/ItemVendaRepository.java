package com.sigecom.repository;

import com.sigecom.domain.ItemVenda;
import com.sigecom.repository.projection.MovimentacaoDiaAgregado;
import com.sigecom.repository.projection.MovimentacaoProdutoAgregado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ItemVendaRepository extends JpaRepository<ItemVenda, Long> {

    @Query("SELECT new com.sigecom.repository.projection.MovimentacaoProdutoAgregado(" +
           "iv.produto.id, iv.produto.nome, iv.produto.categoria.nome, " +
           "SUM(iv.quantidade), COALESCE(SUM(iv.subtotal), 0), COUNT(DISTINCT iv.venda.id)) " +
           "FROM ItemVenda iv " +
           "WHERE iv.venda.dataHora >= :inicio AND iv.venda.dataHora <= :fim " +
           "  AND (:produtoId IS NULL OR iv.produto.id = :produtoId) " +
           "  AND (:categoriaId IS NULL OR iv.produto.categoria.id = :categoriaId) " +
           "GROUP BY iv.produto.id, iv.produto.nome, iv.produto.categoria.nome " +
           "ORDER BY SUM(iv.quantidade) DESC")
    List<MovimentacaoProdutoAgregado> agregarPorProduto(@Param("inicio") LocalDateTime inicio,
                                                        @Param("fim") LocalDateTime fim,
                                                        @Param("produtoId") Long produtoId,
                                                        @Param("categoriaId") Long categoriaId);

    @Query("SELECT new com.sigecom.repository.projection.MovimentacaoDiaAgregado(" +
           "CAST(iv.venda.dataHora AS LocalDate), SUM(iv.quantidade), COALESCE(SUM(iv.subtotal), 0)) " +
           "FROM ItemVenda iv " +
           "WHERE iv.venda.dataHora >= :inicio AND iv.venda.dataHora <= :fim " +
           "  AND (:produtoId IS NULL OR iv.produto.id = :produtoId) " +
           "  AND (:categoriaId IS NULL OR iv.produto.categoria.id = :categoriaId) " +
           "GROUP BY CAST(iv.venda.dataHora AS LocalDate) " +
           "ORDER BY CAST(iv.venda.dataHora AS LocalDate)")
    List<MovimentacaoDiaAgregado> agregarPorDia(@Param("inicio") LocalDateTime inicio,
                                                @Param("fim") LocalDateTime fim,
                                                @Param("produtoId") Long produtoId,
                                                @Param("categoriaId") Long categoriaId);
}
