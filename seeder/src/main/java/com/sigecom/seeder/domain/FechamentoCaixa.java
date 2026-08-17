package com.sigecom.seeder.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Espelho de com.sigecom.domain.FechamentoCaixa. */
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

    @Builder.Default
    @Column(name = "total_vendas", precision = 12, scale = 2)
    private BigDecimal totalVendas = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_receitas", precision = 12, scale = 2)
    private BigDecimal totalReceitas = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_despesas", precision = 12, scale = 2)
    private BigDecimal totalDespesas = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "saldo_calculado", precision = 12, scale = 2)
    private BigDecimal saldoCalculado = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "fundo_troco", precision = 12, scale = 2)
    private BigDecimal fundoTroco = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "saldo_esperado", precision = 12, scale = 2)
    private BigDecimal saldoEsperado = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "valor_fisico_informado", precision = 12, scale = 2)
    private BigDecimal valorFisicoInformado = BigDecimal.ZERO;

    @Column(name = "fechado_em", updatable = false)
    private LocalDateTime fechadoEm;
}
