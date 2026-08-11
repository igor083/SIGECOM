package com.sigecom.repository.projection;

import com.sigecom.domain.enums.TipoLancamento;

import java.math.BigDecimal;

// Projeção tipada do somarAgrupadoPorCategoria — evita Object[] e alinha com o padrão
// do RelatorioVendasAgregado que o Igor usa no relatório de vendas (D-5).
public interface CategoriaFinanceiraAgregado {
    Long getCategoriaId();
    String getCategoriaNome();
    TipoLancamento getTipo();
    BigDecimal getTotal();
}
