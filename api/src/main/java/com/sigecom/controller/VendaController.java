package com.sigecom.controller;

import com.sigecom.model.request.venda.VendaRequest;
import com.sigecom.model.response.venda.CalculoVendaResponse;
import com.sigecom.model.response.venda.VendaResponse;
import com.sigecom.model.response.venda.VendaResumoResponse;
import com.sigecom.service.VendaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/vendas")
@RequiredArgsConstructor
public class VendaController {

    private final VendaService vendaService;

    /**
     * US-026 — Preview do total. O front chama a cada alteração do carrinho
     * para exibir subtotal, desconto total e total final calculados no servidor.
     */
    @PostMapping("/calcular")
    public ResponseEntity<CalculoVendaResponse> calcular(@Valid @RequestBody VendaRequest request) {
        return ResponseEntity.ok(vendaService.calcular(request));
    }

    /**
     * US-027 — Confirma a venda: persiste + baixa estoque atomicamente
     * e devolve o comprovante simplificado.
     */
    @PostMapping
    public ResponseEntity<VendaResponse> confirmar(@Valid @RequestBody VendaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vendaService.confirmar(request));
    }

    /**
     * Histórico de vendas paginado — usado pela tela de histórico do PDV.
     * Ordenação default: mais recente primeiro.
     */
    @GetMapping
    public ResponseEntity<Page<VendaResumoResponse>> listar(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @PageableDefault(size = 10, sort = "dataHora", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(vendaService.listar(dataInicio, dataFim, pageable));
    }
}
