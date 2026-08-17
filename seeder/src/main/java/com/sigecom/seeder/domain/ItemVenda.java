package com.sigecom.seeder.domain;

import com.sigecom.seeder.domain.enums.TipoDesconto;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/** Espelho de com.sigecom.domain.ItemVenda. */
@Entity
@Table(name = "item_venda")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemVenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venda_id", nullable = false)
    private Venda venda;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(nullable = false)
    private Integer quantidade;

    @Column(name = "preco_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoUnitario;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_desconto")
    private TipoDesconto tipoDesconto;

    @Builder.Default
    @Column(name = "valor_desconto", precision = 10, scale = 2)
    private BigDecimal valorDesconto = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "desconto_aplicado", nullable = false, precision = 10, scale = 2)
    private BigDecimal descontoAplicado = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;
}
