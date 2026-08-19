package com.sigecom.service;

import com.sigecom.domain.CategoriaProduto;
import com.sigecom.domain.Produto;
import com.sigecom.domain.enums.StatusEstoque;
import com.sigecom.model.response.relatorio.RelatorioReposicaoResponse;
import com.sigecom.repository.ItemVendaRepository;
import com.sigecom.repository.ProdutoRepository;
import com.sigecom.repository.projection.MovimentacaoProdutoAgregado;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReposicaoEstoqueServiceTest {

    @Mock
    private ProdutoRepository produtoRepository;

    @Mock
    private ItemVendaRepository itemVendaRepository;

    @InjectMocks
    private ReposicaoEstoqueService reposicaoEstoqueService;

    private static final int JANELA = 30;
    private static final int COBERTURA = 15;

    private Produto produto(long id, String nome, int qtd, int minimo, String preco) {
        CategoriaProduto categoria = new CategoriaProduto();
        categoria.setId(9L);
        categoria.setNome("Bebidas");
        return Produto.builder()
                .id(id)
                .nome(nome)
                .categoria(categoria)
                .preco(new BigDecimal(preco))
                .qtdEstoque(qtd)
                .estoqueMinimo(minimo)
                .ativo(true)
                .build();
    }

    private MovimentacaoProdutoAgregado vendido(long produtoId, long unidades) {
        return new MovimentacaoProdutoAgregado(
                produtoId, "produto " + produtoId, "Bebidas",
                unidades, new BigDecimal("100.00"), 3L);
    }

    private void semVendas() {
        when(itemVendaRepository.agregarPorProduto(any(), any(), any(), any())).thenReturn(List.of());
    }

    @Test
    void gerar_DeveOrdenarCriticoAntesDeAlertaENormal_EPorGiroDentroDoGrupo() {
        when(produtoRepository.findParaRelatorioEstoque(any(), any(), any())).thenReturn(List.of(
                produto(1, "Refrigerante", 0, 5, "5.00"),
                produto(2, "Água", 3, 10, "2.00"),
                produto(3, "Chocolate", 50, 5, "4.00"),
                produto(4, "Biscoito", 0, 2, "3.00")
        ));
        when(itemVendaRepository.agregarPorProduto(any(), any(), any(), any())).thenReturn(List.of(
                vendido(1, 60), vendido(2, 30), vendido(3, 300), vendido(4, 120)
        ));

        RelatorioReposicaoResponse resposta = reposicaoEstoqueService.gerar(null, JANELA, COBERTURA);

        List<RelatorioReposicaoResponse.ItemReposicao> itens = resposta.itens();
        assertEquals(4, itens.size());

        // os dois criticos primeiro, o de maior giro na frente
        assertEquals("Biscoito", itens.get(0).nome());
        assertEquals(StatusEstoque.CRITICO, itens.get(0).status());
        assertEquals("Refrigerante", itens.get(1).nome());
        assertEquals(StatusEstoque.CRITICO, itens.get(1).status());
        assertEquals("Água", itens.get(2).nome());
        assertEquals(StatusEstoque.ALERTA, itens.get(2).status());
        assertEquals("Chocolate", itens.get(3).nome());
        assertEquals(StatusEstoque.NORMAL, itens.get(3).status());

        assertEquals(60, itens.get(0).sugestaoCompra());
        assertEquals(30, itens.get(1).sugestaoCompra());
        assertEquals(12, itens.get(2).sugestaoCompra());
        assertEquals(100, itens.get(3).sugestaoCompra());
    }

    @Test
    void gerar_DeveIgnorarProdutoNormalSemGiro() {
        when(produtoRepository.findParaRelatorioEstoque(any(), any(), any())).thenReturn(List.of(
                produto(1, "Encalhado", 100, 5, "9.90")
        ));
        semVendas();

        RelatorioReposicaoResponse resposta = reposicaoEstoqueService.gerar(null, JANELA, COBERTURA);

        assertTrue(resposta.itens().isEmpty());
        assertEquals(0, resposta.resumo().produtosParaRepor());
        assertEquals(0, resposta.resumo().unidadesSugeridas());
        assertEquals(new BigDecimal("0.00"), resposta.resumo().valorEstimadoPrecoVenda());
    }

    @Test
    void gerar_DeveReporAteOMinimo_QuandoAbaixoDoMinimoSemVenda() {
        when(produtoRepository.findParaRelatorioEstoque(any(), any(), any())).thenReturn(List.of(
                produto(1, "Parado no fundo", 2, 10, "7.00")
        ));
        semVendas();

        RelatorioReposicaoResponse resposta = reposicaoEstoqueService.gerar(null, JANELA, COBERTURA);

        RelatorioReposicaoResponse.ItemReposicao item = resposta.itens().get(0);
        assertEquals(8, item.sugestaoCompra());
        assertEquals(0, item.unidadesVendidas());
        assertEquals(new BigDecimal("0.00"), item.giroDiario());
        assertEquals(StatusEstoque.ALERTA, item.status());
        assertEquals(new BigDecimal("56.00"), item.valorEstimadoPrecoVenda());
    }

    @Test
    void gerar_PeriodoSemNenhumaVenda_DeveTrazerSoQuemEstaAbaixoDoMinimo() {
        when(produtoRepository.findParaRelatorioEstoque(any(), any(), any())).thenReturn(List.of(
                produto(1, "Zerado", 0, 5, "10.00"),
                produto(2, "Cheio", 80, 5, "10.00")
        ));
        semVendas();

        RelatorioReposicaoResponse resposta = reposicaoEstoqueService.gerar(null, JANELA, COBERTURA);

        assertEquals(1, resposta.itens().size());
        assertEquals("Zerado", resposta.itens().get(0).nome());
        assertEquals(5, resposta.itens().get(0).sugestaoCompra());
        assertEquals(StatusEstoque.CRITICO, resposta.itens().get(0).status());
        assertEquals(1, resposta.resumo().produtosParaRepor());
        assertEquals(5, resposta.resumo().unidadesSugeridas());
        assertEquals(new BigDecimal("50.00"), resposta.resumo().valorEstimadoPrecoVenda());
    }

    @Test
    void gerar_JanelaZero_DeveDevolver400() {
        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> reposicaoEstoqueService.gerar(null, 0, COBERTURA));

        assertEquals(HttpStatus.BAD_REQUEST, erro.getStatusCode());
        verifyNoInteractions(produtoRepository, itemVendaRepository);
    }

    @Test
    void gerar_JanelaNegativa_DeveDevolver400() {
        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> reposicaoEstoqueService.gerar(null, -5, COBERTURA));

        assertEquals(HttpStatus.BAD_REQUEST, erro.getStatusCode());
        verifyNoInteractions(produtoRepository, itemVendaRepository);
    }

    @Test
    void gerar_CoberturaMenorQueUmDia_DeveDevolver400() {
        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> reposicaoEstoqueService.gerar(null, JANELA, 0));

        assertEquals(HttpStatus.BAD_REQUEST, erro.getStatusCode());
        verifyNoInteractions(produtoRepository, itemVendaRepository);
    }

    @Test
    void gerar_ComCategoria_DeveRepassarOFiltroParaOsDoisRepositorios() {
        when(produtoRepository.findParaRelatorioEstoque(any(), any(), any())).thenReturn(List.of());
        semVendas();

        LocalDate hoje = LocalDate.now();
        LocalDateTime inicioEsperado = hoje.minusDays(JANELA - 1L).atStartOfDay();
        LocalDateTime fimEsperado = hoje.atTime(LocalTime.MAX);

        reposicaoEstoqueService.gerar(7L, JANELA, COBERTURA);

        verify(produtoRepository).findParaRelatorioEstoque(eq(7L), isNull(), any(Sort.class));
        // data com eq e nao any: null aqui estoura 500 no Postgres e o any() deixaria passar
        verify(itemVendaRepository).agregarPorProduto(
                eq(inicioEsperado), eq(fimEsperado), isNull(), eq(7L));
    }

    @Test
    void gerar_CategoriaSemNenhumProduto_DeveDevolverRelatorioVazio() {
        when(produtoRepository.findParaRelatorioEstoque(any(), any(), any())).thenReturn(List.of());
        semVendas();

        RelatorioReposicaoResponse resposta = reposicaoEstoqueService.gerar(7L, JANELA, COBERTURA);

        assertTrue(resposta.itens().isEmpty());
        assertEquals(0, resposta.resumo().produtosParaRepor());
        assertEquals(new BigDecimal("0.00"), resposta.resumo().valorEstimadoPrecoVenda());
    }

    @Test
    void gerar_SemNenhumProdutoCadastrado_DeveDevolverRelatorioVazio() {
        when(produtoRepository.findParaRelatorioEstoque(any(), any(), any())).thenReturn(List.of());
        semVendas();

        RelatorioReposicaoResponse resposta = reposicaoEstoqueService.gerar(null, JANELA, COBERTURA);

        assertTrue(resposta.itens().isEmpty());
        assertEquals(0, resposta.resumo().produtosParaRepor());
        assertEquals(0, resposta.resumo().unidadesSugeridas());
    }

    @Test
    void gerar_EstoqueZeradoComMinimoZero_DeveSugerirPeloMenosUmaUnidade() {
        when(produtoRepository.findParaRelatorioEstoque(any(), any(), any())).thenReturn(List.of(
                produto(1, "Esquecido", 0, 0, "3.00")
        ));
        semVendas();

        RelatorioReposicaoResponse resposta = reposicaoEstoqueService.gerar(null, JANELA, COBERTURA);

        assertEquals(1, resposta.itens().size());
        RelatorioReposicaoResponse.ItemReposicao item = resposta.itens().get(0);
        assertEquals("Esquecido", item.nome());
        assertEquals(1, item.sugestaoCompra());
        // a tela de estoque marca CRITICO, o relatorio nao pode fingir que o produto nao existe
        assertEquals(StatusEstoque.CRITICO, item.status());
        assertEquals(new BigDecimal("3.00"), item.valorEstimadoPrecoVenda());
    }

    @Test
    void gerar_ProdutoExatamenteNoMinimoSemVenda_NaoEntraNaLista() {
        when(produtoRepository.findParaRelatorioEstoque(any(), any(), any())).thenReturn(List.of(
                produto(1, "No limite", 10, 10, "4.00")
        ));
        semVendas();

        RelatorioReposicaoResponse resposta = reposicaoEstoqueService.gerar(null, JANELA, COBERTURA);

        // decisao do time: o minimo e o ponto de alerta, nao o de ruptura, entao ainda nao ha o que comprar
        assertTrue(resposta.itens().isEmpty());
    }

    @Test
    void gerar_JanelaAcimaDoTeto_DeveDevolver400() {
        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> reposicaoEstoqueService.gerar(null, 366, COBERTURA));

        assertEquals(HttpStatus.BAD_REQUEST, erro.getStatusCode());
        verifyNoInteractions(produtoRepository, itemVendaRepository);
    }

    @Test
    void gerar_CoberturaAcimaDoTeto_DeveDevolver400() {
        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> reposicaoEstoqueService.gerar(null, JANELA, 366));

        assertEquals(HttpStatus.BAD_REQUEST, erro.getStatusCode());
        verifyNoInteractions(produtoRepository, itemVendaRepository);
    }

    @Test
    void gerar_DeveArredondarSugestaoParaCima() {
        when(produtoRepository.findParaRelatorioEstoque(any(), any(), any())).thenReturn(List.of(
                produto(1, "Quebrado", 0, 0, "2.00"),
                produto(2, "Redondo", 0, 0, "2.00")
        ));
        when(itemVendaRepository.agregarPorProduto(any(), any(), any(), any())).thenReturn(List.of(
                vendido(1, 7), vendido(2, 10)
        ));

        RelatorioReposicaoResponse resposta = reposicaoEstoqueService.gerar(null, JANELA, COBERTURA);

        // 7 em 30 dias dá 3,5 pra cobrir 15 dias: vira 4, não 3
        RelatorioReposicaoResponse.ItemReposicao quebrado = resposta.itens().stream()
                .filter(i -> i.nome().equals("Quebrado")).findFirst().orElseThrow();
        assertEquals(4, quebrado.sugestaoCompra());
        assertEquals(new BigDecimal("0.23"), quebrado.giroDiario());

        // conta exata não pode ganhar unidade a mais por causa do arredondamento
        RelatorioReposicaoResponse.ItemReposicao redondo = resposta.itens().stream()
                .filter(i -> i.nome().equals("Redondo")).findFirst().orElseThrow();
        assertEquals(5, redondo.sugestaoCompra());
    }

    @Test
    void gerar_DeveSomarResumoEDevolverAJanelaUsada() {
        when(produtoRepository.findParaRelatorioEstoque(any(), any(), any())).thenReturn(List.of(
                produto(1, "Refrigerante", 0, 5, "5.00"),
                produto(2, "Água", 3, 10, "2.00")
        ));
        when(itemVendaRepository.agregarPorProduto(any(), any(), any(), any())).thenReturn(List.of(
                vendido(1, 60), vendido(2, 30)
        ));

        RelatorioReposicaoResponse resposta = reposicaoEstoqueService.gerar(null, JANELA, COBERTURA);

        RelatorioReposicaoResponse.Resumo resumo = resposta.resumo();
        assertEquals(2, resumo.produtosParaRepor());
        assertEquals(42, resumo.unidadesSugeridas());
        // 30 x 5,00 mais 12 x 2,00
        assertEquals(new BigDecimal("174.00"), resumo.valorEstimadoPrecoVenda());
        assertEquals(JANELA, resumo.janelaDias());
        assertEquals(COBERTURA, resumo.coberturaDias());
        assertEquals(JANELA - 1, ChronoUnit.DAYS.between(resumo.dataInicio(), resumo.dataFim()));
    }

    @Test
    void gerar_ProdutoSemVendaNoPeriodo_DeveUsarZeroEmVezDeQuebrar() {
        when(produtoRepository.findParaRelatorioEstoque(any(), any(), any())).thenReturn(List.of(
                produto(1, "Vendido", 0, 1, "1.00"),
                produto(2, "Sem giro", 0, 4, "1.00")
        ));
        when(itemVendaRepository.agregarPorProduto(any(), any(), any(), any())).thenReturn(List.of(
                vendido(1, 30)
        ));

        RelatorioReposicaoResponse resposta = reposicaoEstoqueService.gerar(null, JANELA, COBERTURA);

        assertEquals(2, resposta.itens().size());
        assertEquals("Vendido", resposta.itens().get(0).nome());
        assertEquals(15, resposta.itens().get(0).sugestaoCompra());
        assertEquals("Sem giro", resposta.itens().get(1).nome());
        assertEquals(4, resposta.itens().get(1).sugestaoCompra());
    }
}
