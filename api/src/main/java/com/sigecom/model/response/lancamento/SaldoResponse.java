package com.sigecom.model.response.lancamento;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Resposta do endpoint GET /lancamentos/saldo.
 *
 * O saldo é calculado a cada consulta somando os lançamentos —
 * não existe coluna de saldo em nenhuma tabela.
 * Isso evita duas fontes de verdade que podem divergir (R-01 Sprint 4).
 *
 * Os campos dataInicio e dataFim ecoam o período efetivamente consultado,
 * para a tela exibir sem recalcular no front.
 */
public record SaldoResponse(
        BigDecimal totalReceitas,
        BigDecimal totalDespesas,
        BigDecimal saldo,          // totalReceitas - totalDespesas
        LocalDate dataInicio,
        LocalDate dataFim
) { }
