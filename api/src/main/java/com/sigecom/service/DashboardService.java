package com.sigecom.service;

import com.sigecom.domain.MetaVenda;
import com.sigecom.model.response.dashboard.MetaVendaDiariaResponse;
import com.sigecom.repository.MetaVendaRepository;
import com.sigecom.repository.VendaRepository;
import jakarta.transaction.Transactional;
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

    // Linha única (singleton) que guarda a meta diária, compartilhada por todos os funcionários.
    private static final Long META_ID = 1L;
    private static final BigDecimal META_DIA_PADRAO = new BigDecimal("1000.00");

    private final VendaRepository vendaRepository;
    private final MetaVendaRepository metaVendaRepository;

    public MetaVendaDiariaResponse metaVendaDiaria() {
        LocalDateTime inicioDia = LocalDate.now().atStartOfDay();
        LocalDateTime fimDia = inicioDia.plusDays(1).minusNanos(1);

        BigDecimal metaDia = metaAtual();

        BigDecimal realizadoHoje = vendaRepository
                .findAllFiltrado(inicioDia, fimDia, PageRequest.of(0, Integer.MAX_VALUE))
                .getContent()
                .stream()
                .map(v -> v.getTotal() != null ? v.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal percentual = metaDia.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : realizadoHoje
                        .multiply(new BigDecimal("100"))
                        .divide(metaDia, 2, RoundingMode.HALF_UP);

        log.info("meta-diaria: meta={}, realizado={}, percentual={}%",
                metaDia, realizadoHoje, percentual);

        return new MetaVendaDiariaResponse(
                metaDia,
                realizadoHoje,
                percentual,
                realizadoHoje.compareTo(metaDia) >= 0
        );
    }

    /**
     * Atualiza a meta diária de vendas — única para todos os funcionários.
     * D-2 — Segurança: restrito a usuários com perfil ADMIN (ver DashboardController).
     */
    @Transactional
    public MetaVendaDiariaResponse atualizarMetaDiaria(BigDecimal novoValor) {
        MetaVenda meta = metaVendaRepository.findById(META_ID).orElseGet(() -> {
            MetaVenda nova = new MetaVenda();
            nova.setId(META_ID);
            return nova;
        });
        meta.setValor(novoValor);
        metaVendaRepository.save(meta);

        log.info("Meta diária atualizada para {}", novoValor);
        return metaVendaDiaria();
    }

    private BigDecimal metaAtual() {
        return metaVendaRepository.findById(META_ID)
                .map(MetaVenda::getValor)
                .orElse(META_DIA_PADRAO);
    }
}
