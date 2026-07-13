package com.sigecom.model.response.venda;

import com.sigecom.domain.Venda;
import com.sigecom.domain.enums.TipoPagamento;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Comprovante simplificado da venda persistida (US-027).
 * Contém itens, quantidades e total — o suficiente para
 * o operador conferir e/ou entregar ao cliente.
 */
@Builder
public record VendaResponse(
        Long id,
        LocalDateTime dataHora,
        String operador,
        TipoPagamento tipoPagamento,
        List<ItemVendaResponse> itens,
        BigDecimal subtotal,
        BigDecimal descontoTotal,
        BigDecimal total
) {
    public static VendaResponse toResponse(Venda venda, BigDecimal subtotal) {
        List<ItemVendaResponse> itens = venda.getItens().stream()
                .map(ItemVendaResponse::toResponse)
                .toList();

        return VendaResponse.builder()
                .id(venda.getId())
                .dataHora(venda.getDataHora())
                .operador(venda.getUsuario().getNome())
                .tipoPagamento(venda.getTipoPagamento())
                .itens(itens)
                .subtotal(subtotal)
                .descontoTotal(venda.getDesconto())
                .total(venda.getTotal())
                .build();
    }
}
