package com.sigecom.service;

import com.sigecom.domain.CategoriaProduto;
import com.sigecom.domain.Produto;
import com.sigecom.model.response.produto.ProdutoResponse;
import com.sigecom.repository.ProdutoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EstoqueServiceTest {

    @Mock
    private ProdutoRepository produtoRepository;

    @InjectMocks
    private EstoqueService estoqueService;

    private Produto produto;

    @BeforeEach
    void setUp() {
        // categoria_id é NOT NULL no schema: produto sem categoria não existe
        // no banco, e a resposta precisa dela preenchida.
        CategoriaProduto categoria = new CategoriaProduto();
        categoria.setId(1L);
        categoria.setNome("Papelaria");

        produto = Produto.builder()
                .id(1L)
                .nome("Produto Teste")
                .qtdEstoque(10)
                .categoria(categoria)
                .build();
    }

    @Test
    void ajustarEstoque_DeveAtualizarEstoque_QuandoQuantidadeValida() {
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));
        when(produtoRepository.save(any(Produto.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProdutoResponse resultado = estoqueService.ajustarEstoque(1L, 20);

        assertEquals(20, resultado.qtdEstoque());
        verify(produtoRepository).save(produto);
    }

    @Test
    void ajustarEstoque_DeveDevolverDtoComCategoriaResolvida_ENaoAEntidade() {
        // A resposta tem que sair pronta daqui: a entidade tem categoria LAZY e
        // a sessão fecha ao sair do método (open-in-view=false). Entregando a
        // entidade, o Jackson tocaria no proxy sem sessão e a rota devolveria
        // 500 em vez do produto ajustado.
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));
        when(produtoRepository.save(any(Produto.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProdutoResponse resultado = estoqueService.ajustarEstoque(1L, 20);

        assertNotNull(resultado.categoria());
        assertEquals(produto.getCategoria().getId(), resultado.categoria().id());
        assertEquals(produto.getCategoria().getNome(), resultado.categoria().nome());
    }

    @Test
    void ajustarEstoque_DeveLancarExcecao_QuandoQuantidadeNegativa() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            estoqueService.ajustarEstoque(1L, -5);
        });

        assertEquals("400 BAD_REQUEST \"Quantidade não pode ser negativa\"", exception.getMessage());
        verify(produtoRepository, never()).save(any());
    }

    @Test
    void ajustarEstoque_DeveLancarExcecao_QuandoProdutoNaoExiste() {
        when(produtoRepository.findById(2L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            estoqueService.ajustarEstoque(2L, 10);
        });

        assertEquals("404 NOT_FOUND \"Produto não encontrado\"", exception.getMessage());
        verify(produtoRepository, never()).save(any());
    }

    @Test
    void baixarEstoque_DeveDecrementarEstoque_QuandoQuantidadeValida() {
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));
        when(produtoRepository.save(any(Produto.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Produto resultado = estoqueService.baixarEstoque(1L, 4);

        assertEquals(6, resultado.getQtdEstoque());
        verify(produtoRepository).save(produto);
    }

    @Test
    void baixarEstoque_DeveLancarExcecaoENaoAlterarEstoque_QuandoEstoqueInsuficiente() {
        // D-8 — Confiabilidade: transação atômica venda<->estoque
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            estoqueService.baixarEstoque(1L, 15);
        });

        assertEquals("400 BAD_REQUEST \"Estoque insuficiente\"", exception.getMessage());
        assertEquals(10, produto.getQtdEstoque()); // Garante que o estoque não mudou (consistência)
        verify(produtoRepository, never()).save(any());
    }

    @Test
    void baixarEstoque_DeveLancarExcecao_QuandoQuantidadeNegativa() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            estoqueService.baixarEstoque(1L, -1);
        });

        assertEquals("400 BAD_REQUEST \"Quantidade de baixa deve ser maior que zero\"", exception.getMessage());
        verify(produtoRepository, never()).save(any());
    }
}
