package com.sigecom.service;

import com.sigecom.domain.CategoriaProduto;
import com.sigecom.domain.Produto;
import com.sigecom.domain.enums.StatusEstoque;
import com.sigecom.model.response.relatorio.RelatorioEstoqueResponse;
import com.sigecom.repository.ProdutoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RelatorioEstoqueServiceTest {

    @Mock
    private ProdutoRepository produtoRepository;

    @InjectMocks
    private RelatorioEstoqueService relatorioEstoqueService;

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

    @Test
    void gerar_DeveClassificarStatusPorQuantidadeVsMinimo() {
        when(produtoRepository.findParaRelatorioEstoque(any(), any(), any())).thenReturn(List.of(
                produto(1, "Esgotado", 0, 5, "10.00"),
                produto(2, "No mínimo", 5, 5, "10.00"),
                produto(3, "Abaixo do mínimo", 3, 5, "10.00"),
                produto(4, "Saudável", 100, 5, "2.50")
        ));

        RelatorioEstoqueResponse resposta = relatorioEstoqueService.gerar(
                null, null, RelatorioEstoqueService.Ordenacao.QUANTIDADE_ASC);

        assertEquals(StatusEstoque.CRITICO, resposta.itens().get(0).status());
        assertEquals(StatusEstoque.ALERTA, resposta.itens().get(1).status());
        assertEquals(StatusEstoque.ALERTA, resposta.itens().get(2).status());
        assertEquals(StatusEstoque.NORMAL, resposta.itens().get(3).status());
    }

    @Test
    void gerar_DeveCalcularValorEmEstoqueEResumo() {
        when(produtoRepository.findParaRelatorioEstoque(any(), any(), any())).thenReturn(List.of(
                produto(1, "Esgotado", 0, 5, "10.00"),
                produto(2, "Alerta", 3, 5, "10.00"),
                produto(3, "Normal", 100, 5, "2.50")
        ));

        RelatorioEstoqueResponse resposta = relatorioEstoqueService.gerar(
                null, null, RelatorioEstoqueService.Ordenacao.QUANTIDADE_ASC);

        assertEquals(new BigDecimal("0.00"), resposta.itens().get(0).valorEmEstoque());
        assertEquals(new BigDecimal("30.00"), resposta.itens().get(1).valorEmEstoque());
        assertEquals(new BigDecimal("250.00"), resposta.itens().get(2).valorEmEstoque());

        RelatorioEstoqueResponse.Resumo resumo = resposta.resumo();
        assertEquals(3, resumo.totalProdutos());
        assertEquals(1, resumo.emAlerta());
        assertEquals(1, resumo.emCritico());
        assertEquals(new BigDecimal("280.00"), resumo.valorTotalEstoque());
    }

    @Test
    void gerar_BuscaEmBranco_DeveVirarNull() {
        when(produtoRepository.findParaRelatorioEstoque(any(), any(), any())).thenReturn(List.of());

        relatorioEstoqueService.gerar(7L, "   ", RelatorioEstoqueService.Ordenacao.QUANTIDADE_ASC);

        verify(produtoRepository).findParaRelatorioEstoque(eq(7L), isNull(), any(Sort.class));
    }

    @Test
    void gerar_Ordenacao_DeveTraduzirParaSortPorQuantidade() {
        when(produtoRepository.findParaRelatorioEstoque(any(), any(), any())).thenReturn(List.of());

        relatorioEstoqueService.gerar(null, "leite", RelatorioEstoqueService.Ordenacao.QUANTIDADE_DESC);

        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        verify(produtoRepository).findParaRelatorioEstoque(isNull(), eq("leite"), sortCaptor.capture());

        Sort.Order ordemQtd = sortCaptor.getValue().getOrderFor("qtdEstoque");
        assertNull(sortCaptor.getValue().getOrderFor("inexistente"));
        assertEquals(Sort.Direction.DESC, ordemQtd.getDirection());
    }
}
