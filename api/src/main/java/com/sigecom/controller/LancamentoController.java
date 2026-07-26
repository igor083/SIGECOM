package com.sigecom.controller;

import com.sigecom.domain.enums.TipoLancamento;
import com.sigecom.model.request.lancamento.LancamentoRequest;
import com.sigecom.model.response.lancamento.LancamentoResponse;
import com.sigecom.service.LancamentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

// D-5: controller é camada fina — só traduz HTTP em chamada de service.
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

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<LancamentoResponse>> listar(
            @RequestParam(required = false) TipoLancamento tipo,
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @PageableDefault(size = 10, sort = "dataHora", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(lancamentoService.listar(tipo, categoriaId, dataInicio, dataFim, pageable));
    }
}
