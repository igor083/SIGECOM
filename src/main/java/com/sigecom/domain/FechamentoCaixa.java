package com.sigecom.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fechamento_caixa")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FechamentoCaixa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "data_fechamento", nullable = false)
    private LocalDate dataFechamento;

    @NotNull
    @Builder.Default
    @Column(name = "total_vendas", precision = 12, scale = 2)
    private BigDecimal totalVendas = BigDecimal.ZERO;

    @NotNull
    @Builder.Default
    @Column(name = "total_receitas", precision = 12, scale = 2)
    private BigDecimal totalReceitas = BigDecimal.ZERO;

    @NotNull
    @Builder.Default
    @Column(name = "total_despesas", precision = 12, scale = 2)
    private BigDecimal totalDespesas = BigDecimal.ZERO;

    @NotNull
    @Builder.Default
    @Column(name = "saldo_calculado", precision = 12, scale = 2)
    private BigDecimal saldoCalculado = BigDecimal.ZERO;

    @NotNull
    @Builder.Default
    @Column(name = "valor_fisico_informado", precision = 12, scale = 2)
    private BigDecimal valorFisicoInformado = BigDecimal.ZERO;

    @NotNull
    @Column(name = "fechado_em", updatable = false)
    private LocalDateTime fechadoEm;
}
