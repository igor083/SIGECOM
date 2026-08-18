package com.sigecom.service;

import com.sigecom.domain.CategoriaProduto;
import com.sigecom.domain.Produto;
import com.sigecom.domain.enums.FiltroEstoque;
import com.sigecom.model.request.produto.CadastroProdutoRequest;
import com.sigecom.model.request.produto.EditarProdutoRequest;
import com.sigecom.model.response.produto.ProdutoResponse;
import com.sigecom.repository.CategoriaProdutoRepository;
import com.sigecom.repository.ProdutoRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
                .imagemUrl(normalizarImagem(request.imagemUrl()))
                .preco(request.preco() != null ? request.preco() : BigDecimal.ZERO)
                .categoria(categoria)
                .qtdEstoque(request.qtdEstoqueInicial() != null ? request.qtdEstoqueInicial() : 0)
                .build();

        Produto salvo = produtoRepository.save(produto);
        log.info("Novo produto cadastrado: id={}, nome={}", salvo.getId(), salvo.getNome());

        return toResponse(salvo);
    }

    @Transactional(readOnly = true)
    public Page<ProdutoResponse> listar(String nome, Long categoriaId,
                                        FiltroEstoque filtroEstoque, Pageable pageable) {
        FiltroEstoque filtro = (filtroEstoque != null) ? filtroEstoque : FiltroEstoque.TODOS;
        return produtoRepository
                .findAllFiltrado(nome, categoriaId, filtro.incluiBaixo(), filtro.incluiNormal(), pageable)
                .map(ProdutoResponse::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ProdutoResponse> listarPorTipo(Long categoriaId, Pageable pageable) {
        return produtoRepository.findByAtivoTrueAndCategoriaId(categoriaId, pageable)
                .map(ProdutoResponse::toResponse);
    }
    
    
    @Transactional
    public ProdutoResponse editar(Long id, EditarProdutoRequest request) {
    		Produto produto = produtoRepository.findById(id)
    				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));
    		
    		CategoriaProduto categoria = categoriaProdutoRepository.findById(request.categoriaId())
    	            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada"));
    		
    		produto.setNome(request.nome().trim());
    	    produto.setDescricao(request.descricao());
    	    // campo ausente (null) mantem a imagem atual; string em branco apaga.
    	    // Sem isso, qualquer cliente que nao mande o campo zerava a foto calado.
    	    if (request.imagemUrl() != null) {
    	        produto.setImagemUrl(normalizarImagem(request.imagemUrl()));
    	    }
    	    produto.setPreco(request.preco());
    	    produto.setCategoria(categoria);
    	    produto.setEstoqueMinimo(request.estoqueMinimo());

    	    Produto salvo = produtoRepository.save(produto);
    	    log.info("Produto editado: id={}, nome={}", salvo.getId(), salvo.getNome());

    	    return toResponse(salvo);
    	}
    
    @Transactional
    public void excluir(Long id) {
    		Produto produto = produtoRepository.findById(id)
    				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));

    		// D-7: não excluir produto com movimentação de estoque ativa
    		if (produto.getQtdEstoque() > 0) {
    			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
    					"Não é possível excluir produto com estoque ativo");
    		}

    		produto.setAtivo(false);
    		produtoRepository.save(produto);
    		log.info("Produto desativado (soft delete): id={}", id);
    	}
    

    // SCRUM-160: campo em branco vira null, pra nao gravar string vazia
    // e o front conseguir distinguir "sem imagem" com um teste so.
    private String normalizarImagem(String imagemUrl) {
        if (imagemUrl == null || imagemUrl.isBlank()) return null;
        return imagemUrl.trim();
    }

    @Transactional(readOnly = true)
    public Page<ProdutoResponse> listarEstoqueBaixo(Pageable pageable) {
        return produtoRepository.findProdutosComEstoqueBaixo(pageable)
                .map(ProdutoResponse::toResponse);
    }
    
    
}
