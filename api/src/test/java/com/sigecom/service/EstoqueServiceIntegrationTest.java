package com.sigecom.service;

import com.sigecom.domain.CategoriaProduto;
import com.sigecom.domain.Produto;
import com.sigecom.repository.ProdutoRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class EstoqueServiceIntegrationTest {

    @Autowired
    private EstoqueService estoqueService;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private EntityManager entityManager;

    private Produto produto;

    @BeforeEach
    void setUp() {
        // Semeia a CategoriaProduto usando EntityManager
        CategoriaProduto categoria = new CategoriaProduto();
        categoria.setNome("Categoria de Teste");
        entityManager.persist(categoria);

        // Cria o Produto associado à categoria
        produto = Produto.builder()
                .categoria(categoria)
                .nome("Produto de Teste Integration")
                .qtdEstoque(10)
                .preco(BigDecimal.valueOf(50.00))
                .estoqueMinimo(2)
                .ativo(true)
                .build();
        entityManager.persist(produto);
        
        // Garante que tudo foi enviado ao banco antes dos testes
        entityManager.flush();
    }

    @Test
    void baixarEstoque_CaminhoFeliz_DeveDecrementarEstoque() {
        Produto resultado = estoqueService.baixarEstoque(produto.getId(), 4);

        assertEquals(6, resultado.getQtdEstoque());

        // Relê do repositório real
        Produto doBanco = produtoRepository.findById(produto.getId()).orElseThrow();
        assertEquals(6, doBanco.getQtdEstoque());
    }

    @Test
    void baixarEstoque_EstoqueInsuficiente_DeveLancarExcecaoENaoAlterarEstoque() {
        // D-8 — Confiabilidade: transação atômica venda<->estoque
        Long produtoId = produto.getId();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            estoqueService.baixarEstoque(produtoId, 15);
        });

        assertEquals(400, exception.getStatusCode().value());
        assertEquals("Estoque insuficiente", exception.getReason());

        // Relê do repositório real
        Produto doBanco = produtoRepository.findById(produtoId).orElseThrow();
        // O estoque deve permanecer em 10, provando o rollback e consistência do estado (D-8)
        assertEquals(10, doBanco.getQtdEstoque());
    }
}
