package com.sigecom.repository;

import com.sigecom.domain.LancamentoFinanceiro;
import com.sigecom.domain.enums.TipoLancamento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface LancamentoFinanceiroRepository extends JpaRepository<LancamentoFinanceiro, Long> {

    /**
     * Consulta paginada com filtros opcionais de tipo, categoria e intervalo de data.
     * Datas sempre recebem valor não-nulo do service (limites amplos quando o filtro
     * vem vazio), evitando o problema de Postgres com ":param IS NULL" em temporais.
     * Tipo e categoriaId usam o padrão IS NULL (seguro para enum STRING e Long).
     */
    @Query("SELECT l FROM LancamentoFinanceiro l " +
           "WHERE l.dataHora >= :dataInicio " +
           "  AND l.dataHora <= :dataFim " +
           "  AND (:tipo IS NULL OR l.tipo = :tipo) " +
           "  AND (:categoriaId IS NULL OR l.categoria.id = :categoriaId)")
    Page<LancamentoFinanceiro> findAllFiltrado(@Param("dataInicio") LocalDateTime dataInicio,
                                               @Param("dataFim") LocalDateTime dataFim,
                                               @Param("tipo") TipoLancamento tipo,
                                               @Param("categoriaId") Long categoriaId,
                                               Pageable pageable);

    /**
     * Soma de valores por tipo em um intervalo de data.
     * COALESCE garante retorno 0 em vez de null quando não há lançamentos,
     * prevenindo NullPointerException na soma (consumido pelo SCRUM-24 — Saldo Operacional).
     */
    @Query("SELECT COALESCE(SUM(l.valor), 0) FROM LancamentoFinanceiro l " +
           "WHERE l.tipo = :tipo " +
           "  AND l.dataHora >= :dataInicio " +
           "  AND l.dataHora <= :dataFim")
    BigDecimal somarPorTipo(@Param("tipo") TipoLancamento tipo,
                            @Param("dataInicio") LocalDateTime dataInicio,
                            @Param("dataFim") LocalDateTime dataFim);

    boolean existsByCategoriaId(Long categoriaId);

    // Usado pelo backfill de vendas antigas: mesma convenção de descrição
    // ("Venda #" + id) usada em VendaService.registrarReceitaNoFinanceiro,
    // já que não há FK entre lancamento_financeiro e venda.
    boolean existsByDescricao(String descricao);
}
