package com.sigecom.controller;

import com.sigecom.domain.Produto;
import com.sigecom.domain.enums.FiltroEstoque;
import com.sigecom.model.request.produto.AjustarEstoqueRequest;
import com.sigecom.model.request.produto.CadastroProdutoRequest;
import com.sigecom.model.request.produto.EditarProdutoRequest;
import com.sigecom.model.response.produto.ProdutoResponse;
import com.sigecom.service.EstoqueService;
import com.sigecom.service.ProdutoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/produtos")
@RequiredArgsConstructor
public class ProdutoController {

    private final ProdutoService produtoService;
    private final EstoqueService estoqueService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')") // D-2: mesma regra de editar/excluir/ajustar
    public ResponseEntity<ProdutoResponse> cadastrar(@Valid @RequestBody CadastroProdutoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(produtoService.cadastrar(request));
    }

    /**
     * @param estoque recorte por nível de estoque (TODOS, BAIXO, NORMAL).
     *                Filtra no banco, junto com nome e categoria — a tela não
     *                pode filtrar sobre a página carregada, senão um produto
     *                em nível crítico na página 2 some do filtro "estoque baixo".
     */
    @GetMapping
    public ResponseEntity<Page<ProdutoResponse>> listar(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) FiltroEstoque estoque,
            Pageable pageable) {
        return ResponseEntity.ok(produtoService.listar(nome, categoriaId, estoque, pageable));
    }

    @GetMapping("/por-tipo/{categoriaId}")
    public ResponseEntity<Page<ProdutoResponse>> listarPorTipo(
            @PathVariable Long categoriaId, Pageable pageable) {
        return ResponseEntity.ok(produtoService.listarPorTipo(categoriaId, pageable));
    }

    /**
     * Ajusta a quantidade em estoque de um produto específico.
     * D-2 — Segurança: restrito a usuários com perfil ADMIN
     */
    @PostMapping("/{id}/ajustar-estoque")
    @PreAuthorize("hasRole('ADMIN')") // D-2
    public ResponseEntity<Produto> ajustarEstoque(
            @PathVariable Long id,
            @Valid @RequestBody AjustarEstoqueRequest request) {
        Produto produto = estoqueService.ajustarEstoque(id, request.quantidade());
        return ResponseEntity.ok(produto);
    }
    
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // D-2
    public ResponseEntity<ProdutoResponse> editar(
            @PathVariable Long id,
            @Valid @RequestBody EditarProdutoRequest request) {
        return ResponseEntity.ok(produtoService.editar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // D-2
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        produtoService.excluir(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/estoque-baixo")
    public ResponseEntity<Page<ProdutoResponse>> listarEstoqueBaixo(Pageable pageable) {
        return ResponseEntity.ok(produtoService.listarEstoqueBaixo(pageable));
    }
}
