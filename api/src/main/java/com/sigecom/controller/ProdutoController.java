package com.sigecom.controller;

import com.sigecom.domain.Produto;
import com.sigecom.model.request.produto.AjustarEstoqueRequest;
import com.sigecom.service.EstoqueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/produtos")
@RequiredArgsConstructor
public class ProdutoController {

    private final EstoqueService estoqueService;

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
}
