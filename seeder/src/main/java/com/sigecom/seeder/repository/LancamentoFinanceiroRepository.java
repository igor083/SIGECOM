package com.sigecom.seeder.repository;

import com.sigecom.seeder.domain.LancamentoFinanceiro;
import com.sigecom.seeder.domain.enums.TipoLancamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface LancamentoFinanceiroRepository extends JpaRepository<LancamentoFinanceiro, Long> {

    // Idempotencia dos lancamentos: a descricao gerada e deterministica e
    // unica - "Venda #id" para a receita da venda (mesma convencao do
    // VendaService da aplicacao original) e "[seed] ..." para as despesas.
    boolean existsByDescricao(String descricao);

    List<LancamentoFinanceiro> findByDescricaoIn(List<String> descricoes);

    // Marcador mestre da limpeza (ver VendaRepository).
    List<LancamentoFinanceiro> findByUsuarioIdIn(List<Long> usuarioIds);

    boolean existsByUsuarioId(Long usuarioId);

    boolean existsByCategoriaId(Long categoriaId);

    // Mesma agregacao do FechamentoCaixaService da aplicacao original.
    @Query("SELECT COALESCE(SUM(l.valor), 0) FROM LancamentoFinanceiro l " +
           "WHERE l.tipo = :tipo AND l.dataHora >= :inicio AND l.dataHora <= :fim")
    BigDecimal somarPorTipo(@Param("tipo") TipoLancamento tipo,
                            @Param("inicio") LocalDateTime inicio,
                            @Param("fim") LocalDateTime fim);
}
