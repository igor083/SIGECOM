package com.sigecom.repository;

import com.sigecom.domain.Venda;
import com.sigecom.repository.projection.RelatorioVendasAgregado;
import com.sigecom.repository.projection.VendasPorDiaAgregado;
import com.sigecom.repository.projection.VendasPorFormaPagamentoAgregado;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface VendaRepository extends JpaRepository<Venda, Long> {

    // Filtro por faixa de data. O service SEMPRE passa dataInicio/dataFim nao-nulos
    // (usa limites amplos quando o filtro vem vazio), por isso a query nao usa
    // "IS NULL": no Postgres, ":param IS NULL" impede a inferencia de tipo do
    // parametro no PREPARE e estoura "could not determine data type of parameter".
    @Query("SELECT v FROM Venda v " +
           "WHERE v.dataHora >= :dataInicio " +
           "  AND v.dataHora <= :dataFim " +
           "  AND (:funcionarioId IS NULL OR v.usuario.id = :funcionarioId)")
    Page<Venda> findAllFiltrado(@Param("dataInicio") LocalDateTime dataInicio,
                                @Param("dataFim") LocalDateTime dataFim,
                                @Param("funcionarioId") Long funcionarioId,
                                Pageable pageable);



       // Soma total de vendas em um intervalo - Fechamento de caixa (scrum-25)
       @Query("SELECT COALESCE(SUM(v.total), 0) FROM Venda v " +
           "WHERE v.dataHora >= :dataInicio " +
           "  AND v.dataHora <= :dataFim")
       BigDecimal somarTotalPorPeriodo(@Param("dataInicio") LocalDateTime dataInicio,
                                         @Param("dataFim") LocalDateTime dataFim);

    /**
     * Agrega total e quantidade de vendas de um período, opcionalmente de um
     * único funcionário responsável (US — Relatório de Vendas por Período).
     *
     * Uma só ida ao banco calcula SUM + COUNT:
     *  - COALESCE(SUM(v.total), 0) evita null quando o período não tem vendas.
     *  - COUNT(v.id) devolve 0 naturalmente.
     *
     * Datas: o service SEMPRE passa dataInicio/dataFim não-nulos (mesma razão
     * do findAllFiltrado — ":param IS NULL" quebra a inferência de tipo temporal
     * no Postgres). Já o funcionarioId (Long) usa o padrão IS NULL com segurança,
     * como em LancamentoFinanceiroRepository.findAllFiltrado.
     *
     * Observação de escopo: hoje toda venda persistida é confirmada — não existe
     * cancelamento no sistema. Quando o status de venda for introduzido, o filtro
     * "confirmadas" entra nesta cláusula WHERE.
     */
    @Query("SELECT new com.sigecom.repository.projection.RelatorioVendasAgregado(" +
           "COALESCE(SUM(v.total), 0), COUNT(v.id)) " +
           "FROM Venda v " +
           "WHERE v.dataHora >= :dataInicio " +
           "  AND v.dataHora <= :dataFim " +
           "  AND (:funcionarioId IS NULL OR v.usuario.id = :funcionarioId)")
    RelatorioVendasAgregado agregarPorPeriodo(@Param("dataInicio") LocalDateTime dataInicio,
                                              @Param("dataFim") LocalDateTime dataFim,
                                              @Param("funcionarioId") Long funcionarioId);

    /**
     * Série diária do período: total e quantidade de vendas por dia, ordenada
     * cronologicamente (US — Relatório de Vendas / gráfico "vendas por dia").
     *
     * CAST(v.dataHora AS LocalDate) colapsa o timestamp no dia (Hibernate 6 devolve
     * LocalDate; no Postgres vira `cast(... as date)`). Dias sem venda não
     * aparecem — a série é esparsa, o front lida com isso no gráfico de barras.
     * Mesma convenção de datas/funcionário do agregarPorPeriodo.
     */
    @Query("SELECT new com.sigecom.repository.projection.VendasPorDiaAgregado(" +
           "CAST(v.dataHora AS LocalDate), COALESCE(SUM(v.total), 0), COUNT(v.id)) " +
           "FROM Venda v " +
           "WHERE v.dataHora >= :dataInicio " +
           "  AND v.dataHora <= :dataFim " +
           "  AND (:funcionarioId IS NULL OR v.usuario.id = :funcionarioId) " +
           "GROUP BY CAST(v.dataHora AS LocalDate) " +
           "ORDER BY CAST(v.dataHora AS LocalDate)")
    List<VendasPorDiaAgregado> agregarPorDia(@Param("dataInicio") LocalDateTime dataInicio,
                                             @Param("dataFim") LocalDateTime dataFim,
                                             @Param("funcionarioId") Long funcionarioId);

    /**
     * Distribuição por forma de pagamento no período: total e quantidade de
     * vendas por TipoPagamento, do maior total para o menor
     * (US — Relatório de Vendas / gráfico de rosca por forma de pagamento).
     *
     * Só aparecem formas efetivamente usadas no período. Mesma convenção de
     * datas/funcionário do agregarPorPeriodo.
     */
    @Query("SELECT new com.sigecom.repository.projection.VendasPorFormaPagamentoAgregado(" +
           "v.tipoPagamento, COALESCE(SUM(v.total), 0), COUNT(v.id)) " +
           "FROM Venda v " +
           "WHERE v.dataHora >= :dataInicio " +
           "  AND v.dataHora <= :dataFim " +
           "  AND (:funcionarioId IS NULL OR v.usuario.id = :funcionarioId) " +
           "GROUP BY v.tipoPagamento " +
           "ORDER BY SUM(v.total) DESC")
    List<VendasPorFormaPagamentoAgregado> agregarPorFormaPagamento(@Param("dataInicio") LocalDateTime dataInicio,
                                                                   @Param("dataFim") LocalDateTime dataFim,
                                                                   @Param("funcionarioId") Long funcionarioId);
}

