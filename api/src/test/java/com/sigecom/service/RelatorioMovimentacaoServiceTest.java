package com.sigecom.service;

import com.sigecom.domain.enums.PeriodoRelatorio;
import com.sigecom.model.response.relatorio.RelatorioMovimentacaoResponse;
import com.sigecom.repository.ItemVendaRepository;
import com.sigecom.repository.ProdutoRepository;
import com.sigecom.repository.projection.MovimentacaoDiaAgregado;
import com.sigecom.repository.projection.MovimentacaoProdutoAgregado;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RelatorioMovimentacaoServiceTest {

    @Mock
    private ItemVendaRepository itemVendaRepository;

    @Mock
    private ProdutoRepository produtoRepository;

    @InjectMocks
    private RelatorioMovimentacaoService relatorioMovimentacaoService;

    @Test
    void gerar_DeveAgregarResumoEMapearProdutos() {
        when(itemVendaRepository.agregarPorProduto(any(), any(), any(), any())).thenReturn(List.of(
                new MovimentacaoProdutoAgregado(1L, "Arroz", "Alimentos", 10L, new BigDecimal("100.00"), 4L),
                new MovimentacaoProdutoAgregado(2L, "Feijão", "Alimentos", 5L, new BigDecimal("50.00"), 3L)
        ));
        when(itemVendaRepository.agregarPorDia(any(), any(), any(), any())).thenReturn(List.of(
                new MovimentacaoDiaAgregado(LocalDate.of(2026, 8, 1), 15L, new BigDecimal("150.00"))
        ));

        RelatorioMovimentacaoResponse resposta = relatorioMovimentacaoService.gerar(
                null, null, PeriodoRelatorio.MES, null, null);

        assertEquals(2, resposta.porProduto().size());
        assertEquals("Arroz", resposta.porProduto().get(0).produtoNome());
        assertEquals(10L, resposta.porProduto().get(0).unidades());

        assertEquals(15L, resposta.resumo().totalUnidades());
        assertEquals(new BigDecimal("150.00"), resposta.resumo().totalReceita());
        assertEquals(2L, resposta.resumo().produtosDistintos());

        assertEquals(1, resposta.porDia().size());
        assertEquals(15L, resposta.porDia().get(0).unidades());
    }

    @Test
    void gerar_ComProdutoExistente_DeveRepassarOId() {
        when(produtoRepository.existsById(5L)).thenReturn(true);
        when(itemVendaRepository.agregarPorProduto(any(), any(), any(), any())).thenReturn(List.of());

        relatorioMovimentacaoService.gerar(5L, null, PeriodoRelatorio.DIA, null, null);

        verify(itemVendaRepository).agregarPorProduto(any(), any(), eq(5L), any());
    }

    @Test
    void gerar_ProdutoInexistente_DeveDevolver404SemConsultar() {
        when(produtoRepository.existsById(99L)).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> relatorioMovimentacaoService.gerar(99L, null, PeriodoRelatorio.MES, null, null));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        verifyNoInteractions(itemVendaRepository);
    }

    @Test
    void gerar_PeriodoPersonalizadoIncompleto_DeveDevolver400() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> relatorioMovimentacaoService.gerar(
                        null, null, null, LocalDate.of(2026, 8, 1), null));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verify(itemVendaRepository, never()).agregarPorProduto(any(), any(), any(), any());
    }
}
