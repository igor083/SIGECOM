package com.sigecom.seeder.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "sigecom.seed")
public class SeedProperties {

    /** Janela retroativa, em dias, coberta por vendas/lancamentos/fechamentos. */
    private int dias = 90;

    /**
     * Semente do gerador pseudoaleatorio. Fixa: o mesmo valor sempre produz
     * exatamente o mesmo conjunto de dados, o que e o que torna a geracao
     * repetivel (e, junto com as chaves naturais, idempotente).
     */
    private long randomSeed = 20260816L;

    /** Senha em texto puro atribuida a todo usuario de teste. */
    private String senhaPadrao = "senha123";
}
