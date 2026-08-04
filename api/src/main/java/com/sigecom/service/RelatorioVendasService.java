package com.sigecom.service;

import com.sigecom.domain.enums.PeriodoRelatorio;
import com.sigecom.model.response.relatorio.RelatorioVendasResponse;
import com.sigecom.repository.UsuarioRepository;
import com.sigecom.repository.VendaRepository;
import com.sigecom.repository.projection.RelatorioVendasAgregado;
import com.sigecom.repository.projection.VendasPorDiaAgregado;
import com.sigecom.repository.projection.VendasPorFormaPagamentoAgregado;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Relatório de vendas por período (US — acompanhar desempenho comercial).
 *
 * Entrega um resumo consolidado do período:
 *  - total de vendas
 *  - quantidade de transações
 *  - ticket médio (total / quantidade, com guarda de divisão por zero)
 *
 * Regras de período (resolvidas aqui, nunca no controller nem no repository):
 *  - período personalizado: quando dataInicio E dataFim são informadas, elas
 *    têm prioridade sobre o preset;
 *  - informar apenas uma das duas datas → 400 (par incompleto é ambíguo);
 *  - sem datas personalizadas: usa o preset (DIA/SEMANA/MES) relativo a hoje;
 *  - sem preset e sem datas: cai no padrão {@link #PERIODO_PADRAO} (mês corrente).
 *
 * Filtro opcional por funcionário responsável (usuario_id da venda); um id
 * inexistente resulta em 404, para não devolver silenciosamente um relatório
 * vazio sobre um funcionário que não existe.
 *
 * Escopo (decisão de produto): não há cancelamento de venda no sistema hoje,
 * então "vendas confirmadas, excluindo canceladas" equivale a todas as vendas
 * persistidas. Quando o status de venda existir, o filtro entra na query do
 * repository sem mudança nesta camada.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RelatorioVendasService {

    private final VendaRepository vendaRepository;
    private final UsuarioRepository usuarioRepository;

    private static final int ESCALA = 2;
    private static final RoundingMode ARREDONDAMENTO = RoundingMode.HALF_UP;

    // Preset assumido quando o admin não informa período nem datas.
    private static final PeriodoRelatorio PERIODO_PADRAO = PeriodoRelatorio.MES;

    @Transactional(readOnly = true)
    public RelatorioVendasResponse gerar(PeriodoRelatorio periodo,
                                         LocalDate dataInicio,
                                         LocalDate dataFim,
                                         Long funcionarioId) {

        PeriodoRelatorio.Intervalo intervalo = resolverIntervalo(periodo, dataInicio, dataFim);
        validarFuncionario(funcionarioId);

        // atTime(MAX) no fim para não perder as vendas do próprio dia final —
        // mesma convenção do VendaService/LancamentoService.
        LocalDateTime inicio = intervalo.inicio().atStartOfDay();
        LocalDateTime fim = intervalo.fim().atTime(LocalTime.MAX);

        RelatorioVendasAgregado agregado =
                vendaRepository.agregarPorPeriodo(inicio, fim, funcionarioId);

        BigDecimal totalVendas = valorOuZero(agregado.totalVendas());
        long quantidade = quantidadeOuZero(agregado.quantidadeTransacoes());
        BigDecimal ticketMedio = calcularTicketMedio(totalVendas, quantidade);

        // Séries para os gráficos do front — mesmo período/funcionário do resumo.
        List<RelatorioVendasResponse.VendaDiaria> vendasPorDia =
                montarVendasPorDia(inicio, fim, funcionarioId);
        List<RelatorioVendasResponse.VendaPorFormaPagamento> vendasPorFormaPagamento =
                montarVendasPorFormaPagamento(inicio, fim, funcionarioId);

        log.info("relatorio-vendas: periodo=[{} a {}] funcionario={} total={} qtd={} ticketMedio={}",
                intervalo.inicio(), intervalo.fim(), funcionarioId, totalVendas, quantidade, ticketMedio);

        return new RelatorioVendasResponse(
                escala(totalVendas),
                quantidade,
                ticketMedio,
                intervalo.inicio(),
                intervalo.fim(),
                funcionarioId,
                vendasPorDia,
                vendasPorFormaPagamento
        );
    }

    // ── Séries dos gráficos ──────────────────────────────────────

    private List<RelatorioVendasResponse.VendaDiaria> montarVendasPorDia(
            LocalDateTime inicio, LocalDateTime fim, Long funcionarioId) {
        return vendaRepository.agregarPorDia(inicio, fim, funcionarioId).stream()
                .map(this::paraVendaDiaria)
                .toList();
    }

    private RelatorioVendasResponse.VendaDiaria paraVendaDiaria(VendasPorDiaAgregado dia) {
        return new RelatorioVendasResponse.VendaDiaria(
                dia.data(),
                escala(valorOuZero(dia.total())),
                quantidadeOuZero(dia.quantidade()));
    }

    private List<RelatorioVendasResponse.VendaPorFormaPagamento> montarVendasPorFormaPagamento(
            LocalDateTime inicio, LocalDateTime fim, Long funcionarioId) {
        return vendaRepository.agregarPorFormaPagamento(inicio, fim, funcionarioId).stream()
                .map(this::paraFormaPagamento)
                .toList();
    }

    private RelatorioVendasResponse.VendaPorFormaPagamento paraFormaPagamento(
            VendasPorFormaPagamentoAgregado forma) {
        return new RelatorioVendasResponse.VendaPorFormaPagamento(
                forma.tipoPagamento(),
                escala(valorOuZero(forma.total())),
                quantidadeOuZero(forma.quantidade()));
    }

    // ── Resolução do período ─────────────────────────────────────

    private PeriodoRelatorio.Intervalo resolverIntervalo(PeriodoRelatorio periodo,
                                                         LocalDate dataInicio,
                                                         LocalDate dataFim) {
        boolean temInicio = dataInicio != null;
        boolean temFim = dataFim != null;

        // Par incompleto: ambíguo — obriga o cliente a mandar as duas datas.
        if (temInicio ^ temFim) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Para período personalizado, informe dataInicio e dataFim juntas");
        }

        // Período personalizado tem prioridade sobre o preset.
        if (temInicio) {
            if (dataInicio.isAfter(dataFim)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "A data de início não pode ser posterior à data de fim");
            }
            return new PeriodoRelatorio.Intervalo(dataInicio, dataFim);
        }

        PeriodoRelatorio efetivo = (periodo != null) ? periodo : PERIODO_PADRAO;
        return efetivo.intervalo(LocalDate.now());
    }

    private void validarFuncionario(Long funcionarioId) {
        if (funcionarioId != null && !usuarioRepository.existsById(funcionarioId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Funcionário " + funcionarioId + " não encontrado");
        }
    }

    // ── Cálculo ──────────────────────────────────────────────────

    private BigDecimal calcularTicketMedio(BigDecimal totalVendas, long quantidade) {
        if (quantidade == 0) {
            return escala(BigDecimal.ZERO); // sem transações → sem ticket médio
        }
        return totalVendas.divide(BigDecimal.valueOf(quantidade), ESCALA, ARREDONDAMENTO);
    }

    // COALESCE/COUNT na query já protegem contra null, mas defendemos aqui
    // também para o caso de a query ser alterada no futuro.
    private BigDecimal valorOuZero(BigDecimal valor) {
        return (valor != null) ? valor : BigDecimal.ZERO;
    }

    private long quantidadeOuZero(Long quantidade) {
        return (quantidade != null) ? quantidade : 0L;
    }

    private BigDecimal escala(BigDecimal valor) {
        return valor.setScale(ESCALA, ARREDONDAMENTO);
    }
}
