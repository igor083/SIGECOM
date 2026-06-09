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
}
