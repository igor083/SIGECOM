package com.sigecom.domain;

import com.sigecom.domain.enums.DescricaoLancamento;
import com.sigecom.domain.enums.TipoLancamento;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DescricaoLancamento descricao;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @Builder.Default
    @Column(name = "data_hora", nullable = false, updatable = false)
    private LocalDateTime dataHora= LocalDateTime.now();
}
