package com.sigecom.seeder.model;

import java.time.LocalDateTime;
import java.util.List;

/** Relatorio consolidado de uma execucao do seeder. */
public record SeedReport(
        LocalDateTime executadoEm,
        long duracaoMs,
        int totalCriados,
        int totalIgnorados,
        List<SeedResult> etapas
) {

    public static SeedReport de(List<SeedResult> etapas, long duracaoMs) {
        int criados = etapas.stream().mapToInt(SeedResult::criados).sum();
        int ignorados = etapas.stream().mapToInt(SeedResult::ignorados).sum();
        return new SeedReport(LocalDateTime.now(), duracaoMs, criados, ignorados, etapas);
    }
}
