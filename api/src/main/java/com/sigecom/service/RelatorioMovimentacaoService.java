package com.sigecom.service;

import com.sigecom.domain.enums.PeriodoRelatorio;
import com.sigecom.model.response.relatorio.RelatorioMovimentacaoResponse;
import com.sigecom.repository.ItemVendaRepository;
import com.sigecom.repository.ProdutoRepository;
import com.sigecom.repository.projection.MovimentacaoDiaAgregado;
import com.sigecom.repository.projection.MovimentacaoProdutoAgregado;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RelatorioMovimentacaoService {

    private final ItemVendaRepository itemVendaRepository;
    private final ProdutoRepository produtoRepository;

    private static final PeriodoRelatorio PERIODO_PADRAO = PeriodoRelatorio.MES;

    @Transactional(readOnly = true)
    public RelatorioMovimentacaoResponse gerar(Long produtoId,
                                               Long categoriaId,
                                               PeriodoRelatorio periodo,
                                               LocalDate dataInicio,
                                               LocalDate dataFim) {

        PeriodoRelatorio.Intervalo intervalo = resolverIntervalo(periodo, dataInicio, dataFim);
        validarProduto(produtoId);

        LocalDateTime inicio = intervalo.inicio().atStartOfDay();
        LocalDateTime fim = intervalo.fim().atTime(LocalTime.MAX);

        List<RelatorioMovimentacaoResponse.MovimentacaoProduto> porProduto =
                itemVendaRepository.agregarPorProduto(inicio, fim, produtoId, categoriaId).stream()
                        .map(this::paraProduto)
                        .toList();

        List<RelatorioMovimentacaoResponse.MovimentacaoDia> porDia =
                itemVendaRepository.agregarPorDia(inicio, fim, produtoId, categoriaId).stream()
                        .map(this::paraDia)
                        .toList();

        RelatorioMovimentacaoResponse.Resumo resumo = montarResumo(porProduto);

        log.info("relatorio-movimentacao: periodo=[{} a {}] produto={} categoria={} unidades={} receita={}",
                intervalo.inicio(), intervalo.fim(), produtoId, categoriaId,
                resumo.totalUnidades(), resumo.totalReceita());

        return new RelatorioMovimentacaoResponse(
                intervalo.inicio(),
                intervalo.fim(),
                produtoId,
                categoriaId,
                resumo,
                porProduto,
                porDia
        );
    }

    private PeriodoRelatorio.Intervalo resolverIntervalo(PeriodoRelatorio periodo,
                                                         LocalDate dataInicio,
                                                         LocalDate dataFim) {
        boolean temInicio = dataInicio != null;
        boolean temFim = dataFim != null;

        if (temInicio ^ temFim) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Para período personalizado, informe dataInicio e dataFim juntas");
        }
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

    private void validarProduto(Long produtoId) {
        if (produtoId != null && !produtoRepository.existsById(produtoId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Produto " + produtoId + " não encontrado");
        }
    }

    private RelatorioMovimentacaoResponse.MovimentacaoProduto paraProduto(MovimentacaoProdutoAgregado a) {
        return new RelatorioMovimentacaoResponse.MovimentacaoProduto(
                a.produtoId(),
                a.produtoNome(),
                a.categoriaNome(),
                valorOuZero(a.unidades()),
                a.receita() != null ? a.receita() : BigDecimal.ZERO,
                valorOuZero(a.numVendas()));
    }

    private RelatorioMovimentacaoResponse.MovimentacaoDia paraDia(MovimentacaoDiaAgregado a) {
        return new RelatorioMovimentacaoResponse.MovimentacaoDia(
                a.data(),
                valorOuZero(a.unidades()),
                a.receita() != null ? a.receita() : BigDecimal.ZERO);
    }

    private RelatorioMovimentacaoResponse.Resumo montarResumo(
            List<RelatorioMovimentacaoResponse.MovimentacaoProduto> porProduto) {
        long totalUnidades = porProduto.stream()
                .mapToLong(RelatorioMovimentacaoResponse.MovimentacaoProduto::unidades)
                .sum();
        BigDecimal totalReceita = porProduto.stream()
                .map(RelatorioMovimentacaoResponse.MovimentacaoProduto::receita)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new RelatorioMovimentacaoResponse.Resumo(totalUnidades, totalReceita, porProduto.size());
    }

    private long valorOuZero(Long valor) {
        return valor != null ? valor : 0L;
    }
}
