package com.sigecom.controller;

import com.sigecom.model.request.categoria.CadastroCategoriaProdutoRequest;
import com.sigecom.model.request.categoria.EditCategoriaProdutoRequest;
import com.sigecom.model.response.categoria.CategoriaProdutoResponse;
import com.sigecom.service.CategoriaProdutoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categorias-produto")
@RequiredArgsConstructor
public class CategoriaProdutoController {

    private final CategoriaProdutoService categoriaProdutoService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoriaProdutoResponse> cadastrar(
            @Valid @RequestBody CadastroCategoriaProdutoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoriaProdutoService.cadastrar(request));
    }

    @GetMapping
    public ResponseEntity<List<CategoriaProdutoResponse>> listar() {
        return ResponseEntity.ok(categoriaProdutoService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoriaProdutoResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(categoriaProdutoService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoriaProdutoResponse> editar(
            @PathVariable Long id,
            @Valid @RequestBody EditCategoriaProdutoRequest request) {
        return ResponseEntity.ok(categoriaProdutoService.editar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        categoriaProdutoService.remover(id);
        return ResponseEntity.noContent().build();
    }
}
