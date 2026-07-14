package com.sigecom.model.response.dashboard;

import java.math.BigDecimal;

public record MetaVendaDiariaResponse(
        BigDecimal metaDia,
        BigDecimal realizadoHoje,
        BigDecimal percentual,
        boolean noBazul
) {}
