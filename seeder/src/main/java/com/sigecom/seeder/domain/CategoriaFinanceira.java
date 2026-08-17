package com.sigecom.seeder.domain;

import com.sigecom.seeder.domain.enums.TipoLancamento;
import jakarta.persistence.*;
import lombok.*;

/**
 * Espelho de com.sigecom.domain.CategoriaFinanceira.
 *
 * O seeder sempre grava protegida=false: categoria criada aqui e dado de
 * teste, e precisa continuar editavel e removivel pelo CRUD do admin (e
 * pela limpeza deste proprio seeder). Categorias marcadas protegida=true
 * no banco vieram do antigo seeder da aplicacao e ficam intocadas.
 */
@Entity
@Table(name = "categoria_financeira")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoriaFinanceira {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoLancamento tipo;

    @Builder.Default
    @Column(nullable = false)
    private boolean protegida = false;
}
