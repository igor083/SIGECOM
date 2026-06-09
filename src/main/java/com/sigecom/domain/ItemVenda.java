package com.sigecom.domain;

import com.sigecom.domain.enums.TipoDesconto;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "item_venda")
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

    // Preço do produto no momento da venda (preserva histórico)
    @Column(name = "preco_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoUnitario;

    // ----- Rastreio de desconto por item -----
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_desconto")
    private TipoDesconto tipoDesconto;

    // Valor informado do desconto: se PERCENTUAL guarda o %, se VALOR_FIXO guarda o valor em R$
    @Column(name = "valor_desconto", precision = 10, scale = 2)
    private BigDecimal valorDesconto = BigDecimal.ZERO;

    // Valor monetário efetivamente descontado neste item (calculado)
    @Column(name = "desconto_aplicado", nullable = false, precision = 10, scale = 2)
    private BigDecimal descontoAplicado = BigDecimal.ZERO;

    // Subtotal final do item já com desconto: (preco_unitario * quantidade) - desconto_aplicado
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Venda getVenda() { return venda; }
    public void setVenda(Venda venda) { this.venda = venda; }
    public Produto getProduto() { return produto; }
    public void setProduto(Produto produto) { this.produto = produto; }
    public Integer getQuantidade() { return quantidade; }
    public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }
    public BigDecimal getPrecoUnitario() { return precoUnitario; }
    public void setPrecoUnitario(BigDecimal precoUnitario) { this.precoUnitario = precoUnitario; }
    public TipoDesconto getTipoDesconto() { return tipoDesconto; }
    public void setTipoDesconto(TipoDesconto tipoDesconto) { this.tipoDesconto = tipoDesconto; }
    public BigDecimal getValorDesconto() { return valorDesconto; }
    public void setValorDesconto(BigDecimal valorDesconto) { this.valorDesconto = valorDesconto; }
    public BigDecimal getDescontoAplicado() { return descontoAplicado; }
    public void setDescontoAplicado(BigDecimal descontoAplicado) { this.descontoAplicado = descontoAplicado; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
}
