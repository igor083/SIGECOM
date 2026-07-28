package com.sigecom.model.response.fechamento;

import com.sigecom.domain.FechamentoCaixa;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record FechamentoResponse(
        
        Long id,
        LocalDate dataFechamento,
        BigDecimal totalVendas,
        BigDecimal totalReceitas,
        BigDecimal totalDespesas,
        BigDecimal saldoCalculado,
        BigDecimal valorFisicoInformado,
        LocalDateTime fechadoEm
) {

    public static FechamentoResponse toResponse(FechamentoCaixa f){
        return new FechamentoResponse(
                f.getId(),
                f.getDataFechamento(),
                f.getTotalVendas(),
                f.getTotalReceitas(),
                f.getTotalDespesas(),
                f.getSaldoCalculado(),
                f.getValorFisicoInformado(),
                f.getFechadoEm()  
        );
    }
}