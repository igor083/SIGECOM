package com.sigecom.service;

import com.sigecom.model.response.dashboard.MetaVendaDiariaResponse;
import com.sigecom.repository.VendaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final VendaRepository vendaRepository;

    // Valor fixo até US-034 (módulo Financeiro, Sprint 4) fornecer custos + margem
    private static final BigDecimal META_DIA_PLACEHOLDER = new BigDecimal("1000.00");

    public MetaVendaDiariaResponse metaVendaDiaria() {
        LocalDateTime inicioDia = LocalDate.now().atStartOfDay();
        LocalDateTime fimDia = inicioDia.plusDays(1).minusNanos(1);

        BigDecimal realizadoHoje = vendaRepository
                .findAllFiltrado(inicioDia, fimDia, null, PageRequest.of(0, Integer.MAX_VALUE))
                .getContent()
                .stream()
                .map(v -> v.getTotal() != null ? v.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal percentual = META_DIA_PLACEHOLDER.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : realizadoHoje
                        .multiply(new BigDecimal("100"))
                        .divide(META_DIA_PLACEHOLDER, 2, RoundingMode.HALF_UP);

        log.info("meta-diaria: meta={}, realizado={}, percentual={}%",
                META_DIA_PLACEHOLDER, realizadoHoje, percentual);

        return new MetaVendaDiariaResponse(
                META_DIA_PLACEHOLDER,
                realizadoHoje,
                percentual,
                realizadoHoje.compareTo(META_DIA_PLACEHOLDER) >= 0
        );
    }
}
