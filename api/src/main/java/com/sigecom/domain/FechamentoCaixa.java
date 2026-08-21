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

    // Movimentacoes em dinheiro no dia (SCRUM-162): usadas pra calcular
    // o saldoEsperado (caixa fisico).
    @Builder.Default
    @Column(name = "total_receitas_dinheiro", precision = 12, scale = 2)
    private BigDecimal totalReceitasDinheiro = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_despesas_dinheiro", precision = 12, scale = 2)
    private BigDecimal totalDespesasDinheiro = BigDecimal.ZERO;

    @NotNull
    @Builder.Default
    @Column(name = "saldo_calculado", precision = 12, scale = 2)
    private BigDecimal saldoCalculado = BigDecimal.ZERO;

    // Dinheiro que ja estava na gaveta quando o dia comecou (SCRUM-161).
    // Sem @NotNull de proposito: com ddl-auto=update, coluna nova NOT NULL
    // em tabela que ja tem linha o Postgres rejeita, e o Hibernate engole
    // o erro e sobe sem a coluna. Fechamento antigo fica com null aqui.
    @Builder.Default
    @Column(name = "fundo_troco", precision = 12, scale = 2)
    private BigDecimal fundoTroco = BigDecimal.ZERO;

    // Gravado, e nao so calculado na hora: se o fundo padrao mudar,
    // o fechamento antigo continua contando a historia dele (SCRUM-161)
    @Builder.Default
    @Column(name = "saldo_esperado", precision = 12, scale = 2)
    private BigDecimal saldoEsperado = BigDecimal.ZERO;

    @NotNull
    @Builder.Default
    @Column(name = "valor_fisico_informado", precision = 12, scale = 2)
    private BigDecimal valorFisicoInformado = BigDecimal.ZERO;

    @NotNull
    @Column(name = "fechado_em", updatable = false)
    private LocalDateTime fechadoEm;
}
