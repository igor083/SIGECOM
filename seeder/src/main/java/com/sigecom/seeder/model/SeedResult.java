package com.sigecom.seeder.model;

/**
 * Resultado de uma etapa de seed.
 *
 * 'ignorados' e a metrica que comprova a idempotencia: na segunda execucao
 * seguida, criados = 0 e ignorados = total.
 */
public record SeedResult(
        String recurso,
        int criados,
        int ignorados,
        String observacao
) {

    public static SeedResult de(String recurso, int criados, int ignorados) {
        return new SeedResult(recurso, criados, ignorados, null);
    }

    public static SeedResult de(String recurso, int criados, int ignorados, String observacao) {
        return new SeedResult(recurso, criados, ignorados, observacao);
    }
}
