package com.sigecom.seeder.domain;

import jakarta.persistence.*;
import lombok.*;

/** Espelho de com.sigecom.domain.CategoriaProduto. */
@Entity
@Table(name = "categoria_produto")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoriaProduto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nome;
}
