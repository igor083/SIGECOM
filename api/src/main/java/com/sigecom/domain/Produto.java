package com.sigecom.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "produto")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id", nullable = false)
    private CategoriaProduto categoria;

    @Column(nullable = false)
    private String nome;

    @Column(length = 500)
    private String descricao;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal preco;

    @Builder.Default
    @Column(name = "qtd_estoque", nullable = false)
    private Integer qtdEstoque = 0;

    @Builder.Default
    @Column(name = "estoque_minimo", nullable = false)
    private Integer estoqueMinimo = 0;

    @Builder.Default
    @Column(nullable = false)
    private boolean ativo = true;
}
