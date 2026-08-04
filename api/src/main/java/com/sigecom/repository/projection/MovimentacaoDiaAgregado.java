package com.sigecom.repository.projection;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MovimentacaoDiaAgregado(
        LocalDate data,
        Long unidades,
        BigDecimal receita
) {}
