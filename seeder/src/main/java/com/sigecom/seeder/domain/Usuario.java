package com.sigecom.seeder.domain;

import com.sigecom.seeder.domain.enums.TipoUsuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Espelho de com.sigecom.domain.Usuario da aplicacao original.
 *
 * O seeder mantem sua propria copia das entidades para nao criar
 * acoplamento de build entre os dois modulos. O contrato entre eles e o
 * schema do banco - por isso nomes de tabela e coluna sao mapeados
 * explicitamente aqui, e o Hibernate roda com ddl-auto=none.
 */
@Entity
@Table(name = "usuario")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoUsuario perfil;

    @Builder.Default
    @Column(nullable = false)
    private boolean ativo = true;

    @Builder.Default
    @Column(name = "senha_temporaria", nullable = false)
    private boolean senhaTemporaria = false;

    @Builder.Default
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();
}
