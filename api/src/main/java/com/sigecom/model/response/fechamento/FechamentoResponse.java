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
        // resultado financeiro do dia (receitas - despesas). NAO e dinheiro na gaveta.
        BigDecimal saldoCalculado,
        // fundo de troco e o que se espera contar na gaveta (SCRUM-161)
        BigDecimal fundoTroco,
        BigDecimal saldoEsperado,
        BigDecimal valorFisicoInformado,
        LocalDateTime fechadoEm,
        String responsavel
) {

    public static FechamentoResponse toResponse(FechamentoCaixa f){
        return new FechamentoResponse(
                f.getId(),
                f.getDataFechamento(),
                f.getTotalVendas(),
                f.getTotalReceitas(),
                f.getTotalDespesas(),
                f.getSaldoCalculado(),
                f.getFundoTroco(),
                f.getSaldoEsperado(),
                f.getValorFisicoInformado(),
                f.getFechadoEm(),
                f.getUsuario().getNome()
        );
    }
}
