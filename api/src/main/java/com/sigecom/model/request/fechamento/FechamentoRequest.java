package com.sigecom.model.request.fechamento;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

// valor "contado" e fundo de troco vem do front, restante o back calcula sozinho
public record FechamentoRequest(

    @NotNull(message = "O valor em caixa é obrigatório")
    @PositiveOrZero(message = "O valor  não pode ser negativo")
    BigDecimal valorFisicoInformado,

    // Quanto tinha na gaveta quando o caixa abriu (SCRUM-161).
    // Opcional de proposito: cliente antigo que nao manda o campo continua
    // fechando o caixa, e o service cai no fundo padrao da loja.
    @PositiveOrZero(message = "O fundo de troco não pode ser negativo")
    BigDecimal fundoTroco
) {}
