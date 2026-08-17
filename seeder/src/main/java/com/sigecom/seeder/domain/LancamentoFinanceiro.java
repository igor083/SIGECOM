package com.sigecom.seeder.domain;

import com.sigecom.seeder.domain.enums.TipoLancamento;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Espelho de com.sigecom.domain.LancamentoFinanceiro. */
@Entity
@Table(name = "lancamento_financeiro")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LancamentoFinanceiro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id", nullable = false)
    private CategoriaFinanceira categoria;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoLancamento tipo;

    @Column(nullable = false, length = 255)
    private String descricao;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @Builder.Default
    @Column(name = "data_hora", nullable = false, updatable = false)
    private LocalDateTime dataHora = LocalDateTime.now();
}
