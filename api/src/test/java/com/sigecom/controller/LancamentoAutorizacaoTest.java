package com.sigecom.controller;

import com.sigecom.model.response.lancamento.SaldoResponse;
import com.sigecom.service.LancamentoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// SCRUM-133 e SCRUM-135 - D-2: so ADMIN mexe no financeiro.
// O @PreAuthorize estava nos controllers desde o inicio mas nenhum teste
// provava que ele barra de verdade. Se alguem apagar a anotacao sem querer,
// o build continuava verde. Agora nao.
@SpringBootTest
@AutoConfigureMockMvc
class LancamentoAutorizacaoTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LancamentoService lancamentoService;

    private static final String CORPO = """
            {"valor":100.00,"data":"2026-07-26","categoriaId":1,
             "descricao":"Conta de luz","tipo":"DESPESA"}
            """;

    // registrar despesa, SCRUM-133

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void registrar_DeveDevolver403_QuandoUsuarioForFuncionario() throws Exception {
        mockMvc.perform(post("/lancamentos")
                        .contentType("application/json")
                        .content(CORPO))
                .andExpect(status().isForbidden());

        // o pedido nao pode nem chegar no service
        verify(lancamentoService, never()).registrar(any());
    }

    @Test
    void registrar_DeveDevolver401_QuandoNaoHouverUsuario() throws Exception {
        mockMvc.perform(post("/lancamentos")
                        .contentType("application/json")
                        .content(CORPO))
                .andExpect(status().isUnauthorized());

        verify(lancamentoService, never()).registrar(any());
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void listar_DeveDevolver403_QuandoUsuarioForFuncionario() throws Exception {
        mockMvc.perform(get("/lancamentos"))
                .andExpect(status().isForbidden());
    }

    // saldo operacional, SCRUM-135

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void saldo_DeveDevolver403_QuandoUsuarioForFuncionario() throws Exception {
        mockMvc.perform(get("/lancamentos/saldo"))
                .andExpect(status().isForbidden());

        verify(lancamentoService, never()).calcularSaldo(any(), any());
    }

    @Test
    void saldo_DeveDevolver401_QuandoNaoHouverUsuario() throws Exception {
        mockMvc.perform(get("/lancamentos/saldo"))
                .andExpect(status().isUnauthorized());

        verify(lancamentoService, never()).calcularSaldo(any(), any());
    }

    // o contra-exemplo: sem ele os testes acima passariam ate com a rota quebrada
    @Test
    @WithMockUser(roles = "ADMIN")
    void saldo_DeveDevolver200_QuandoUsuarioForAdmin() throws Exception {
        when(lancamentoService.calcularSaldo(any(), any())).thenReturn(
                new SaldoResponse(
                        new BigDecimal("900.00"),
                        new BigDecimal("350.50"),
                        new BigDecimal("549.50"),
                        LocalDate.of(2026, 7, 1),
                        LocalDate.of(2026, 7, 26)));

        mockMvc.perform(get("/lancamentos/saldo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saldo").value(549.50));
    }
}
