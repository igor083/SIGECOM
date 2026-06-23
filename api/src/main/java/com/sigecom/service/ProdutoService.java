package com.sigecom.service;

import com.sigecom.domain.CategoriaProduto;
import com.sigecom.domain.Produto;
import com.sigecom.model.request.produto.CadastroProdutoRequest;
import com.sigecom.model.response.produto.ProdutoResponse;
import com.sigecom.repository.CategoriaProdutoRepository;
import com.sigecom.repository.ProdutoRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

import static com.sigecom.model.response.produto.ProdutoResponse.toResponse;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProdutoService {

    private final ProdutoRepository produtoRepository;
    private final CategoriaProdutoRepository categoriaProdutoRepository;

    @Transactional
    public ProdutoResponse cadastrar(CadastroProdutoRequest request) {
        CategoriaProduto categoria = categoriaProdutoRepository.findById(request.categoriaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada"));

        Produto produto = Produto.builder()
                .nome(request.nome().trim())
                .descricao(request.descricao())
                .preco(request.preco() != null ? request.preco() : BigDecimal.ZERO)
                .categoria(categoria)
                .qtdEstoque(request.qtdEstoqueInicial() != null ? request.qtdEstoqueInicial() : 0)
                .build();

        Produto salvo = produtoRepository.save(produto);
        log.info("Novo produto cadastrado: id={}, nome={}", salvo.getId(), salvo.getNome());

        return toResponse(salvo);
    }

    public List<ProdutoResponse> listar() {
        return produtoRepository.findAll().stream()
                .map(ProdutoResponse::toResponse)
                .toList();
    }
}
