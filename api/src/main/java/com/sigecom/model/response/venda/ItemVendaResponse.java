package com.sigecom.model.response.venda;

import com.sigecom.domain.ItemVenda;
import com.sigecom.domain.enums.TipoDesconto;
import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record ItemVendaResponse(
        Long produtoId,
        String nomeProduto,
        Integer quantidade,
        BigDecimal precoUnitario,
        TipoDesconto tipoDesconto,
        BigDecimal valorDesconto,
        BigDecimal descontoAplicado,
        BigDecimal subtotal
) {
    public static ItemVendaResponse toResponse(ItemVenda item) {
        return ItemVendaResponse.builder()
                .produtoId(item.getProduto().getId())
                .nomeProduto(item.getProduto().getNome())
                .quantidade(item.getQuantidade())
                .precoUnitario(item.getPrecoUnitario())
                .tipoDesconto(item.getTipoDesconto())
                .valorDesconto(item.getValorDesconto())
                .descontoAplicado(item.getDescontoAplicado())
                .subtotal(item.getSubtotal())
                .build();
    }
}
