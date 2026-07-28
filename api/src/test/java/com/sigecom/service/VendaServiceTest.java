package com.sigecom.service;

import com.sigecom.domain.CategoriaFinanceira;
import com.sigecom.domain.CategoriaProduto;
import com.sigecom.domain.ItemVenda;
import com.sigecom.domain.LancamentoFinanceiro;
import com.sigecom.domain.Produto;
import com.sigecom.domain.Usuario;
import com.sigecom.domain.Venda;
import com.sigecom.domain.enums.TipoDesconto;
import com.sigecom.domain.enums.TipoLancamento;
import com.sigecom.domain.enums.TipoPagamento;
import com.sigecom.domain.enums.TipoUsuario;
import com.sigecom.model.request.venda.ItemVendaRequest;
import com.sigecom.model.request.venda.VendaRequest;
import com.sigecom.model.response.venda.CalculoVendaResponse;
import com.sigecom.model.response.venda.VendaResponse;
import com.sigecom.repository.CategoriaFinanceiraRepository;
import com.sigecom.repository.LancamentoFinanceiroRepository;
import com.sigecom.repository.ProdutoRepository;
import com.sigecom.repository.UsuarioRepository;
import com.sigecom.repository.VendaRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Testes unitários do VendaService — cobrem os critérios das
 * User Stories do carrinho (Sprint 3):
 *
 *   US-026 — cálculo automático (subtotal, desconto, total)
 *   US-027 — confirmar e registrar venda (persistência + baixa de estoque)
 *
 * Cada critério de aceitação tem ao menos um teste dedicado.
 */
@ExtendWith(MockitoExtension.class)
class VendaServiceTest {

    @Mock private VendaRepository vendaRepository;
    @Mock private ProdutoRepository produtoRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private LancamentoFinanceiroRepository lancamentoFinanceiroRepository;
    @Mock private CategoriaFinanceiraRepository categoriaFinanceiraRepository;

    @InjectMocks private VendaService vendaService;

    private Usuario operador;
    private CategoriaProduto categoria;

    // ── Setup ────────────────────────────────────────────────

    @BeforeEach
    void setUp() {
        categoria = new CategoriaProduto();
        categoria.setId(1L);
        categoria.setNome("Alimentos");

        operador = Usuario.builder()
                .id(7L)
                .nome("Igor")
                .email("igor@sigecom.com")
                .senhaHash("hash")
                .perfil(TipoUsuario.FUNCIONARIO)
                .build();

        // Autentica o "operador" no SecurityContext para os testes
        // de confirmação — replicando o comportamento do JwtAuthFilter.
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(operador.getEmail(), null, List.of())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ── Helpers ──────────────────────────────────────────────

    private Produto produto(Long id, String nome, String preco, int estoque) {
        return Produto.builder()
                .id(id)
                .categoria(categoria)
                .nome(nome)
                .descricao("desc")
                .preco(new BigDecimal(preco))
                .qtdEstoque(estoque)
                .estoqueMinimo(0)
                .ativo(true)
                .build();
    }

    private ItemVendaRequest item(Long id, int qtd) {
        return new ItemVendaRequest(id, qtd, null, null);
    }

    private ItemVendaRequest item(Long id, int qtd, TipoDesconto tipo, String valor) {
        return new ItemVendaRequest(id, qtd, tipo, new BigDecimal(valor));
    }

    /** Request para preview (sem forma de pagamento). */
    private VendaRequest req(ItemVendaRequest... itens) {
        return new VendaRequest(List.of(itens), null);
    }

    /** Request para confirmação (com forma de pagamento). */
    private VendaRequest reqPago(TipoPagamento tipoPagamento, ItemVendaRequest... itens) {
        return new VendaRequest(List.of(itens), tipoPagamento);
    }

    private BigDecimal reais(String v) {
        return new BigDecimal(v);
    }

    private void stubProdutos(Produto... produtos) {
        for (Produto p : produtos) {
            when(produtoRepository.findById(p.getId())).thenReturn(Optional.of(p));
        }
    }

    private void stubOperadorAutenticado() {
        when(usuarioRepository.findByEmail(operador.getEmail())).thenReturn(Optional.of(operador));
    }

    private void stubSaveVenda() {
        when(vendaRepository.save(any(Venda.class))).thenAnswer(inv -> {
            Venda v = inv.getArgument(0);
            v.setId(100L);
            return v;
        });
        // Todo caminho de sucesso reporta a venda no financeiro logo após
        // salvá-la, exigindo a categoria de receita "Venda" (US-18).
        stubCategoriaVenda();
    }

    private void stubCategoriaVenda() {
        CategoriaFinanceira catVenda = new CategoriaFinanceira();
        catVenda.setId(1L);
        catVenda.setNome("Venda");
        catVenda.setTipo(TipoLancamento.RECEITA);
        when(categoriaFinanceiraRepository
                .findFirstByNomeIgnoreCaseAndTipo("Venda", TipoLancamento.RECEITA))
                .thenReturn(Optional.of(catVenda));
    }

    // =============================================================
    // US-026 — Cálculo automático do total
    // =============================================================

    @Nested
    @DisplayName("calcular() — US-026: cálculo automático do total")
    class Calcular {

        @Test
        @DisplayName("um item sem desconto: subtotal = preço × qtd, desconto = 0, total = subtotal")
        void calcular_UmItemSemDesconto_DeveRetornarSubtotalIgualAoTotal() {
            Produto p = produto(1L, "Arroz", "7.50", 100);
            stubProdutos(p);

            CalculoVendaResponse resp = vendaService.calcular(req(item(1L, 2)));

            assertEquals(reais("15.00"), resp.subtotal());
            assertEquals(reais("0.00"), resp.descontoTotal());
            assertEquals(reais("15.00"), resp.total());
            assertEquals(1, resp.itens().size());
            assertEquals(reais("15.00"), resp.itens().get(0).subtotal());
            assertEquals(reais("0.00"), resp.itens().get(0).descontoAplicado());
        }

        @Test
        @DisplayName("múltiplos itens: soma corretamente os subtotais")
        void calcular_MultiplosItens_DeveSomarSubtotais() {
            Produto p1 = produto(1L, "Arroz", "7.50", 100);
            Produto p2 = produto(2L, "Feijão", "8.90", 100);
            stubProdutos(p1, p2);

            CalculoVendaResponse resp = vendaService.calcular(req(item(1L, 2), item(2L, 3)));

            // 15.00 + 26.70 = 41.70
            assertEquals(reais("41.70"), resp.subtotal());
            assertEquals(reais("0.00"), resp.descontoTotal());
            assertEquals(reais("41.70"), resp.total());
        }

        @Test
        @DisplayName("desconto PERCENTUAL: aplica sobre o bruto do item")
        void calcular_DescontoPercentual_DeveAplicarSobreBrutoDoItem() {
            Produto p = produto(1L, "Refrigerante", "10.00", 100);
            stubProdutos(p);

            // 10% de 20.00 = 2.00
            CalculoVendaResponse resp = vendaService.calcular(
                    req(item(1L, 2, TipoDesconto.PERCENTUAL, "10"))
            );

            assertEquals(reais("20.00"), resp.subtotal());
            assertEquals(reais("2.00"), resp.descontoTotal());
            assertEquals(reais("18.00"), resp.total());
            assertEquals(reais("2.00"), resp.itens().get(0).descontoAplicado());
            assertEquals(reais("18.00"), resp.itens().get(0).subtotal());
        }

        @Test
        @DisplayName("desconto VALOR_FIXO: subtrai o valor do bruto do item")
        void calcular_DescontoValorFixo_DeveSubtrairDoBrutoDoItem() {
            Produto p = produto(1L, "Sabão", "14.90", 100);
            stubProdutos(p);

            CalculoVendaResponse resp = vendaService.calcular(
                    req(item(1L, 1, TipoDesconto.VALOR_FIXO, "2.90"))
            );

            assertEquals(reais("14.90"), resp.subtotal());
            assertEquals(reais("2.90"), resp.descontoTotal());
            assertEquals(reais("12.00"), resp.total());
        }

        @Test
        @DisplayName("desconto PERCENTUAL > 100%: clampa em 100% e total nunca fica negativo")
        void calcular_DescontoPercentualAcimaDeCem_DeveClampearEm100() {
            Produto p = produto(1L, "Item", "50.00", 100);
            stubProdutos(p);

            CalculoVendaResponse resp = vendaService.calcular(
                    req(item(1L, 1, TipoDesconto.PERCENTUAL, "150"))
            );

            // 150% seria 75.00 negativos; clampado em 100%: desconto = 50.00
            assertEquals(reais("50.00"), resp.subtotal());
            assertEquals(reais("50.00"), resp.descontoTotal());
            assertEquals(reais("0.00"), resp.total());
        }

        @Test
        @DisplayName("desconto VALOR_FIXO maior que bruto: clampa no bruto (total nunca negativo)")
        void calcular_DescontoValorFixoMaiorQueBruto_DeveClampearNoBrutoDoItem() {
            Produto p = produto(1L, "Item", "5.00", 100);
            stubProdutos(p);

            CalculoVendaResponse resp = vendaService.calcular(
                    req(item(1L, 1, TipoDesconto.VALOR_FIXO, "999.00"))
            );

            assertEquals(reais("5.00"), resp.subtotal());
            assertEquals(reais("5.00"), resp.descontoTotal());
            assertEquals(reais("0.00"), resp.total());
        }

        @Test
        @DisplayName("tipoDesconto null: não aplica desconto mesmo com valor informado")
        void calcular_TipoDescontoNulo_NaoDeveAplicarDesconto() {
            Produto p = produto(1L, "Item", "10.00", 100);
            stubProdutos(p);

            CalculoVendaResponse resp = vendaService.calcular(
                    req(new ItemVendaRequest(1L, 1, null, new BigDecimal("5.00")))
            );

            assertEquals(reais("0.00"), resp.descontoTotal());
            assertEquals(reais("10.00"), resp.total());
        }

        @Test
        @DisplayName("valorDesconto = 0: não aplica desconto mesmo com tipo informado")
        void calcular_ValorDescontoZero_NaoDeveAplicarDesconto() {
            Produto p = produto(1L, "Item", "10.00", 100);
            stubProdutos(p);

            CalculoVendaResponse resp = vendaService.calcular(
                    req(item(1L, 1, TipoDesconto.PERCENTUAL, "0"))
            );

            assertEquals(reais("0.00"), resp.descontoTotal());
            assertEquals(reais("10.00"), resp.total());
        }

        @Test
        @DisplayName("mistura com e sem desconto: soma descontos separadamente")
        void calcular_MisturaDeItens_DeveAgregarSubtotalEDescontoSeparadamente() {
            Produto p1 = produto(1L, "Arroz", "10.00", 100);   // sem desconto → 20.00
            Produto p2 = produto(2L, "Feijão", "20.00", 100);  // 10% → -2.00 → 18.00
            Produto p3 = produto(3L, "Sabão", "5.00", 100);    // R$ 1 fixo → -1.00 → 4.00
            stubProdutos(p1, p2, p3);

            CalculoVendaResponse resp = vendaService.calcular(req(
                    item(1L, 2),
                    item(2L, 1, TipoDesconto.PERCENTUAL, "10"),
                    item(3L, 1, TipoDesconto.VALOR_FIXO, "1.00")
            ));

            assertEquals(reais("45.00"), resp.subtotal());     // 20 + 20 + 5
            assertEquals(reais("3.00"), resp.descontoTotal()); // 0 + 2 + 1
            assertEquals(reais("42.00"), resp.total());
        }

        @Test
        @DisplayName("valores fracionários: mantém 2 casas com HALF_UP (arredondamento consistente)")
        void calcular_ArredondamentoHalfUp_DevePreservarDuasCasas() {
            // 33.33 × 3 = 99.99; 10% = 9.999 → 10.00 (HALF_UP)
            Produto p = produto(1L, "Item", "33.33", 100);
            stubProdutos(p);

            CalculoVendaResponse resp = vendaService.calcular(
                    req(item(1L, 3, TipoDesconto.PERCENTUAL, "10"))
            );

            assertEquals(reais("99.99"), resp.subtotal());
            assertEquals(reais("10.00"), resp.descontoTotal());
            assertEquals(reais("89.99"), resp.total());
        }

        @Test
        @DisplayName("arredondamento HALF_UP no ponto médio (x.xx5 → sobe)")
        void calcular_ArredondamentoHalfUp_MetadeArredondaParaCima() {
            // 3.33 × 3 = 9.99; 15% = 1.4985 → 1.50 (HALF_UP)
            Produto p = produto(1L, "Item", "3.33", 100);
            stubProdutos(p);

            CalculoVendaResponse resp = vendaService.calcular(
                    req(item(1L, 3, TipoDesconto.PERCENTUAL, "15"))
            );

            assertEquals(reais("9.99"), resp.subtotal());
            assertEquals(reais("1.50"), resp.descontoTotal());
            assertEquals(reais("8.49"), resp.total());
        }

        @Test
        @DisplayName("todos os campos monetários da resposta usam escala 2")
        void calcular_TodosOsCamposMonetariosComEscala2() {
            Produto p = produto(1L, "Item", "7.5", 100); // preço com 1 casa
            stubProdutos(p);

            CalculoVendaResponse resp = vendaService.calcular(req(item(1L, 1)));

            assertEquals(2, resp.subtotal().scale());
            assertEquals(2, resp.descontoTotal().scale());
            assertEquals(2, resp.total().scale());
            assertEquals(2, resp.itens().get(0).subtotal().scale());
            assertEquals(2, resp.itens().get(0).descontoAplicado().scale());
        }

        @Test
        @DisplayName("produto inexistente: lança 404 NOT_FOUND com id no reason")
        void calcular_ProdutoInexistente_DeveLancarNotFound() {
            when(produtoRepository.findById(99L)).thenReturn(Optional.empty());

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> vendaService.calcular(req(item(99L, 1))));

            assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
            assertTrue(ex.getReason() != null && ex.getReason().contains("99"),
                    "reason deve conter o id do produto: " + ex.getReason());
        }

        @Test
        @DisplayName("calcular() NÃO persiste (é apenas preview)")
        void calcular_NaoDevePersistirNadaNoBanco() {
            Produto p = produto(1L, "Item", "10.00", 100);
            stubProdutos(p);

            vendaService.calcular(req(item(1L, 1)));

            verify(vendaRepository, never()).save(any());
            verify(produtoRepository, never()).save(any());
        }
    }

    // =============================================================
    // US-027 — Confirmar e registrar venda
    // =============================================================

    @Nested
    @DisplayName("confirmar() — US-027: confirmação e persistência")
    class Confirmar {

        @Test
        @DisplayName("caminho feliz: persiste venda + decrementa estoque + retorna comprovante")
        void confirmar_CarrinhoValido_DevePersistirEBaixarEstoque() {
            Produto p = produto(1L, "Arroz", "10.00", 5);
            stubProdutos(p);
            stubOperadorAutenticado();
            stubSaveVenda();

            VendaResponse resp = vendaService.confirmar(reqPago(TipoPagamento.DINHEIRO,item(1L, 2)));

            assertEquals(100L, resp.id());
            assertEquals(reais("20.00"), resp.subtotal());
            assertEquals(reais("0.00"), resp.descontoTotal());
            assertEquals(reais("20.00"), resp.total());
            assertEquals(operador.getNome(), resp.operador());
            assertNotNull(resp.dataHora());

            // Estoque decrementado no objeto salvo
            assertEquals(3, p.getQtdEstoque());
            verify(produtoRepository).save(p);
            verify(vendaRepository).save(any(Venda.class));
        }

        @Test
        @DisplayName("comprovante inclui itens com quantidade e valores")
        void confirmar_DeveGerarComprovanteComItensEQuantidades() {
            Produto p1 = produto(1L, "Arroz", "10.00", 10);
            Produto p2 = produto(2L, "Feijão", "20.00", 10);
            stubProdutos(p1, p2);
            stubOperadorAutenticado();
            stubSaveVenda();

            VendaResponse resp = vendaService.confirmar(reqPago(TipoPagamento.DINHEIRO,item(1L, 2), item(2L, 1)));

            assertEquals(2, resp.itens().size());
            assertEquals("Arroz", resp.itens().get(0).nomeProduto());
            assertEquals(2, resp.itens().get(0).quantidade());
            assertEquals(reais("20.00"), resp.itens().get(0).subtotal());
            assertEquals("Feijão", resp.itens().get(1).nomeProduto());
            assertEquals(1, resp.itens().get(1).quantidade());
        }

        @Test
        @DisplayName("venda persistida vem associada ao usuário autenticado")
        void confirmar_DeveAssociarVendaAoOperadorAutenticado() {
            Produto p = produto(1L, "Item", "5.00", 10);
            stubProdutos(p);
            stubOperadorAutenticado();
            stubSaveVenda();

            ArgumentCaptor<Venda> captor = ArgumentCaptor.forClass(Venda.class);
            vendaService.confirmar(reqPago(TipoPagamento.DINHEIRO,item(1L, 1)));

            verify(vendaRepository).save(captor.capture());
            Venda vendaSalva = captor.getValue();
            assertEquals(operador.getId(), vendaSalva.getUsuario().getId());
            assertEquals(operador.getEmail(), vendaSalva.getUsuario().getEmail());
        }

        @Test
        @DisplayName("descontos são refletidos no total e no desconto persistidos")
        void confirmar_DescontoPorItem_DeveSerRefletidoNoTotalPersistido() {
            Produto p = produto(1L, "Item", "100.00", 10);
            stubProdutos(p);
            stubOperadorAutenticado();
            stubSaveVenda();

            ArgumentCaptor<Venda> captor = ArgumentCaptor.forClass(Venda.class);
            vendaService.confirmar(reqPago(TipoPagamento.DINHEIRO,item(1L, 1, TipoDesconto.PERCENTUAL, "20")));

            verify(vendaRepository).save(captor.capture());
            Venda salva = captor.getValue();
            assertEquals(reais("20.00"), salva.getDesconto());
            assertEquals(reais("80.00"), salva.getTotal());
        }

        @Test
        @DisplayName("cada ItemVenda recebe referência de volta para a Venda pai (relação bidirecional)")
        void confirmar_ItensRecebemReferenciaDaVenda() {
            Produto p = produto(1L, "Item", "10.00", 10);
            stubProdutos(p);
            stubOperadorAutenticado();
            stubSaveVenda();

            ArgumentCaptor<Venda> captor = ArgumentCaptor.forClass(Venda.class);
            vendaService.confirmar(reqPago(TipoPagamento.DINHEIRO,item(1L, 2)));

            verify(vendaRepository).save(captor.capture());
            Venda salva = captor.getValue();
            assertEquals(1, salva.getItens().size());
            ItemVenda item = salva.getItens().get(0);
            assertSame(salva, item.getVenda());
            assertEquals(p, item.getProduto());
            assertEquals(2, item.getQuantidade());
            assertEquals(reais("10.00"), item.getPrecoUnitario());
            assertEquals(reais("20.00"), item.getSubtotal());
        }

        @Test
        @DisplayName("estoque insuficiente: lança 409 CONFLICT e NÃO persiste a venda")
        void confirmar_EstoqueInsuficiente_DeveLancarConflictSemSalvarVenda() {
            Produto p = produto(1L, "Item", "10.00", 1);
            stubProdutos(p);
            stubOperadorAutenticado();

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> vendaService.confirmar(reqPago(TipoPagamento.DINHEIRO,item(1L, 5))));

            assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
            assertTrue(ex.getReason() != null && ex.getReason().contains("Estoque insuficiente"));
            verify(vendaRepository, never()).save(any());
        }

        @Test
        @DisplayName("estoque insuficiente no 2º item: NÃO persiste venda (rollback pelo @Transactional)")
        void confirmar_EstoqueInsuficienteNoSegundoItem_NaoDeveSalvarVenda() {
            // D-8 — Confiabilidade: transação atômica venda ↔ estoque
            Produto p1 = produto(1L, "OK", "10.00", 100);
            Produto p2 = produto(2L, "Falha", "10.00", 1);
            stubProdutos(p1, p2);
            stubOperadorAutenticado();

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> vendaService.confirmar(reqPago(TipoPagamento.DINHEIRO,item(1L, 1), item(2L, 5))));

            assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
            // A venda em si nunca é salva — @Transactional cuida do rollback do
            // save() do produto p1 que ocorreu antes da falha.
            verify(vendaRepository, never()).save(any());
        }

        @Test
        @DisplayName("estoque exato ao pedido: decrementa para zero sem erro")
        void confirmar_EstoqueExatoAoPedido_DeveZerarEstoque() {
            Produto p = produto(1L, "Item", "10.00", 3);
            stubProdutos(p);
            stubOperadorAutenticado();
            stubSaveVenda();

            vendaService.confirmar(reqPago(TipoPagamento.DINHEIRO,item(1L, 3)));

            assertEquals(0, p.getQtdEstoque());
            verify(produtoRepository).save(p);
        }

        @Test
        @DisplayName("múltiplos itens: baixa estoque de todos")
        void confirmar_MultiplosItens_DeveBaixarEstoqueDeTodos() {
            Produto p1 = produto(1L, "A", "10.00", 10);
            Produto p2 = produto(2L, "B", "20.00", 10);
            Produto p3 = produto(3L, "C", "30.00", 10);
            stubProdutos(p1, p2, p3);
            stubOperadorAutenticado();
            stubSaveVenda();

            vendaService.confirmar(reqPago(TipoPagamento.DINHEIRO,item(1L, 2), item(2L, 3), item(3L, 4)));

            assertEquals(8, p1.getQtdEstoque());
            assertEquals(7, p2.getQtdEstoque());
            assertEquals(6, p3.getQtdEstoque());
            verify(produtoRepository).save(p1);
            verify(produtoRepository).save(p2);
            verify(produtoRepository).save(p3);
        }

        @Test
        @DisplayName("produto inexistente: lança 404 NOT_FOUND e NÃO persiste nada")
        void confirmar_ProdutoInexistente_DeveLancarNotFound() {
            stubOperadorAutenticado();
            when(produtoRepository.findById(99L)).thenReturn(Optional.empty());

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> vendaService.confirmar(reqPago(TipoPagamento.DINHEIRO,item(99L, 1))));

            assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
            verify(vendaRepository, never()).save(any());
            verify(produtoRepository, never()).save(any());
        }

        @Test
        @DisplayName("operador autenticado não encontrado no banco: lança 401 UNAUTHORIZED")
        void confirmar_OperadorNaoEncontrado_DeveLancarUnauthorized() {
            when(usuarioRepository.findByEmail(operador.getEmail())).thenReturn(Optional.empty());

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> vendaService.confirmar(reqPago(TipoPagamento.DINHEIRO,item(1L, 1))));

            assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
            verify(vendaRepository, never()).save(any());
            verify(produtoRepository, never()).save(any());
        }

        @Test
        @DisplayName("preço unitário registrado é o do produto no momento da venda")
        void confirmar_ItemVendaGuardaPrecoUnitarioDoProduto() {
            Produto p = produto(1L, "Item", "7.50", 10);
            stubProdutos(p);
            stubOperadorAutenticado();
            stubSaveVenda();

            ArgumentCaptor<Venda> captor = ArgumentCaptor.forClass(Venda.class);
            vendaService.confirmar(reqPago(TipoPagamento.DINHEIRO,item(1L, 2)));
            verify(vendaRepository).save(captor.capture());

            ItemVenda item = captor.getValue().getItens().get(0);
            assertEquals(reais("7.50"), item.getPrecoUnitario());
        }

        @Test
        @DisplayName("total persistido nunca é negativo (mesmo com desconto > bruto)")
        void confirmar_TotalPersistidoNuncaNegativo() {
            Produto p = produto(1L, "Item", "10.00", 10);
            stubProdutos(p);
            stubOperadorAutenticado();
            stubSaveVenda();

            ArgumentCaptor<Venda> captor = ArgumentCaptor.forClass(Venda.class);
            vendaService.confirmar(reqPago(TipoPagamento.DINHEIRO,item(1L, 1, TipoDesconto.VALOR_FIXO, "9999")));
            verify(vendaRepository).save(captor.capture());

            Venda salva = captor.getValue();
            assertEquals(0, salva.getTotal().compareTo(BigDecimal.ZERO));
            assertEquals(reais("10.00"), salva.getDesconto()); // desconto foi clampado no bruto
        }

        // ── tipoPagamento (novo campo obrigatório) ───────────────

        @Test
        @DisplayName("sem tipoPagamento: lança 400 BAD_REQUEST e NÃO persiste nada")
        void confirmar_SemTipoPagamento_DeveLancarBadRequest() {
            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> vendaService.confirmar(new VendaRequest(
                            List.of(item(1L, 1)), null)));

            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
            assertTrue(ex.getReason() != null && ex.getReason().contains("forma de pagamento"),
                    "reason deve mencionar forma de pagamento: " + ex.getReason());
            verify(vendaRepository, never()).save(any());
            verify(produtoRepository, never()).save(any());
            verify(usuarioRepository, never()).findByEmail(any());
        }

        @Test
        @DisplayName("persiste corretamente cada TipoPagamento (DINHEIRO / PIX / DEBITO / CREDITO)")
        void confirmar_DevePersistirCadaTipoPagamento() {
            for (TipoPagamento tipo : TipoPagamento.values()) {
                // reset mocks a cada iteração — cenário isolado
                reset(vendaRepository, produtoRepository, usuarioRepository);
                Produto p = produto(1L, "Item", "5.00", 10);
                stubProdutos(p);
                stubOperadorAutenticado();
                stubSaveVenda();

                ArgumentCaptor<Venda> captor = ArgumentCaptor.forClass(Venda.class);
                vendaService.confirmar(reqPago(tipo, item(1L, 1)));
                verify(vendaRepository).save(captor.capture());

                assertEquals(tipo, captor.getValue().getTipoPagamento(),
                        "TipoPagamento persistido incorreto para " + tipo);
            }
        }

        @Test
        @DisplayName("comprovante retorna o tipoPagamento escolhido")
        void confirmar_ComprovanteDeveContarTipoPagamento() {
            Produto p = produto(1L, "Item", "5.00", 10);
            stubProdutos(p);
            stubOperadorAutenticado();
            stubSaveVenda();

            VendaResponse resp = vendaService.confirmar(reqPago(TipoPagamento.PIX, item(1L, 1)));

            assertEquals(TipoPagamento.PIX, resp.tipoPagamento());
        }

        // ── Reporte no financeiro (US-18) ────────────────────────

        @Test
        @DisplayName("toda venda gera uma receita no financeiro com o total, categoria Venda e operador")
        void confirmar_DeveReportarVendaComoReceitaNoFinanceiro() {
            Produto p = produto(1L, "Item", "100.00", 10);
            stubProdutos(p);
            stubOperadorAutenticado();
            stubSaveVenda();

            // 20% de desconto → total 80.00; a receita deve refletir o total líquido
            ArgumentCaptor<LancamentoFinanceiro> captor =
                    ArgumentCaptor.forClass(LancamentoFinanceiro.class);
            vendaService.confirmar(reqPago(TipoPagamento.DINHEIRO,
                    item(1L, 1, TipoDesconto.PERCENTUAL, "20")));

            verify(lancamentoFinanceiroRepository).save(captor.capture());
            LancamentoFinanceiro lancamento = captor.getValue();

            assertEquals(TipoLancamento.RECEITA, lancamento.getTipo());
            assertEquals("Venda", lancamento.getCategoria().getNome());
            assertEquals(reais("80.00"), lancamento.getValor());
            assertEquals(operador.getId(), lancamento.getUsuario().getId());
            assertEquals("Venda #100", lancamento.getDescricao());
        }

        @Test
        @DisplayName("categoria de receita 'Venda' ausente: lança 500 e NÃO persiste a venda (rollback)")
        void confirmar_CategoriaVendaAusente_DeveLancarErroSemPersistir() {
            Produto p = produto(1L, "Item", "10.00", 10);
            stubProdutos(p);
            stubOperadorAutenticado();
            when(vendaRepository.save(any(Venda.class))).thenAnswer(inv -> {
                Venda v = inv.getArgument(0);
                v.setId(100L);
                return v;
            });
            when(categoriaFinanceiraRepository
                    .findFirstByNomeIgnoreCaseAndTipo("Venda", TipoLancamento.RECEITA))
                    .thenReturn(Optional.empty());

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> vendaService.confirmar(reqPago(TipoPagamento.DINHEIRO, item(1L, 1))));

            assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, ex.getStatusCode());
            verify(lancamentoFinanceiroRepository, never()).save(any());
        }
    }
}
