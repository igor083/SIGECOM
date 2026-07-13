package com.sigecom.model.response.venda;

import lombok.Builder;

import java.math.BigDecimal;
import java.util.List;

/**
 * Preview do total da venda — usado pelo front para exibir
 * subtotal, desconto total e total final antes da confirmação.
 * (US-026, CA: subtotal, desconto total e total final separados)
 */
@Builder
public record CalculoVendaResponse(
        List<ItemVendaResponse> itens,
        BigDecimal subtotal,
        BigDecimal descontoTotal,
        BigDecimal total
) {}
