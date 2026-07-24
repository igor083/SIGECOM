package com.sigecom.controller;

import com.sigecom.domain.enums.TipoLancamento;
import com.sigecom.model.request.lancamento.CadastroCategoriaFinanceiraRequest;
import com.sigecom.model.request.lancamento.EditCategoriaFinanceiraRequest;
import com.sigecom.model.response.lancamento.CategoriaFinanceiraResponse;
import com.sigecom.service.CategoriaFinanceiraService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categorias-financeiras")
@RequiredArgsConstructor
public class CategoriaFinanceiraController {

    private final CategoriaFinanceiraService categoriaFinanceiraService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoriaFinanceiraResponse> cadastrar(
            @Valid @RequestBody CadastroCategoriaFinanceiraRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoriaFinanceiraService.cadastrar(request));
    }

    @GetMapping
    public ResponseEntity<List<CategoriaFinanceiraResponse>> listar(
            @RequestParam(required = false) TipoLancamento tipo) {
        return ResponseEntity.ok(categoriaFinanceiraService.listar(tipo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoriaFinanceiraResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(categoriaFinanceiraService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoriaFinanceiraResponse> editar(
            @PathVariable Long id,
            @Valid @RequestBody EditCategoriaFinanceiraRequest request) {
        return ResponseEntity.ok(categoriaFinanceiraService.editar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        categoriaFinanceiraService.remover(id);
        return ResponseEntity.noContent().build();
    }
}
