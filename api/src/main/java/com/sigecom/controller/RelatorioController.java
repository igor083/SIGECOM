package com.sigecom.controller;

import com.sigecom.domain.enums.PeriodoRelatorio;
import com.sigecom.model.response.relatorio.RelatorioEstoqueResponse;
import com.sigecom.model.response.relatorio.RelatorioFinanceiroResponse;
import com.sigecom.model.response.relatorio.RelatorioMovimentacaoResponse;
import com.sigecom.model.response.relatorio.RelatorioReposicaoResponse;
import com.sigecom.model.response.relatorio.RelatorioVendasResponse;
import com.sigecom.service.RelatorioEstoqueService;
import com.sigecom.service.RelatorioFinanceiroService;
import com.sigecom.service.RelatorioMovimentacaoService;
import com.sigecom.service.ReposicaoEstoqueService;
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
    private final RelatorioFinanceiroService relatorioFinanceiroService;
    private final ReposicaoEstoqueService reposicaoEstoqueService;

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

    // D-2: sugestao de compra expoe giro e valor a investir, so ADMIN
    @GetMapping("/estoque/reposicao")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RelatorioReposicaoResponse> reposicao(
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false, defaultValue = "30") int janelaDias,
            @RequestParam(required = false, defaultValue = "15") int coberturaDias) {
        return ResponseEntity.ok(
                reposicaoEstoqueService.gerar(categoriaId, janelaDias, coberturaDias));
    }

    // D-2: relatório financeiro é visão de gestão, só ADMIN ve o saldo por categoria
    @GetMapping("/financeiro")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RelatorioFinanceiroResponse> financeiroPorPeriodo(
            @RequestParam(required = false) PeriodoRelatorio periodo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false) Long categoriaId) {
        return ResponseEntity.ok(relatorioFinanceiroService.gerar(periodo, dataInicio, dataFim, categoriaId));
    }
}
