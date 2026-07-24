package com.sigecom.controller;

import com.sigecom.model.request.lancamento.LancamentoRequest;
import com.sigecom.model.response.lancamento.LancamentoResponse;
import com.sigecom.service.LancamentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/lancamentos")
@RequiredArgsConstructor
public class LancamentoController {

    private final LancamentoService lancamentoService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LancamentoResponse> registrar(@Valid @RequestBody LancamentoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(lancamentoService.registrar(request));
    }
}
