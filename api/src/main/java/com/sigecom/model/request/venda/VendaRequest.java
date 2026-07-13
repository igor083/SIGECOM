package com.sigecom.model.request.venda;

import com.sigecom.domain.enums.TipoPagamento;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Payload usado tanto pelo preview (POST /vendas/calcular) quanto pela
 * confirmação (POST /vendas). O tipoPagamento é opcional no preview
 * (o operador ainda não escolheu) e OBRIGATÓRIO na confirmação —
 * validação feita no VendaService.confirmar().
 */
public record VendaRequest(

        @NotEmpty(message = "A venda deve ter ao menos um item")
        @Valid
        List<ItemVendaRequest> itens,

        TipoPagamento tipoPagamento
) {}
