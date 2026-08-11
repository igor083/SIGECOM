package com.sigecom.model.response.relatorio;

import com.sigecom.domain.enums.TipoLancamento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record RelatorioFinanceiroResponse(
        BigDecimal totalReceitas,
        BigDecimal totalDespesas,
        BigDecimal saldo,
        LocalDate dataInicio,
        LocalDate dataFim,
        List<CategoriaFinanceiraTotal> porCategoria
) {
    public record CategoriaFinanceiraTotal(
            Long categoriaId,
            String categoriaNome,
            TipoLancamento tipo,
            BigDecimal total
    ) {}
}
