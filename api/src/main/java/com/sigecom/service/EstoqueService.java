package com.sigecom.service;

import com.sigecom.domain.Produto;
import com.sigecom.model.response.produto.ProdutoResponse;
import com.sigecom.repository.ProdutoRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class EstoqueService {

    private final ProdutoRepository produtoRepository;

    /**
     * Define a quantidade absoluta de estoque para um produto.
     * Restrito e validado.
     *
     * Devolve ProdutoResponse, e não a entidade: `Produto.categoria` é LAZY e a
     * aplicação roda com `spring.jpa.open-in-view=false`, então a sessão fecha
     * ao sair daqui. Entregar a entidade ao controller fazia o Jackson tocar no
     * proxy já sem sessão, e a resposta virava 500 ("Could not initialize proxy
     * [CategoriaProduto] - no session"). Montar o DTO aqui dentro resolve
     * porque a categoria é lida enquanto a transação ainda está aberta.
     */
    @Transactional
    public ProdutoResponse ajustarEstoque(Long id, int quantidade) {
        if (quantidade < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantidade não pode ser negativa");
        }

        Produto produto = produtoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));

        produto.setQtdEstoque(quantidade);
        Produto salvo = produtoRepository.save(produto);
        log.info("Estoque do produto {} ajustado para {}", id, quantidade);
        return ProdutoResponse.toResponse(salvo);
    }

    /**
     * Decrementa o estoque de forma atômica para fluxo de venda.
     * D-8 — Confiabilidade: transação atômica venda<->estoque
     */
    @Transactional
    public Produto baixarEstoque(Long produtoId, int qtd) {
        // D-8 — Confiabilidade: transação atômica venda<->estoque
        if (qtd <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantidade de baixa deve ser maior que zero");
        }

        Produto produto = produtoRepository.findById(produtoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));

        if (produto.getQtdEstoque() < qtd) {
            log.warn("Estoque insuficiente para o produto {}: atual={}, solicitado={}", produtoId, produto.getQtdEstoque(), qtd);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estoque insuficiente");
        }

        produto.setQtdEstoque(produto.getQtdEstoque() - qtd);
        Produto salvo = produtoRepository.save(produto);
        log.info("Baixa de {} unidades efetuada para o produto {}", qtd, produtoId);
        return salvo;
    }
}
