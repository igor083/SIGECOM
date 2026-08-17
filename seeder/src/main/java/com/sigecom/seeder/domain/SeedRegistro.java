package com.sigecom.seeder.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Uma linha criada pelo seeder.
 *
 * Unica tabela que o seeder possui (ver schema-seeder.sql). Nao faz parte do
 * dominio da aplicacao original - existe so para a limpeza saber, com
 * precisao, o que apagar. Chave natural do registro e o par (recurso, id).
 */
@Entity
@Table(name = "seed_registro")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeedRegistro {

    public enum Recurso {
        USUARIO,
        CATEGORIA_PRODUTO,
        CATEGORIA_FINANCEIRA,
        PRODUTO,
        VENDA,
        LANCAMENTO,
        FECHAMENTO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private Recurso recurso;

    /** Id da linha criada, na tabela de dominio correspondente. */
    @Column(name = "registro_id", nullable = false)
    private Long registroId;

    @Builder.Default
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();
}
