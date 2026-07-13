package com.sigecom.controller;

import com.sigecom.model.request.venda.VendaRequest;
import com.sigecom.model.response.venda.CalculoVendaResponse;
import com.sigecom.model.response.venda.VendaResponse;
import com.sigecom.service.VendaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
