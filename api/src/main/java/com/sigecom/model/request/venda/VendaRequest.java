package com.sigecom.model.request.venda;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record VendaRequest(

        @NotEmpty(message = "A venda deve ter ao menos um item")
        @Valid
        List<ItemVendaRequest> itens
) {}
