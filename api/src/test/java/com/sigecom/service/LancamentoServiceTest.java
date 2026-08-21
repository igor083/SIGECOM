package com.sigecom.service;

import com.sigecom.domain.CategoriaFinanceira;
import com.sigecom.domain.LancamentoFinanceiro;
import com.sigecom.domain.Usuario;
import com.sigecom.domain.enums.FormaPagamentoLancamento;
import com.sigecom.domain.enums.TipoLancamento;
import com.sigecom.domain.enums.TipoUsuario;
import com.sigecom.model.request.lancamento.LancamentoRequest;
import com.sigecom.model.response.lancamento.LancamentoResponse;
import com.sigecom.model.response.lancamento.SaldoResponse;
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
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
                "Venda de mercadoria",
                TipoLancamento.RECEITA,
                FormaPagamentoLancamento.DINHEIRO
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
        assertEquals("Venda de mercadoria", response.descricao());
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
    void registrar_DeveRemoverEspacosDaDescricao() {
        when(usuarioRepository.findByEmail("admin@sigecom.com")).thenReturn(Optional.of(admin));
        when(categoriaFinanceiraRepository.findById(10L)).thenReturn(Optional.of(categoriaReceita));
        when(lancamentoFinanceiroRepository.save(any(LancamentoFinanceiro.class))).thenAnswer(inv -> inv.getArgument(0));

        LancamentoRequest request = new LancamentoRequest(
                new BigDecimal("150.00"),
                LocalDate.now(),
                categoriaReceita.getId(),
                "   Venda do balcão   ",
                TipoLancamento.RECEITA,
                FormaPagamentoLancamento.DINHEIRO
        );

        lancamentoService.registrar(request);

        verify(lancamentoFinanceiroRepository).save(argThat(
                l -> l.getDescricao().equals("Venda do balcão")));
    }

    @Test
    void registrar_DeveUsarInicioDoDia_QuandoDataForRetroativa() {
        LocalDate ontem = LocalDate.now().minusDays(1);
        when(usuarioRepository.findByEmail("admin@sigecom.com")).thenReturn(Optional.of(admin));
        when(categoriaFinanceiraRepository.findById(10L)).thenReturn(Optional.of(categoriaReceita));
        when(lancamentoFinanceiroRepository.save(any(LancamentoFinanceiro.class))).thenAnswer(inv -> inv.getArgument(0));

        LancamentoRequest request = new LancamentoRequest(
                new BigDecimal("150.00"), ontem, 10L, "Venda de mercadoria",
                TipoLancamento.RECEITA, FormaPagamentoLancamento.DINHEIRO);

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

    // calcularSaldo, SCRUM-111

    // helper: o service chama somarPorTipo uma vez pra cada tipo
    private void mockarSomas(String receitas, String despesas) {
        when(lancamentoFinanceiroRepository.somarPorTipo(eq(TipoLancamento.RECEITA), any(), any()))
                .thenReturn(receitas == null ? null : new BigDecimal(receitas));
        when(lancamentoFinanceiroRepository.somarPorTipo(eq(TipoLancamento.DESPESA), any(), any()))
                .thenReturn(despesas == null ? null : new BigDecimal(despesas));
    }

    @Test
    void calcularSaldo_DeveSerPositivo_QuandoSoHouverReceitas() {
        mockarSomas("1500.50", "0");

        SaldoResponse saldo = lancamentoService.calcularSaldo(
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31));

        assertEquals(new BigDecimal("1500.50"), saldo.totalReceitas());
        assertEquals(new BigDecimal("0"), saldo.totalDespesas());
        assertEquals(new BigDecimal("1500.50"), saldo.saldo());
    }

    @Test
    void calcularSaldo_DeveSerNegativo_QuandoSoHouverDespesas() {
        mockarSomas("0", "320.75");

        SaldoResponse saldo = lancamentoService.calcularSaldo(
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31));

        assertEquals(new BigDecimal("-320.75"), saldo.saldo());
    }

    @Test
    void calcularSaldo_DeveSerADiferenca_QuandoHouverOsDoisTipos() {
        mockarSomas("1500.50", "320.75");

        SaldoResponse saldo = lancamentoService.calcularSaldo(
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31));

        // 1500.50 - 320.75 = 1179.75, com centavos de proposito pra pegar erro de BigDecimal
        assertEquals(new BigDecimal("1179.75"), saldo.saldo());
        assertEquals(new BigDecimal("1500.50"), saldo.totalReceitas());
        assertEquals(new BigDecimal("320.75"), saldo.totalDespesas());
    }

    @Test
    void calcularSaldo_DeveSerZero_QuandoPeriodoNaoTiverLancamento() {
        // COALESCE na query devolve 0 quando nao ha linha
        mockarSomas("0", "0");

        SaldoResponse saldo = lancamentoService.calcularSaldo(
                LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31));

        assertEquals(0, saldo.saldo().compareTo(BigDecimal.ZERO));
    }

    @Test
    void calcularSaldo_NaoDeveEstourar_QuandoRepositoryDevolverNull() {
        // se alguem tirar o COALESCE da query, SUM sobre zero linha volta null.
        // este e o teste que prova a defesa do service, o de cima nao prova.
        mockarSomas(null, null);

        SaldoResponse saldo = lancamentoService.calcularSaldo(
                LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31));

        assertEquals(0, saldo.saldo().compareTo(BigDecimal.ZERO));
        assertEquals(0, saldo.totalReceitas().compareTo(BigDecimal.ZERO));
    }

    @Test
    void calcularSaldo_DeveLancarBadRequest_QuandoInicioForDepoisDoFim() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> lancamentoService.calcularSaldo(
                        LocalDate.of(2026, 7, 31), LocalDate.of(2026, 7, 1)));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verify(lancamentoFinanceiroRepository, never()).somarPorTipo(any(), any(), any());
    }

    @Test
    void calcularSaldo_DeveUsarMesCorrente_QuandoDatasForemNulas() {
        mockarSomas("100.00", "40.00");

        SaldoResponse saldo = lancamentoService.calcularSaldo(null, null);

        LocalDate hoje = LocalDate.now();
        assertEquals(hoje.withDayOfMonth(1), saldo.dataInicio());
        assertEquals(hoje, saldo.dataFim());
        assertEquals(new BigDecimal("60.00"), saldo.saldo());
    }

    @Test
    void calcularSaldo_DeveIncluirOFimDoDia_QuandoConverterOPeriodo() {
        // com atStartOfDay no fim, lancamento da tarde ficaria de fora do proprio dia
        mockarSomas("10.00", "0");
        LocalDate dia = LocalDate.of(2026, 7, 26);

        lancamentoService.calcularSaldo(dia, dia);

        verify(lancamentoFinanceiroRepository).somarPorTipo(
                eq(TipoLancamento.RECEITA),
                eq(dia.atStartOfDay()),
                eq(dia.atTime(LocalTime.MAX)));
    }
}
