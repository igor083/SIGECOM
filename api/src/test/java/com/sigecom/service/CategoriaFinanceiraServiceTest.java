package com.sigecom.service;

import com.sigecom.domain.CategoriaFinanceira;
import com.sigecom.domain.enums.TipoLancamento;
import com.sigecom.model.request.lancamento.CadastroCategoriaFinanceiraRequest;
import com.sigecom.model.request.lancamento.EditCategoriaFinanceiraRequest;
import com.sigecom.model.response.lancamento.CategoriaFinanceiraResponse;
import com.sigecom.repository.CategoriaFinanceiraRepository;
import com.sigecom.repository.LancamentoFinanceiroRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoriaFinanceiraServiceTest {

    @Mock
    private CategoriaFinanceiraRepository categoriaFinanceiraRepository;

    @Mock
    private LancamentoFinanceiroRepository lancamentoFinanceiroRepository;

    @InjectMocks
    private CategoriaFinanceiraService categoriaFinanceiraService;

    private CategoriaFinanceira categoria;

    @BeforeEach
    void setUp() {
        categoria = new CategoriaFinanceira();
        categoria.setId(1L);
        categoria.setNome("Vendas");
        categoria.setTipo(TipoLancamento.RECEITA);
    }

    @Test
    void cadastrar_DeveCriarCategoria_QuandoNomeUnicoNoTipo() {
        CadastroCategoriaFinanceiraRequest request =
                new CadastroCategoriaFinanceiraRequest("  Vendas  ", TipoLancamento.RECEITA);
        when(categoriaFinanceiraRepository.existsByNomeIgnoreCaseAndTipo("Vendas", TipoLancamento.RECEITA))
                .thenReturn(false);
        when(categoriaFinanceiraRepository.save(any(CategoriaFinanceira.class))).thenAnswer(inv -> {
            CategoriaFinanceira c = inv.getArgument(0);
            c.setId(5L);
            return c;
        });

        CategoriaFinanceiraResponse response = categoriaFinanceiraService.cadastrar(request);

        assertEquals(5L, response.id());
        assertEquals("Vendas", response.nome());
        assertEquals(TipoLancamento.RECEITA, response.tipo());
    }

    @Test
    void cadastrar_DeveLancarConflito_QuandoNomeJaExistirNoTipo() {
        CadastroCategoriaFinanceiraRequest request =
                new CadastroCategoriaFinanceiraRequest("Vendas", TipoLancamento.RECEITA);
        when(categoriaFinanceiraRepository.existsByNomeIgnoreCaseAndTipo("Vendas", TipoLancamento.RECEITA))
                .thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> categoriaFinanceiraService.cadastrar(request));

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(categoriaFinanceiraRepository, never()).save(any());
    }

    @Test
    void listar_SemTipo_DeveRetornarTodas() {
        when(categoriaFinanceiraRepository.findAll()).thenReturn(List.of(categoria));

        List<CategoriaFinanceiraResponse> resultado = categoriaFinanceiraService.listar(null);

        assertEquals(1, resultado.size());
        verify(categoriaFinanceiraRepository).findAll();
        verify(categoriaFinanceiraRepository, never()).findByTipo(any());
    }

    @Test
    void listar_ComTipo_DeveFiltrarPorTipo() {
        when(categoriaFinanceiraRepository.findByTipo(TipoLancamento.RECEITA)).thenReturn(List.of(categoria));

        List<CategoriaFinanceiraResponse> resultado = categoriaFinanceiraService.listar(TipoLancamento.RECEITA);

        assertEquals(1, resultado.size());
        assertEquals(TipoLancamento.RECEITA, resultado.get(0).tipo());
        verify(categoriaFinanceiraRepository).findByTipo(TipoLancamento.RECEITA);
        verify(categoriaFinanceiraRepository, never()).findAll();
    }

    @Test
    void buscarPorId_DeveLancarNotFound_QuandoNaoExistir() {
        when(categoriaFinanceiraRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> categoriaFinanceiraService.buscarPorId(99L));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void editar_DeveAtualizarNome_QuandoDisponivel() {
        EditCategoriaFinanceiraRequest request = new EditCategoriaFinanceiraRequest("Recebimentos");
        when(categoriaFinanceiraRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(categoriaFinanceiraRepository.existsByNomeIgnoreCaseAndTipo("Recebimentos", TipoLancamento.RECEITA))
                .thenReturn(false);
        when(categoriaFinanceiraRepository.save(any(CategoriaFinanceira.class))).thenAnswer(inv -> inv.getArgument(0));

        CategoriaFinanceiraResponse response = categoriaFinanceiraService.editar(1L, request);

        assertEquals("Recebimentos", response.nome());
    }

    @Test
    void editar_NaoDeveValidarDuplicidade_QuandoNomeNaoMudou() {
        EditCategoriaFinanceiraRequest request = new EditCategoriaFinanceiraRequest("vendas");
        when(categoriaFinanceiraRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(categoriaFinanceiraRepository.save(any(CategoriaFinanceira.class))).thenAnswer(inv -> inv.getArgument(0));

        categoriaFinanceiraService.editar(1L, request);

        verify(categoriaFinanceiraRepository, never()).existsByNomeIgnoreCaseAndTipo(any(), any());
    }

    @Test
    void remover_DeveRemover_QuandoSemLancamentos() {
        when(categoriaFinanceiraRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(lancamentoFinanceiroRepository.existsByCategoriaId(1L)).thenReturn(false);

        assertDoesNotThrow(() -> categoriaFinanceiraService.remover(1L));
        verify(categoriaFinanceiraRepository).delete(categoria);
    }

    @Test
    void remover_DeveLancarConflito_QuandoExistiremLancamentos() {
        when(categoriaFinanceiraRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(lancamentoFinanceiroRepository.existsByCategoriaId(1L)).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> categoriaFinanceiraService.remover(1L));

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(categoriaFinanceiraRepository, never()).delete(any(CategoriaFinanceira.class));
    }

    @Test
    void remover_DeveLancarNotFound_QuandoNaoExistir() {
        when(categoriaFinanceiraRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> categoriaFinanceiraService.remover(99L));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        verify(lancamentoFinanceiroRepository, never()).existsByCategoriaId(eq(99L));
    }
}
