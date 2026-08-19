package com.sigecom.controller;

import com.sigecom.domain.enums.PeriodoRelatorio;
import com.sigecom.model.response.relatorio.RelatorioFinanceiroResponse;
import com.sigecom.model.response.relatorio.RelatorioReposicaoResponse;
import com.sigecom.model.response.relatorio.RelatorioVendasResponse;
import com.sigecom.service.RelatorioEstoqueService;
import com.sigecom.service.RelatorioFinanceiroService;
import com.sigecom.service.RelatorioMovimentacaoService;
import com.sigecom.service.RelatorioVendasService;
import com.sigecom.service.ReposicaoEstoqueService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Relatórios gerenciais são visão de gestão: só ADMIN. Espelha LancamentoAutorizacaoTest —
// sem estes testes, apagar o @PreAuthorize passaria despercebido no build.
@SpringBootTest
@AutoConfigureMockMvc
class RelatorioAutorizacaoTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RelatorioVendasService relatorioVendasService;

    @MockitoBean
    private RelatorioFinanceiroService relatorioFinanceiroService;

    @MockitoBean
    private ReposicaoEstoqueService reposicaoEstoqueService;

    @MockitoBean
    private RelatorioEstoqueService relatorioEstoqueService;

    @MockitoBean
    private RelatorioMovimentacaoService relatorioMovimentacaoService;

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void vendas_DeveDevolver403_QuandoUsuarioForFuncionario() throws Exception {
        mockMvc.perform(get("/relatorios/vendas"))
                .andExpect(status().isForbidden());

        verify(relatorioVendasService, never()).gerar(any(), any(), any(), any());
    }

    @Test
    void vendas_DeveDevolver401_QuandoNaoHouverUsuario() throws Exception {
        mockMvc.perform(get("/relatorios/vendas"))
                .andExpect(status().isUnauthorized());

        verify(relatorioVendasService, never()).gerar(any(), any(), any(), any());
    }

    // Contra-exemplo: sem ele os testes acima passariam até com a rota quebrada.
    @Test
    @WithMockUser(roles = "ADMIN")
    void vendas_DeveDevolver200ComResumo_QuandoUsuarioForAdmin() throws Exception {
        when(relatorioVendasService.gerar(any(), any(), any(), any())).thenReturn(
                new RelatorioVendasResponse(
                        new BigDecimal("1000.00"),
                        4,
                        new BigDecimal("250.00"),
                        LocalDate.of(2026, 8, 1),
                        LocalDate.of(2026, 8, 31),
                        null,
                        List.of(),
                        List.of()));

        mockMvc.perform(get("/relatorios/vendas").param("periodo", PeriodoRelatorio.MES.name()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalVendas").value(1000.00))
                .andExpect(jsonPath("$.quantidadeTransacoes").value(4))
                .andExpect(jsonPath("$.ticketMedio").value(250.00));
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void financeiro_DeveDevolver403_QuandoUsuarioForFuncionario() throws Exception {
        mockMvc.perform(get("/relatorios/financeiro"))
                .andExpect(status().isForbidden());

        verify(relatorioFinanceiroService, never()).gerar(any(), any(), any(), any());
    }

    @Test
    void financeiro_DeveDevolver401_QuandoNaoHouverUsuario() throws Exception {
        mockMvc.perform(get("/relatorios/financeiro"))
                .andExpect(status().isUnauthorized());

        verify(relatorioFinanceiroService, never()).gerar(any(), any(), any(), any());
    }

    // contra-exemplo: sem ele os dois acima passariam ate com a rota quebrada
    @Test
    @WithMockUser(roles = "ADMIN")
    void financeiro_DeveDevolver200_QuandoUsuarioForAdmin() throws Exception {
        when(relatorioFinanceiroService.gerar(any(), any(), any(), any())).thenReturn(
                new RelatorioFinanceiroResponse(
                        new BigDecimal("3000.00"),
                        new BigDecimal("1850.00"),
                        new BigDecimal("1150.00"),
                        LocalDate.of(2026, 8, 1),
                        LocalDate.of(2026, 8, 31),
                        List.of()));

        mockMvc.perform(get("/relatorios/financeiro").param("periodo", PeriodoRelatorio.MES.name()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saldo").value(1150.00))
                .andExpect(jsonPath("$.totalReceitas").value(3000.00))
                .andExpect(jsonPath("$.totalDespesas").value(1850.00));
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void estoque_DeveDevolver403_QuandoUsuarioForFuncionario() throws Exception {
        mockMvc.perform(get("/relatorios/estoque"))
                .andExpect(status().isForbidden());

        verify(relatorioEstoqueService, never()).gerar(any(), any(), any());
    }

    @Test
    void estoque_DeveDevolver401_QuandoNaoHouverUsuario() throws Exception {
        mockMvc.perform(get("/relatorios/estoque"))
                .andExpect(status().isUnauthorized());

        verify(relatorioEstoqueService, never()).gerar(any(), any(), any());
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void movimentacoes_DeveDevolver403_QuandoUsuarioForFuncionario() throws Exception {
        mockMvc.perform(get("/relatorios/estoque/movimentacoes"))
                .andExpect(status().isForbidden());

        verify(relatorioMovimentacaoService, never()).gerar(any(), any(), any(), any(), any());
    }

    @Test
    void movimentacoes_DeveDevolver401_QuandoNaoHouverUsuario() throws Exception {
        mockMvc.perform(get("/relatorios/estoque/movimentacoes"))
                .andExpect(status().isUnauthorized());

        verify(relatorioMovimentacaoService, never()).gerar(any(), any(), any(), any(), any());
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void reposicao_DeveDevolver403_QuandoUsuarioForFuncionario() throws Exception {
        mockMvc.perform(get("/relatorios/estoque/reposicao"))
                .andExpect(status().isForbidden());

        verify(reposicaoEstoqueService, never()).gerar(any(), anyInt(), anyInt());
    }

    @Test
    void reposicao_DeveDevolver401_QuandoNaoHouverUsuario() throws Exception {
        mockMvc.perform(get("/relatorios/estoque/reposicao"))
                .andExpect(status().isUnauthorized());

        verify(reposicaoEstoqueService, never()).gerar(any(), anyInt(), anyInt());
    }

    // contra-exemplo: sem ele os dois acima passariam ate com a rota quebrada
    @Test
    @WithMockUser(roles = "ADMIN")
    void reposicao_DeveDevolver200ComResumo_QuandoUsuarioForAdmin() throws Exception {
        when(reposicaoEstoqueService.gerar(any(), anyInt(), anyInt())).thenReturn(
                new RelatorioReposicaoResponse(
                        new RelatorioReposicaoResponse.Resumo(
                                2, 42, new BigDecimal("174.00"), 30, 15,
                                LocalDate.of(2026, 7, 20), LocalDate.of(2026, 8, 18)),
                        List.of()));

        mockMvc.perform(get("/relatorios/estoque/reposicao"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumo.produtosParaRepor").value(2))
                .andExpect(jsonPath("$.resumo.unidadesSugeridas").value(42))
                .andExpect(jsonPath("$.resumo.valorEstimadoPrecoVenda").value(174.00));
    }
}
