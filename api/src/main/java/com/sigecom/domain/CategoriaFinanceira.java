package com.sigecom.domain;

import com.sigecom.domain.enums.TipoLancamento;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "categoria_financeira")
@Getter
@Setter
@NoArgsConstructor
public class CategoriaFinanceira {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoLancamento tipo;

    // Categorias criadas pelo seeder (sistema) não podem ser editadas nem
    // removidas — protege integrações que dependem delas por nome, como o
    // lançamento automático de receita da venda (categoria "Venda").
    @Column(nullable = false, columnDefinition = "boolean NOT NULL DEFAULT false")
    private boolean protegida = false;
}
