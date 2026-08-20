package com.sigecom.exception;

import lombok.Getter;

/**
 * Login barrado por excesso de tentativas falhas (ver ControleTentativasLogin).
 *
 * Tipo próprio em vez de ResponseStatusException(429) para carregar em quanto
 * tempo a conta libera - é esse número que vira o cabeçalho Retry-After, que
 * diz ao cliente quando vale tentar de novo em vez de ficar insistindo.
 */
@Getter
public class TentativasExcedidasException extends RuntimeException {

    private final long segundosParaLiberar;

    public TentativasExcedidasException(long segundosParaLiberar) {
        super("Excesso de tentativas de login; libera em " + segundosParaLiberar + "s");
        this.segundosParaLiberar = segundosParaLiberar;
    }
}
