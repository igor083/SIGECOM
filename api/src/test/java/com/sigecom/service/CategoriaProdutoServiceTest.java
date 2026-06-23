package com.sigecom.service;

import com.sigecom.domain.CategoriaProduto;
import com.sigecom.model.request.categoria.CadastroCategoriaProdutoRequest;
import com.sigecom.model.request.categoria.EditCategoriaProdutoRequest;
import com.sigecom.model.response.categoria.CategoriaProdutoResponse;
import com.sigecom.repository.CategoriaProdutoRepository;
import com.sigecom.repository.ProdutoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoriaProdutoServiceTest {

    @Mock
    private CategoriaProdutoRepository categoriaProdutoRepository;

    @Mock
    private ProdutoRepository produtoRepository;

    @InjectMocks
    private CategoriaProdutoService categoriaProdutoService;

    private CategoriaProduto categoria;

    @BeforeEach
    void setUp() {
        categoria = new CategoriaProduto();
        categoria.setId(1L);
        categoria.setNome("Bebidas");
    }

    @Test
    void cadastrar_DeveCriarCategoria_QuandoNomeUnico() {
        CadastroCategoriaProdutoRequest request = new CadastroCategoriaProdutoRequest(" Bebidas ");
        when(categoriaProdutoRepository.existsByNomeIgnoreCase("Bebidas")).thenReturn(false);
        when(categoriaProdutoRepository.save(any(CategoriaProduto.class))).thenAnswer(inv -> {
            CategoriaProduto c = inv.getArgument(0);
            c.setId(5L);
            return c;
        });

        CategoriaProdutoResponse response = categoriaProdutoService.cadastrar(request);

        assertEquals(5L, response.id());
        assertEquals("Bebidas", response.nome());
        verify(categoriaProdutoRepository).save(any(CategoriaProduto.class));
    }

    @Test
    void cadastrar_DeveLancarConflito_QuandoNomeJaExistir() {
        CadastroCategoriaProdutoRequest request = new CadastroCategoriaProdutoRequest("Bebidas");
        when(categoriaProdutoRepository.existsByNomeIgnoreCase("Bebidas")).thenReturn(true);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> categoriaProdutoService.cadastrar(request));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals("Já existe uma categoria com este nome", exception.getReason());
        verify(categoriaProdutoRepository, never()).save(any());
    }

    @Test
    void listar_DeveRetornarCategoriasMapeadas() {
        when(categoriaProdutoRepository.findAll()).thenReturn(List.of(categoria));

        List<CategoriaProdutoResponse> resultado = categoriaProdutoService.listar();

        assertEquals(1, resultado.size());
        assertEquals("Bebidas", resultado.get(0).nome());
    }

    @Test
    void buscarPorId_DeveRetornarCategoria_QuandoExistir() {
        when(categoriaProdutoRepository.findById(1L)).thenReturn(Optional.of(categoria));

        CategoriaProdutoResponse response = categoriaProdutoService.buscarPorId(1L);

        assertEquals(1L, response.id());
        assertEquals("Bebidas", response.nome());
    }

    @Test
    void buscarPorId_DeveLancarNotFound_QuandoCategoriaNaoExistir() {
        when(categoriaProdutoRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> categoriaProdutoService.buscarPorId(99L));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertEquals("Categoria não encontrada", exception.getReason());
    }

    @Test
    void editar_DeveAtualizarNome_QuandoCategoriaExisteENomeDisponivel() {
        EditCategoriaProdutoRequest request = new EditCategoriaProdutoRequest("Snacks");
        when(categoriaProdutoRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(categoriaProdutoRepository.existsByNomeIgnoreCase("Snacks")).thenReturn(false);
        when(categoriaProdutoRepository.save(any(CategoriaProduto.class))).thenAnswer(inv -> inv.getArgument(0));

        CategoriaProdutoResponse response = categoriaProdutoService.editar(1L, request);

        assertEquals("Snacks", response.nome());
        verify(categoriaProdutoRepository).save(categoria);
    }

    @Test
    void editar_NaoDeveValidarDuplicidade_QuandoNomeNaoMudou() {
        EditCategoriaProdutoRequest request = new EditCategoriaProdutoRequest("bebidas");
        when(categoriaProdutoRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(categoriaProdutoRepository.save(any(CategoriaProduto.class))).thenAnswer(inv -> inv.getArgument(0));

        CategoriaProdutoResponse response = categoriaProdutoService.editar(1L, request);

        assertEquals("bebidas", response.nome());
        verify(categoriaProdutoRepository, never()).existsByNomeIgnoreCase(any());
    }

    @Test
    void editar_DeveLancarNotFound_QuandoCategoriaNaoExistir() {
        EditCategoriaProdutoRequest request = new EditCategoriaProdutoRequest("Snacks");
        when(categoriaProdutoRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> categoriaProdutoService.editar(99L, request));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void editar_DeveLancarConflito_QuandoNovoNomeJaEstiverEmUso() {
        EditCategoriaProdutoRequest request = new EditCategoriaProdutoRequest("Snacks");
        when(categoriaProdutoRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(categoriaProdutoRepository.existsByNomeIgnoreCase("Snacks")).thenReturn(true);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> categoriaProdutoService.editar(1L, request));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verify(categoriaProdutoRepository, never()).save(any());
    }

    @Test
    void remover_DeveRemoverCategoria_QuandoSemProdutosVinculados() {
        when(categoriaProdutoRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(produtoRepository.existsByCategoriaId(1L)).thenReturn(false);

        assertDoesNotThrow(() -> categoriaProdutoService.remover(1L));
        verify(categoriaProdutoRepository).delete(categoria);
    }

    @Test
    void remover_DeveLancarConflito_QuandoExistiremProdutosVinculados() {
        when(categoriaProdutoRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(produtoRepository.existsByCategoriaId(1L)).thenReturn(true);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> categoriaProdutoService.remover(1L));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals("Não é possível remover uma categoria que possui produtos vinculados", exception.getReason());
        verify(categoriaProdutoRepository, never()).delete(any(CategoriaProduto.class));
    }

    @Test
    void remover_DeveLancarNotFound_QuandoCategoriaNaoExistir() {
        when(categoriaProdutoRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> categoriaProdutoService.remover(99L));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verify(produtoRepository, never()).existsByCategoriaId(any());
    }
}
