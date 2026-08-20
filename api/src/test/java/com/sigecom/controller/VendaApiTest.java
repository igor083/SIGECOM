package com.sigecom.controller;

import com.sigecom.domain.enums.TipoPagamento;
import com.sigecom.model.request.venda.VendaRequest;
import com.sigecom.model.response.venda.CalculoVendaResponse;
import com.sigecom.model.response.venda.ItemVendaResponse;
import com.sigecom.model.response.venda.VendaResponse;
import com.sigecom.model.response.venda.VendaResumoResponse;
import com.sigecom.service.VendaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Contrato HTTP do PDV. Diferente do financeiro, aqui FUNCIONARIO PODE vender:
// o caixa da loja nao e admin. Entao o teste de autorizacao prova o acesso, nao o 403.
@SpringBootTest
@AutoConfigureMockMvc
class VendaApiTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private VendaService vendaService;

    private static final String VENDA_VALIDA = """
            {"itens":[{"produtoId":1,"quantidade":2}],"tipoPagamento":"DINHEIRO"}
            """;

    private static final String CARRINHO_VALIDO = """
            {"itens":[{"produtoId":1,"quantidade":2}]}
            """;

    // ---------- POST /vendas/calcular ----------

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void calcular_DeveDevolver200_QuandoUsuarioForFuncionario() throws Exception { // D-2
        when(vendaService.calcular(any(VendaRequest.class))).thenReturn(calculo());

        mockMvc.perform(post("/vendas/calcular")
                        .contentType("application/json")
                        .content(CARRINHO_VALIDO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(5.00));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void calcular_DeveDevolver200_QuandoUsuarioForAdmin() throws Exception {
        when(vendaService.calcular(any(VendaRequest.class))).thenReturn(calculo());

        mockMvc.perform(post("/vendas/calcular")
                        .contentType("application/json")
                        .content(CARRINHO_VALIDO))
                .andExpect(status().isOk());
    }

    @Test
    void calcular_DeveDevolver401_QuandoNaoHouverUsuario() throws Exception { // D-2
        mockMvc.perform(post("/vendas/calcular")
                        .contentType("application/json")
                        .content(CARRINHO_VALIDO))
                .andExpect(status().isUnauthorized());

        verify(vendaService, never()).calcular(any());
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void calcular_DeveDevolver400_QuandoCarrinhoEstiverVazio() throws Exception {
        mockMvc.perform(post("/vendas/calcular")
                        .contentType("application/json")
                        .content("{\"itens\":[]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.usuarioMensagem").value("Dados inválidos"))
                .andExpect(jsonPath("$.erros", hasItem("itens: A venda deve ter ao menos um item")));

        verify(vendaService, never()).calcular(any());
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void calcular_DeveDevolver400_QuandoQuantidadeForZero() throws Exception {
        mockMvc.perform(post("/vendas/calcular")
                        .contentType("application/json")
                        .content("{\"itens\":[{\"produtoId\":1,\"quantidade\":0}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros", hasItem("itens[0].quantidade: A quantidade deve ser maior que zero")));

        verify(vendaService, never()).calcular(any());
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void calcular_DeveDevolver400_QuandoQuantidadeForNegativa() throws Exception {
        mockMvc.perform(post("/vendas/calcular")
                        .contentType("application/json")
                        .content("{\"itens\":[{\"produtoId\":1,\"quantidade\":-3}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros", hasItem("itens[0].quantidade: A quantidade deve ser maior que zero")));
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void calcular_DeveDevolver400_QuandoItemNaoTiverProduto() throws Exception {
        mockMvc.perform(post("/vendas/calcular")
                        .contentType("application/json")
                        .content("{\"itens\":[{\"quantidade\":2}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros", hasItem("itens[0].produtoId: O produto é obrigatório")));
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void calcular_DeveDevolver400_QuandoDescontoForNegativo() throws Exception {
        mockMvc.perform(post("/vendas/calcular")
                        .contentType("application/json")
                        .content("{\"itens\":[{\"produtoId\":1,\"quantidade\":2,"
                                + "\"tipoDesconto\":\"VALOR_FIXO\",\"valorDesconto\":-1.00}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros", hasItem("itens[0].valorDesconto: O desconto não pode ser negativo")));
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void calcular_DeveDevolver404_QuandoProdutoNaoExistir() throws Exception {
        when(vendaService.calcular(any(VendaRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto 1 não encontrado"));

        mockMvc.perform(post("/vendas/calcular")
                        .contentType("application/json")
                        .content(CARRINHO_VALIDO))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.usuarioMensagem").value("Produto 1 não encontrado"));
    }

    // ---------- POST /vendas ----------

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void confirmar_DeveDevolver201_QuandoUsuarioForFuncionario() throws Exception {
        // D-2: vender e funcao do caixa, exigir ADMIN aqui quebraria a operacao da loja
        when(vendaService.confirmar(any(VendaRequest.class))).thenReturn(venda());

        mockMvc.perform(post("/vendas")
                        .contentType("application/json")
                        .content(VENDA_VALIDA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.total").value(5.00));

        verify(vendaService).confirmar(any(VendaRequest.class));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void confirmar_DeveDevolver201_QuandoUsuarioForAdmin() throws Exception {
        when(vendaService.confirmar(any(VendaRequest.class))).thenReturn(venda());

        mockMvc.perform(post("/vendas")
                        .contentType("application/json")
                        .content(VENDA_VALIDA))
                .andExpect(status().isCreated());
    }

    @Test
    void confirmar_DeveDevolver401_QuandoNaoHouverUsuario() throws Exception { // D-2
        mockMvc.perform(post("/vendas")
                        .contentType("application/json")
                        .content(VENDA_VALIDA))
                .andExpect(status().isUnauthorized());

        verify(vendaService, never()).confirmar(any());
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void confirmar_DeveDevolver400_QuandoCarrinhoEstiverVazio() throws Exception {
        mockMvc.perform(post("/vendas")
                        .contentType("application/json")
                        .content("{\"itens\":[],\"tipoPagamento\":\"DINHEIRO\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros", hasItem("itens: A venda deve ter ao menos um item")));

        verify(vendaService, never()).confirmar(any());
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void confirmar_DeveDevolver400_QuandoFormaDePagamentoNaoVier() throws Exception {
        // tipoPagamento e opcional no preview, entao a cobranca fica no service e nao no @Valid
        when(vendaService.confirmar(any(VendaRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "A forma de pagamento é obrigatória"));

        mockMvc.perform(post("/vendas")
                        .contentType("application/json")
                        .content(CARRINHO_VALIDO))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.usuarioMensagem").value("A forma de pagamento é obrigatória"));
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void confirmar_DeveDevolver409_QuandoEstoqueForInsuficiente() throws Exception { // D-8
        when(vendaService.confirmar(any(VendaRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT,
                        "Estoque insuficiente para o produto Caneta azul"));

        mockMvc.perform(post("/vendas")
                        .contentType("application/json")
                        .content(VENDA_VALIDA))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.usuarioMensagem").value("Estoque insuficiente para o produto Caneta azul"));
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void confirmar_DeveDevolver404_QuandoProdutoNaoExistir() throws Exception {
        when(vendaService.confirmar(any(VendaRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto 1 não encontrado"));

        mockMvc.perform(post("/vendas")
                        .contentType("application/json")
                        .content(VENDA_VALIDA))
                .andExpect(status().isNotFound());
    }

    // ---------- GET /vendas ----------

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void listar_DeveDevolver200_QuandoUsuarioForFuncionario() throws Exception {
        when(vendaService.listar(any(), any(), any(), any(Pageable.class))).thenReturn(pagina());

        mockMvc.perform(get("/vendas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(10));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void listar_DeveAceitarFiltroDeDataEFuncionario() throws Exception {
        when(vendaService.listar(any(), any(), any(), any(Pageable.class))).thenReturn(pagina());

        mockMvc.perform(get("/vendas")
                        .param("dataInicio", "2026-07-01")
                        .param("dataFim", "2026-07-31")
                        .param("funcionarioId", "3"))
                .andExpect(status().isOk());
    }

    @Test
    void listar_DeveDevolver401_QuandoNaoHouverUsuario() throws Exception { // D-2
        mockMvc.perform(get("/vendas"))
                .andExpect(status().isUnauthorized());

        verify(vendaService, never()).listar(any(), any(), any(), any());
    }

    // ---------- helpers ----------

    private ItemVendaResponse item() {
        return ItemVendaResponse.builder()
                .produtoId(1L)
                .nomeProduto("Caneta azul")
                .quantidade(2)
                .precoUnitario(new BigDecimal("2.50"))
                .valorDesconto(BigDecimal.ZERO)
                .descontoAplicado(BigDecimal.ZERO)
                .subtotal(new BigDecimal("5.00"))
                .build();
    }

    private CalculoVendaResponse calculo() {
        return CalculoVendaResponse.builder()
                .itens(List.of(item()))
                .subtotal(new BigDecimal("5.00"))
                .descontoTotal(BigDecimal.ZERO)
                .total(new BigDecimal("5.00"))
                .build();
    }

    private VendaResponse venda() {
        return VendaResponse.builder()
                .id(10L)
                .dataHora(LocalDateTime.of(2026, 7, 26, 14, 30))
                .operador("Danilo")
                .tipoPagamento(TipoPagamento.DINHEIRO)
                .itens(List.of(item()))
                .subtotal(new BigDecimal("5.00"))
                .descontoTotal(BigDecimal.ZERO)
                .total(new BigDecimal("5.00"))
                .build();
    }

    private Page<VendaResumoResponse> pagina() {
        return new PageImpl<>(List.of(VendaResumoResponse.builder()
                .id(10L)
                .dataHora(LocalDateTime.of(2026, 7, 26, 14, 30))
                .operador("Danilo")
                .tipoPagamento(TipoPagamento.DINHEIRO)
                .qtdItens(2)
                .subtotal(new BigDecimal("5.00"))
                .descontoTotal(BigDecimal.ZERO)
                .total(new BigDecimal("5.00"))
                .build()));
    }
}
