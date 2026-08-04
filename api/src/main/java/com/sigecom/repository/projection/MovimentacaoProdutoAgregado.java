package com.sigecom.repository.projection;

import java.math.BigDecimal;

public record MovimentacaoProdutoAgregado(
        Long produtoId,
        String produtoNome,
        String categoriaNome,
        Long unidades,
        BigDecimal receita,
        Long numVendas
) {}
