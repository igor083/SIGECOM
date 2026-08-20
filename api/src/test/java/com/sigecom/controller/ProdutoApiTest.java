package com.sigecom.controller;

import com.sigecom.domain.Produto;
import com.sigecom.model.request.produto.CadastroProdutoRequest;
import com.sigecom.model.request.produto.EditarProdutoRequest;
import com.sigecom.model.response.produto.ProdutoResponse;
import com.sigecom.service.EstoqueService;
import com.sigecom.service.ProdutoService;
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
import java.util.List;

import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// A camada de controller estava em 6,5% de cobertura. Aqui o alvo e o contrato HTTP
// de /produtos: quem entra, o que e barrado pelo @Valid e o que o service devolve de
// erro de negocio. O service ja tem teste proprio, entao ele entra mockado.
@SpringBootTest
@AutoConfigureMockMvc
class ProdutoApiTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProdutoService produtoService;

    @MockitoBean
    private EstoqueService estoqueService;

    private static final String CADASTRO_VALIDO = """
            {"nome":"Caneta azul","descricao":"Caixa com 50","preco":2.50,
             "categoriaId":1,"qtdEstoqueInicial":10,"estoqueMinimo":2}
            """;

    private static final String EDICAO_VALIDA = """
            {"nome":"Caneta azul","descricao":"Caixa com 50","preco":3.00,
             "categoriaId":1,"estoqueMinimo":2}
            """;

    // ---------- POST /produtos ----------

    @Test
    @WithMockUser(roles = "ADMIN")
    void cadastrar_DeveDevolver201_QuandoUsuarioForAdmin() throws Exception {
        when(produtoService.cadastrar(any(CadastroProdutoRequest.class))).thenReturn(produtoResponse());

        mockMvc.perform(post("/produtos")
                        .contentType("application/json")
                        .content(CADASTRO_VALIDO))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nome").value("Caneta azul"));

        verify(produtoService).cadastrar(any(CadastroProdutoRequest.class));
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void cadastrar_DeveDevolver403_QuandoUsuarioForFuncionario() throws Exception { // D-2
        mockMvc.perform(post("/produtos")
                        .contentType("application/json")
                        .content(CADASTRO_VALIDO))
                .andExpect(status().isForbidden());

        verify(produtoService, never()).cadastrar(any());
    }

    @Test
    void cadastrar_DeveDevolver401_QuandoNaoHouverUsuario() throws Exception { // D-2
        mockMvc.perform(post("/produtos")
                        .contentType("application/json")
                        .content(CADASTRO_VALIDO))
                .andExpect(status().isUnauthorized());

        verify(produtoService, never()).cadastrar(any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void cadastrar_DeveDevolver400_QuandoNomeVierEmBranco() throws Exception {
        mockMvc.perform(post("/produtos")
                        .contentType("application/json")
                        .content("{\"nome\":\"   \",\"preco\":2.50,\"categoriaId\":1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.usuarioMensagem").value("Dados inválidos"))
                .andExpect(jsonPath("$.erros", hasItem("nome: O nome é obrigatório")));

        verify(produtoService, never()).cadastrar(any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void cadastrar_DeveDevolver400_QuandoPrecoForNegativo() throws Exception {
        mockMvc.perform(post("/produtos")
                        .contentType("application/json")
                        .content("{\"nome\":\"Caneta\",\"preco\":-1.00,\"categoriaId\":1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros", hasItem("preco: O preço não pode ser negativo")));

        verify(produtoService, never()).cadastrar(any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void cadastrar_DeveDevolver400_QuandoCategoriaNaoVier() throws Exception {
        mockMvc.perform(post("/produtos")
                        .contentType("application/json")
                        .content("{\"nome\":\"Caneta\",\"preco\":2.50}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros", hasItem("categoriaId: A categoria é obrigatória")));

        verify(produtoService, never()).cadastrar(any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void cadastrar_DeveDevolver400_QuandoEstoqueInicialForNegativo() throws Exception {
        mockMvc.perform(post("/produtos")
                        .contentType("application/json")
                        .content("{\"nome\":\"Caneta\",\"preco\":2.50,\"categoriaId\":1,\"qtdEstoqueInicial\":-5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros", hasItem("qtdEstoqueInicial: A quantidade inicial não pode ser negativa")));

        verify(produtoService, never()).cadastrar(any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void cadastrar_DeveDevolver404_QuandoCategoriaNaoExistir() throws Exception {
        when(produtoService.cadastrar(any(CadastroProdutoRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada"));

        mockMvc.perform(post("/produtos")
                        .contentType("application/json")
                        .content(CADASTRO_VALIDO))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.usuarioMensagem").value("Categoria não encontrada"));
    }

    // ---------- GET /produtos ----------

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void listar_DeveDevolver200_QuandoUsuarioForFuncionario() throws Exception {
        // consulta de catalogo e aberta ao PDV de proposito, aqui 403 seria bug
        when(produtoService.listar(any(), any(), any(), any(Pageable.class))).thenReturn(pagina());

        mockMvc.perform(get("/produtos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].nome").value("Caneta azul"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void listar_DeveDevolver200_QuandoUsuarioForAdmin() throws Exception {
        when(produtoService.listar(any(), any(), any(), any(Pageable.class))).thenReturn(pagina());

        mockMvc.perform(get("/produtos").param("nome", "caneta").param("categoriaId", "1"))
                .andExpect(status().isOk());
    }

    @Test
    void listar_DeveDevolver401_QuandoNaoHouverUsuario() throws Exception { // D-2
        mockMvc.perform(get("/produtos"))
                .andExpect(status().isUnauthorized());

        verify(produtoService, never()).listar(any(), any(), any(), any());
    }

    // ACHADO: valor de enum invalido na query devolve 500, nao 400. O
    // GlobalExceptionHandler nao trata MethodArgumentTypeMismatchException e ela cai
    // no handler generico. O teste registra o que acontece hoje, nao o que devia.
    @Test
    @WithMockUser(roles = "ADMIN")
    void listar_DeveDevolver500_QuandoFiltroDeEstoqueForInvalido() throws Exception {
        mockMvc.perform(get("/produtos").param("estoque", "MUITO_BAIXO"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.usuarioMensagem")
                        .value("Ocorreu um erro interno. Tente novamente mais tarde."));

        verify(produtoService, never()).listar(any(), any(), any(), any());
    }

    // ---------- GET /produtos/por-tipo/{categoriaId} ----------

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void listarPorTipo_DeveDevolver200_QuandoUsuarioForFuncionario() throws Exception {
        when(produtoService.listarPorTipo(eq(1L), any(Pageable.class))).thenReturn(pagina());

        mockMvc.perform(get("/produtos/por-tipo/1"))
                .andExpect(status().isOk());
    }

    @Test
    void listarPorTipo_DeveDevolver401_QuandoNaoHouverUsuario() throws Exception { // D-2
        mockMvc.perform(get("/produtos/por-tipo/1"))
                .andExpect(status().isUnauthorized());
    }

    // ---------- GET /produtos/estoque-baixo ----------

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void listarEstoqueBaixo_DeveDevolver200_QuandoUsuarioForFuncionario() throws Exception {
        when(produtoService.listarEstoqueBaixo(any(Pageable.class))).thenReturn(pagina());

        mockMvc.perform(get("/produtos/estoque-baixo"))
                .andExpect(status().isOk());
    }

    @Test
    void listarEstoqueBaixo_DeveDevolver401_QuandoNaoHouverUsuario() throws Exception { // D-2
        mockMvc.perform(get("/produtos/estoque-baixo"))
                .andExpect(status().isUnauthorized());
    }

    // ---------- POST /produtos/{id}/ajustar-estoque ----------

    @Test
    @WithMockUser(roles = "ADMIN")
    void ajustarEstoque_DeveDevolver200_QuandoUsuarioForAdmin() throws Exception {
        when(estoqueService.ajustarEstoque(1L, 30)).thenReturn(produtoEntidade());

        mockMvc.perform(post("/produtos/1/ajustar-estoque")
                        .contentType("application/json")
                        .content("{\"quantidade\":30}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.qtdEstoque").value(30));
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void ajustarEstoque_DeveDevolver403_QuandoUsuarioForFuncionario() throws Exception { // D-2
        mockMvc.perform(post("/produtos/1/ajustar-estoque")
                        .contentType("application/json")
                        .content("{\"quantidade\":30}"))
                .andExpect(status().isForbidden());

        verify(estoqueService, never()).ajustarEstoque(anyLong(), org.mockito.ArgumentMatchers.anyInt());
    }

    @Test
    void ajustarEstoque_DeveDevolver401_QuandoNaoHouverUsuario() throws Exception { // D-2
        mockMvc.perform(post("/produtos/1/ajustar-estoque")
                        .contentType("application/json")
                        .content("{\"quantidade\":30}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void ajustarEstoque_DeveDevolver400_QuandoQuantidadeForNegativa() throws Exception {
        mockMvc.perform(post("/produtos/1/ajustar-estoque")
                        .contentType("application/json")
                        .content("{\"quantidade\":-1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros", hasItem("quantidade: A quantidade não pode ser negativa")));

        verify(estoqueService, never()).ajustarEstoque(anyLong(), org.mockito.ArgumentMatchers.anyInt());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void ajustarEstoque_DeveDevolver400_QuandoQuantidadeNaoVier() throws Exception {
        mockMvc.perform(post("/produtos/1/ajustar-estoque")
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros", hasItem("quantidade: A quantidade é obrigatória")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void ajustarEstoque_DeveDevolver404_QuandoProdutoNaoExistir() throws Exception {
        when(estoqueService.ajustarEstoque(99L, 5))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));

        mockMvc.perform(post("/produtos/99/ajustar-estoque")
                        .contentType("application/json")
                        .content("{\"quantidade\":5}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.usuarioMensagem").value("Produto não encontrado"));
    }

    // ---------- PUT /produtos/{id} ----------

    @Test
    @WithMockUser(roles = "ADMIN")
    void editar_DeveDevolver200_QuandoUsuarioForAdmin() throws Exception {
        when(produtoService.editar(eq(1L), any(EditarProdutoRequest.class))).thenReturn(produtoResponse());

        mockMvc.perform(put("/produtos/1")
                        .contentType("application/json")
                        .content(EDICAO_VALIDA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void editar_DeveDevolver403_QuandoUsuarioForFuncionario() throws Exception { // D-2
        mockMvc.perform(put("/produtos/1")
                        .contentType("application/json")
                        .content(EDICAO_VALIDA))
                .andExpect(status().isForbidden());

        verify(produtoService, never()).editar(anyLong(), any());
    }

    @Test
    void editar_DeveDevolver401_QuandoNaoHouverUsuario() throws Exception { // D-2
        mockMvc.perform(put("/produtos/1")
                        .contentType("application/json")
                        .content(EDICAO_VALIDA))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void editar_DeveDevolver400_QuandoPrecoNaoVier() throws Exception {
        mockMvc.perform(put("/produtos/1")
                        .contentType("application/json")
                        .content("{\"nome\":\"Caneta\",\"categoriaId\":1,\"estoqueMinimo\":2}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros", hasItem("preco: O preço é obrigatório")));

        verify(produtoService, never()).editar(anyLong(), any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void editar_DeveDevolver400_QuandoLinkDaImagemNaoForHttp() throws Exception {
        mockMvc.perform(put("/produtos/1")
                        .contentType("application/json")
                        .content("{\"nome\":\"Caneta\",\"preco\":3.00,\"categoriaId\":1,"
                                + "\"estoqueMinimo\":2,\"imagemUrl\":\"ftp://arquivo.png\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros", hasItem("imagemUrl: O link da imagem deve começar com http:// ou https://")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void editar_DeveDevolver404_QuandoProdutoNaoExistir() throws Exception {
        when(produtoService.editar(eq(99L), any(EditarProdutoRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));

        mockMvc.perform(put("/produtos/99")
                        .contentType("application/json")
                        .content(EDICAO_VALIDA))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.usuarioMensagem").value("Produto não encontrado"));
    }

    // ---------- DELETE /produtos/{id} ----------

    @Test
    @WithMockUser(roles = "ADMIN")
    void excluir_DeveDevolver204_QuandoUsuarioForAdmin() throws Exception {
        mockMvc.perform(delete("/produtos/1"))
                .andExpect(status().isNoContent());

        verify(produtoService).excluir(1L);
    }

    @Test
    @WithMockUser(roles = "FUNCIONARIO")
    void excluir_DeveDevolver403_QuandoUsuarioForFuncionario() throws Exception { // D-2
        mockMvc.perform(delete("/produtos/1"))
                .andExpect(status().isForbidden());

        verify(produtoService, never()).excluir(anyLong());
    }

    @Test
    void excluir_DeveDevolver401_QuandoNaoHouverUsuario() throws Exception { // D-2
        mockMvc.perform(delete("/produtos/1"))
                .andExpect(status().isUnauthorized());

        verify(produtoService, never()).excluir(anyLong());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void excluir_DeveDevolver400_QuandoProdutoAindaTiverEstoque() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não é possível excluir produto com estoque ativo"))
                .when(produtoService).excluir(1L);

        mockMvc.perform(delete("/produtos/1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.usuarioMensagem").value("Não é possível excluir produto com estoque ativo"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void excluir_DeveDevolver404_QuandoProdutoNaoExistir() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"))
                .when(produtoService).excluir(99L);

        mockMvc.perform(delete("/produtos/99"))
                .andExpect(status().isNotFound());
    }

    // ---------- helpers ----------

    private ProdutoResponse produtoResponse() {
        return ProdutoResponse.builder()
                .id(1L)
                .nome("Caneta azul")
                .descricao("Caixa com 50")
                .preco(new BigDecimal("2.50"))
                .categoria(new ProdutoResponse.CategoriaInfo(1L, "Papelaria"))
                .qtdEstoque(10)
                .estoqueMinimo(2)
                .ativo(true)
                .build();
    }

    private Page<ProdutoResponse> pagina() {
        return new PageImpl<>(List.of(produtoResponse()));
    }

    // o endpoint de ajuste devolve a entidade, nao DTO, entao o teste tem que montar Produto
    private Produto produtoEntidade() {
        return Produto.builder()
                .id(1L)
                .nome("Caneta azul")
                .preco(new BigDecimal("2.50"))
                .qtdEstoque(30)
                .estoqueMinimo(2)
                .build();
    }
}
