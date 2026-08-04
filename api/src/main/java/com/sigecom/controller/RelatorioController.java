package com.sigecom.controller;

import com.sigecom.domain.enums.PeriodoRelatorio;
import com.sigecom.model.response.relatorio.RelatorioEstoqueResponse;
import com.sigecom.model.response.relatorio.RelatorioMovimentacaoResponse;
import com.sigecom.model.response.relatorio.RelatorioVendasResponse;
import com.sigecom.service.RelatorioEstoqueService;
import com.sigecom.service.RelatorioMovimentacaoService;
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
    private final RelatorioEstoqueService relatorioEstoqueService;
    private final RelatorioMovimentacaoService relatorioMovimentacaoService;

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

    /**
     * Relatório de estoque: lista os produtos ativos com quantidade atual,
     * nível mínimo e status de criticidade (NORMAL/ALERTA/CRITICO), além de um
     * resumo (totais e valor em estoque). Filtra por categoria e busca por nome;
     * ordena pela quantidade disponível.
     *
     * D-2: visão de gestão — somente ADMIN.
     */
    @GetMapping("/estoque")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RelatorioEstoqueResponse> estoque(
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) String busca,
            @RequestParam(required = false, defaultValue = "QUANTIDADE_ASC")
            RelatorioEstoqueService.Ordenacao ordenacao) {
        return ResponseEntity.ok(
                relatorioEstoqueService.gerar(categoriaId, busca, ordenacao));
    }

    /**
     * Movimentações de estoque (saídas por venda) agregadas por produto e por dia,
     * no período. Filtra por produto específico e/ou categoria — permite ao admin
     * ver o giro de um item ou tipo e identificar baixo giro.
     *
     * D-2: visão de gestão — somente ADMIN.
     */
    @GetMapping("/estoque/movimentacoes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RelatorioMovimentacaoResponse> movimentacoes(
            @RequestParam(required = false) Long produtoId,
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) PeriodoRelatorio periodo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        return ResponseEntity.ok(
                relatorioMovimentacaoService.gerar(produtoId, categoriaId, periodo, dataInicio, dataFim));
    }
}
