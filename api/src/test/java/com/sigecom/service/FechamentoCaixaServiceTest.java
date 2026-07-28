package com.sigecom.service;

import com.sigecom.domain.FechamentoCaixa;
import com.sigecom.domain.Usuario;
import com.sigecom.domain.enums.TipoLancamento;
import com.sigecom.domain.enums.TipoUsuario;
import com.sigecom.model.request.fechamento.FechamentoRequest;
import com.sigecom.model.response.fechamento.FechamentoResponse;
import com.sigecom.repository.FechamentoCaixaRepository;
import com.sigecom.repository.LancamentoFinanceiroRepository;
import com.sigecom.repository.UsuarioRepository;
import com.sigecom.repository.VendaRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
class FechamentoCaixaServiceTest {

    @Mock
    private FechamentoCaixaRepository fechamentoCaixaRepository;

    @Mock
    private VendaRepository vendaRepository;

    @Mock
    private LancamentoFinanceiroRepository lancamentoFinanceiroRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private FechamentoCaixaService fechamentoCaixaService;

    private Usuario funcionario;

    @BeforeEach
    void setUp() {
        funcionario = Usuario.builder()
                .id(1L)
                .nome("Funcionario")
                .email("func@sigecom.com")
                .senhaHash("hash")
                .perfil(TipoUsuario.FUNCIONARIO)
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(funcionario.getEmail(), null, List.of())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }


    @Test
    void calcularPreview_DeveUsarReceitasMenosDespesas_SemSomarVendas() {
        LocalDate hoje = LocalDate.now();

        // Cenario que O saldo NAO pode somar venda e receita.
        when(vendaRepository.somarTotalPorPeriodo(any(), any())).thenReturn(new BigDecimal("100.00"));
        when(lancamentoFinanceiroRepository.somarPorTipo(eq(TipoLancamento.RECEITA), any(), any()))
                .thenReturn(new BigDecimal("100.00"));
        when(lancamentoFinanceiroRepository.somarPorTipo(eq(TipoLancamento.DESPESA), any(), any()))
                .thenReturn(new BigDecimal("30.00"));

        FechamentoResponse preview = fechamentoCaixaService.calcularPreview(hoje);

        assertEquals(new BigDecimal("100.00"), preview.totalVendas());
        assertEquals(new BigDecimal("100.00"), preview.totalReceitas());
        assertEquals(new BigDecimal("30.00"), preview.totalDespesas());
        // Se somasse totalVendas de novo, daria 170.00 — o teste travaria isso.
        assertEquals(new BigDecimal("70.00"), preview.saldoCalculado());
        assertNull(preview.id());
        assertNull(preview.fechadoEm());
    }

    @Test
    void calcularPreview_DeveUsarIntervaloDoDiaInteiro() {
        LocalDate hoje = LocalDate.now();
        when(vendaRepository.somarTotalPorPeriodo(any(), any())).thenReturn(BigDecimal.ZERO);
        when(lancamentoFinanceiroRepository.somarPorTipo(any(), any(), any())).thenReturn(BigDecimal.ZERO);

        fechamentoCaixaService.calcularPreview(hoje);


        verify(vendaRepository).somarTotalPorPeriodo(
                eq(hoje.atStartOfDay()), eq(hoje.atTime(LocalTime.MAX)));
    }

   

    @Test
    void confirmar_DeveSalvarComTotaisDoPreviewEValorFisicoInformado() {
        when(fechamentoCaixaRepository.existsByDataFechamento(any())).thenReturn(false);
        when(usuarioRepository.findByEmail("func@sigecom.com")).thenReturn(Optional.of(funcionario));
        when(vendaRepository.somarTotalPorPeriodo(any(), any())).thenReturn(new BigDecimal("100.00"));
        when(lancamentoFinanceiroRepository.somarPorTipo(eq(TipoLancamento.RECEITA), any(), any()))
                .thenReturn(new BigDecimal("100.00"));
        when(lancamentoFinanceiroRepository.somarPorTipo(eq(TipoLancamento.DESPESA), any(), any()))
                .thenReturn(new BigDecimal("30.00"));
        when(fechamentoCaixaRepository.save(any(FechamentoCaixa.class))).thenAnswer(inv -> {
            FechamentoCaixa f = inv.getArgument(0);
            f.setId(5L);
            return f;
        });

        FechamentoResponse response = fechamentoCaixaService.confirmar(
                new FechamentoRequest(new BigDecimal("70.00")));

        assertEquals(5L, response.id());
        assertEquals(new BigDecimal("70.00"), response.saldoCalculado());
        assertEquals(new BigDecimal("70.00"), response.valorFisicoInformado());
        assertNotNull(response.fechadoEm());

        ArgumentCaptor<FechamentoCaixa> captor = ArgumentCaptor.forClass(FechamentoCaixa.class);
        verify(fechamentoCaixaRepository).save(captor.capture());
        assertEquals(funcionario.getId(), captor.getValue().getUsuario().getId());
        assertNotNull(captor.getValue().getFechadoEm()); // preenchido no service, entidade nao tem default
    }

    @Test
    void confirmar_DeveBloquear_QuandoJaExisteFechamentoNaData() {
        when(fechamentoCaixaRepository.existsByDataFechamento(LocalDate.now())).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> fechamentoCaixaService.confirmar(new FechamentoRequest(new BigDecimal("50.00"))));

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(fechamentoCaixaRepository, never()).save(any());
        verifyNoInteractions(vendaRepository, lancamentoFinanceiroRepository);
    }
}
