package com.sigecom.service;

import com.sigecom.domain.CategoriaFinanceira;
import com.sigecom.domain.LancamentoFinanceiro;
import com.sigecom.domain.Usuario;
import com.sigecom.domain.enums.DescricaoLancamento;
import com.sigecom.domain.enums.TipoLancamento;
import com.sigecom.domain.enums.TipoUsuario;
import com.sigecom.model.request.lancamento.LancamentoRequest;
import com.sigecom.model.response.lancamento.LancamentoResponse;
import com.sigecom.repository.CategoriaFinanceiraRepository;
import com.sigecom.repository.LancamentoFinanceiroRepository;
import com.sigecom.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LancamentoServiceTest {

    @Mock
    private LancamentoFinanceiroRepository lancamentoFinanceiroRepository;

    @Mock
    private CategoriaFinanceiraRepository categoriaFinanceiraRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private LancamentoService lancamentoService;

    private Usuario admin;
    private CategoriaFinanceira categoriaReceita;

    @BeforeEach
    void setUp() {
        admin = Usuario.builder()
                .id(1L)
                .nome("Admin")
                .email("admin@sigecom.com")
                .senhaHash("hash")
                .perfil(TipoUsuario.ADMIN)
                .build();

        categoriaReceita = new CategoriaFinanceira();
        categoriaReceita.setId(10L);
        categoriaReceita.setNome("Vendas");
        categoriaReceita.setTipo(TipoLancamento.RECEITA);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(admin.getEmail(), null, List.of())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private LancamentoRequest receitaRequest() {
        return new LancamentoRequest(
                new BigDecimal("150.00"),
                LocalDate.now(),
                categoriaReceita.getId(),
                DescricaoLancamento.VENDA,
                TipoLancamento.RECEITA
        );
    }

    @Test
    void registrar_DevePersistirReceita_QuandoDadosCoerentes() {
        when(usuarioRepository.findByEmail("admin@sigecom.com")).thenReturn(Optional.of(admin));
        when(categoriaFinanceiraRepository.findById(10L)).thenReturn(Optional.of(categoriaReceita));
        when(lancamentoFinanceiroRepository.save(any(LancamentoFinanceiro.class))).thenAnswer(inv -> {
            LancamentoFinanceiro l = inv.getArgument(0);
            l.setId(99L);
            return l;
        });

        LancamentoResponse response = lancamentoService.registrar(receitaRequest());

        assertEquals(99L, response.id());
        assertEquals(new BigDecimal("150.00"), response.valor());
        assertEquals(TipoLancamento.RECEITA, response.tipo());
        assertEquals(DescricaoLancamento.VENDA, response.descricao());
        assertEquals(10L, response.categoria().id());
        assertNotNull(response.dataHora());
        verify(lancamentoFinanceiroRepository).save(any(LancamentoFinanceiro.class));
    }

    @Test
    void registrar_DeveVincularUsuarioAutenticado() {
        when(usuarioRepository.findByEmail("admin@sigecom.com")).thenReturn(Optional.of(admin));
        when(categoriaFinanceiraRepository.findById(10L)).thenReturn(Optional.of(categoriaReceita));
        when(lancamentoFinanceiroRepository.save(any(LancamentoFinanceiro.class))).thenAnswer(inv -> inv.getArgument(0));

        lancamentoService.registrar(receitaRequest());

        verify(lancamentoFinanceiroRepository).save(argThat(l -> l.getUsuario() == admin));
    }

    @Test
    void registrar_DeveLancarNotFound_QuandoCategoriaNaoExistir() {
        when(usuarioRepository.findByEmail("admin@sigecom.com")).thenReturn(Optional.of(admin));
        when(categoriaFinanceiraRepository.findById(10L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> lancamentoService.registrar(receitaRequest()));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        verify(lancamentoFinanceiroRepository, never()).save(any());
    }

    @Test
    void registrar_DeveLancarBadRequest_QuandoCategoriaForDeOutroTipo() {
        categoriaReceita.setTipo(TipoLancamento.DESPESA);
        when(usuarioRepository.findByEmail("admin@sigecom.com")).thenReturn(Optional.of(admin));
        when(categoriaFinanceiraRepository.findById(10L)).thenReturn(Optional.of(categoriaReceita));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> lancamentoService.registrar(receitaRequest()));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("A categoria informada não pertence ao tipo do lançamento", ex.getReason());
        verify(lancamentoFinanceiroRepository, never()).save(any());
    }

    @Test
    void registrar_DeveLancarBadRequest_QuandoDescricaoForDeOutroTipo() {
        when(usuarioRepository.findByEmail("admin@sigecom.com")).thenReturn(Optional.of(admin));
        when(categoriaFinanceiraRepository.findById(10L)).thenReturn(Optional.of(categoriaReceita));

        LancamentoRequest request = new LancamentoRequest(
                new BigDecimal("150.00"),
                LocalDate.now(),
                categoriaReceita.getId(),
                DescricaoLancamento.ALUGUEL,
                TipoLancamento.RECEITA
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> lancamentoService.registrar(request));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("A descrição informada não pertence ao tipo do lançamento", ex.getReason());
        verify(lancamentoFinanceiroRepository, never()).save(any());
    }

    @Test
    void registrar_DeveUsarInicioDoDia_QuandoDataForRetroativa() {
        LocalDate ontem = LocalDate.now().minusDays(1);
        when(usuarioRepository.findByEmail("admin@sigecom.com")).thenReturn(Optional.of(admin));
        when(categoriaFinanceiraRepository.findById(10L)).thenReturn(Optional.of(categoriaReceita));
        when(lancamentoFinanceiroRepository.save(any(LancamentoFinanceiro.class))).thenAnswer(inv -> inv.getArgument(0));

        LancamentoRequest request = new LancamentoRequest(
                new BigDecimal("150.00"), ontem, 10L, DescricaoLancamento.VENDA, TipoLancamento.RECEITA);

        lancamentoService.registrar(request);

        verify(lancamentoFinanceiroRepository).save(argThat(
                l -> l.getDataHora().equals(ontem.atStartOfDay())));
    }

    @Test
    void registrar_DeveLancarUnauthorized_QuandoUsuarioNaoEncontrado() {
        when(usuarioRepository.findByEmail("admin@sigecom.com")).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> lancamentoService.registrar(receitaRequest()));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        verify(lancamentoFinanceiroRepository, never()).save(any());
    }
}
