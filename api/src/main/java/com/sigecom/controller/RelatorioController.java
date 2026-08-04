package com.sigecom.controller;

import com.sigecom.domain.enums.PeriodoRelatorio;
import com.sigecom.model.response.relatorio.RelatorioVendasResponse;
import com.sigecom.service.RelatorioVendasService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * Relatórios gerenciais (US — Relatório de Vendas por Período).
 *
 * D-2: relatórios de desempenho comercial são visão de gestão — somente ADMIN.
 */
@RestController
@RequestMapping("/relatorios")
@RequiredArgsConstructor
public class RelatorioController {

    private final RelatorioVendasService relatorioVendasService;

    /**
     * Resumo consolidado de vendas do período: total, quantidade de transações
     * e ticket médio.
     *
     * @param periodo       preset DIA/SEMANA/MES relativo a hoje (default: MES)
     * @param dataInicio    início do período personalizado (usar com dataFim)
     * @param dataFim       fim do período personalizado (usar com dataInicio)
     * @param funcionarioId filtra pelo funcionário responsável (opcional)
     */
    @GetMapping("/vendas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RelatorioVendasResponse> vendasPorPeriodo(
            @RequestParam(required = false) PeriodoRelatorio periodo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false) Long funcionarioId) {
        return ResponseEntity.ok(
                relatorioVendasService.gerar(periodo, dataInicio, dataFim, funcionarioId));
    }
}
