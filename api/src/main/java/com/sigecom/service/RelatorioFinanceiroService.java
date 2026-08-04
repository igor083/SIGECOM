package com.sigecom.service;

import com.sigecom.domain.enums.PeriodoRelatorio;
import com.sigecom.domain.enums.TipoLancamento;
import com.sigecom.model.response.relatorio.RelatorioFinanceiroResponse;
import com.sigecom.model.response.relatorio.RelatorioFinanceiroResponse.CategoriaFinanceiraTotal;
import com.sigecom.repository.LancamentoFinanceiroRepository;
import com.sigecom.repository.projection.CategoriaFinanceiraAgregado;
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
public class RelatorioFinanceiroService {

    private final LancamentoFinanceiroRepository lancamentoFinanceiroRepository;

    // D-5: toda lógica de resolução de período e montagem do response fica aqui,
    //       o controller só repassa os parâmetros.
    @Transactional(readOnly = true)
    public RelatorioFinanceiroResponse gerar(PeriodoRelatorio periodo,
                                             LocalDate dataInicio,
                                             LocalDate dataFim,
                                             Long categoriaId) {
        LocalDate[] intervalo = resolverIntervalo(periodo, dataInicio, dataFim);
        LocalDate inicio = intervalo[0];
        LocalDate fim    = intervalo[1];

        if (inicio.isAfter(fim)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A data de início não pode ser posterior à data de fim");
        }

        LocalDateTime dtInicio = inicio.atStartOfDay();
        LocalDateTime dtFim    = fim.atTime(LocalTime.MAX); // não usar atStartOfDay() — perderia lançamentos da tarde

        List<CategoriaFinanceiraAgregado> agregados =
                lancamentoFinanceiroRepository.somarAgrupadoPorCategoria(dtInicio, dtFim, categoriaId);

        // Monta porCategoria e soma totais em memória — resultado já é pequeno (agregado por categoria, não por lançamento).
        List<CategoriaFinanceiraTotal> porCategoria = agregados.stream()
                .map(a -> new CategoriaFinanceiraTotal(
                        a.getCategoriaId(),
                        a.getCategoriaNome(),
                        a.getTipo(),
                        a.getTotal()))
                .toList();

        BigDecimal totalReceitas = somarPorTipo(porCategoria, TipoLancamento.RECEITA);
        BigDecimal totalDespesas = somarPorTipo(porCategoria, TipoLancamento.DESPESA);

        log.info("Relatório financeiro gerado: {} a {} | categoriaId={} | receitas={} despesas={}",
                inicio, fim, categoriaId, totalReceitas, totalDespesas);

        return new RelatorioFinanceiroResponse(
                totalReceitas,
                totalDespesas,
                totalReceitas.subtract(totalDespesas),
                inicio,
                fim,
                porCategoria
        );
    }

    private LocalDate[] resolverIntervalo(PeriodoRelatorio periodo, LocalDate dataInicio, LocalDate dataFim) {
        // Datas personalizadas têm prioridade sobre o preset.
        if (dataInicio != null && dataFim != null) {
            return new LocalDate[]{dataInicio, dataFim};
        }
        // Preset: usa o enum (default MES quando periodo vier nulo).
        PeriodoRelatorio preset = (periodo != null) ? periodo : PeriodoRelatorio.MES;
        PeriodoRelatorio.Intervalo i = preset.intervalo(LocalDate.now());
        return new LocalDate[]{i.inicio(), i.fim()};
    }

    private BigDecimal somarPorTipo(List<CategoriaFinanceiraTotal> lista, TipoLancamento tipo) {
        return lista.stream()
                .filter(c -> c.tipo() == tipo)
                .map(CategoriaFinanceiraTotal::total)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
