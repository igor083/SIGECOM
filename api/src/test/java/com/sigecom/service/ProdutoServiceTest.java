package com.sigecom.service;

import com.sigecom.domain.CategoriaProduto;
import com.sigecom.domain.Produto;
import com.sigecom.model.request.produto.CadastroProdutoRequest;
import com.sigecom.model.response.produto.ProdutoResponse;
import com.sigecom.repository.CategoriaProdutoRepository;
import com.sigecom.repository.ProdutoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProdutoServiceTest {

    @Mock
    private ProdutoRepository produtoRepository;

    @Mock
    private CategoriaProdutoRepository categoriaProdutoRepository;

    @InjectMocks
    private ProdutoService produtoService;

    private CategoriaProduto categoria;

    @BeforeEach
    void setUp() {
        categoria = new CategoriaProduto();
        categoria.setId(1L);
        categoria.setNome("Bebidas");
    }

    @Test
    void cadastrar_DeveCadastrarProduto_QuandoTodosOsCamposInformados() {
        CadastroProdutoRequest request = new CadastroProdutoRequest(
                "Refrigerante 2L",
                "Garrafa pet 2 litros",
                BigDecimal.valueOf(9.90),
                1L,
                15
        );
        when(categoriaProdutoRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(produtoRepository.save(any(Produto.class))).thenAnswer(inv -> {
            Produto p = inv.getArgument(0);
            p.setId(10L);
            return p;
        });

        ProdutoResponse response = produtoService.cadastrar(request);

        assertNotNull(response);
        assertEquals(10L, response.id());
        assertEquals("Refrigerante 2L", response.nome());
        assertEquals("Garrafa pet 2 litros", response.descricao());
        assertEquals(BigDecimal.valueOf(9.90), response.preco());
        assertEquals(1L, response.categoria().id());
        assertEquals("Bebidas", response.categoria().nome());
        assertEquals(15, response.qtdEstoque());
        assertTrue(response.ativo());
        verify(produtoRepository).save(any(Produto.class));
    }

    @Test
    void cadastrar_DeveAplicarDefaults_QuandoPrecoEQuantidadeOmitidos() {
        CadastroProdutoRequest request = new CadastroProdutoRequest(
                "Salgadinho",
                null,
                null,
                1L,
                null
        );
        when(categoriaProdutoRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(produtoRepository.save(any(Produto.class))).thenAnswer(inv -> inv.getArgument(0));

        ProdutoResponse response = produtoService.cadastrar(request);

        assertEquals(BigDecimal.ZERO, response.preco());
        assertEquals(0, response.qtdEstoque());
        assertNull(response.descricao());
    }

    @Test
    void cadastrar_DeveLancarNotFound_QuandoCategoriaInexistente() {
        CadastroProdutoRequest request = new CadastroProdutoRequest(
                "Produto",
                null,
                null,
                99L,
                null
        );
        when(categoriaProdutoRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> produtoService.cadastrar(request));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertEquals("Categoria não encontrada", exception.getReason());
        verify(produtoRepository, never()).save(any(Produto.class));
    }

    @Test
    void listar_DeveRetornarProdutosMapeados() {
        Produto produto = Produto.builder()
                .id(1L)
                .categoria(categoria)
                .nome("Produto A")
                .preco(BigDecimal.valueOf(5))
                .qtdEstoque(3)
                .ativo(true)
                .build();
        Pageable pageable = PageRequest.of(0, 10);
        Page<Produto> pagina = new PageImpl<>(List.of(produto), pageable, 1);
        when(produtoRepository.findAllFiltrado(null, null, pageable)).thenReturn(pagina);

        Page<ProdutoResponse> resultado = produtoService.listar(null, null, pageable);

        assertEquals(1, resultado.getContent().size());
        assertEquals("Produto A", resultado.getContent().get(0).nome());
        assertEquals(1L, resultado.getContent().get(0).categoria().id());
    }
}
