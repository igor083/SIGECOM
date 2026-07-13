package com.sigecom.model.response.venda;

import com.sigecom.domain.Venda;
import com.sigecom.domain.enums.TipoPagamento;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Resumo enxuto para a listagem de histórico de vendas.
 * Não carrega itens — a página de detalhe usa outra chamada
 * quando necessário (evita payload pesado no /vendas).
 */
@Builder
public record VendaResumoResponse(
        Long id,
        LocalDateTime dataHora,
        String operador,
        TipoPagamento tipoPagamento,
        int qtdItens,
        BigDecimal subtotal,
        BigDecimal descontoTotal,
        BigDecimal total
) {

    public static VendaResumoResponse toResponse(Venda venda) {
        BigDecimal desconto = venda.getDesconto() != null ? venda.getDesconto() : BigDecimal.ZERO;
        BigDecimal total = venda.getTotal() != null ? venda.getTotal() : BigDecimal.ZERO;
        // Venda persiste apenas total e desconto; subtotal é derivado.
        BigDecimal subtotal = total.add(desconto);

        int qtdItens = venda.getItens() == null ? 0 :
                venda.getItens().stream().mapToInt(i -> i.getQuantidade() == null ? 0 : i.getQuantidade()).sum();

        return VendaResumoResponse.builder()
                .id(venda.getId())
                .dataHora(venda.getDataHora())
                .operador(venda.getUsuario() != null ? venda.getUsuario().getNome() : null)
                .tipoPagamento(venda.getTipoPagamento())
                .qtdItens(qtdItens)
                .subtotal(subtotal)
                .descontoTotal(desconto)
                .total(total)
                .build();
    }
}
