package com.sigecom.controller;

import com.sigecom.model.request.dashboard.AtualizarMetaDiariaRequest;
import com.sigecom.model.response.dashboard.MetaVendaDiariaResponse;
import com.sigecom.service.DashboardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/meta-diaria")
    public ResponseEntity<MetaVendaDiariaResponse> metaVendaDiaria() {
        return ResponseEntity.ok(dashboardService.metaVendaDiaria());
    }

    /**
     * Atualiza a meta diária de vendas (única para todos os funcionários).
     * D-2 — Segurança: restrito a usuários com perfil ADMIN
     */
    @PutMapping("/meta-diaria")
    @PreAuthorize("hasRole('ADMIN')") // D-2
    public ResponseEntity<MetaVendaDiariaResponse> atualizarMetaDiaria(
            @Valid @RequestBody AtualizarMetaDiariaRequest request) {
        return ResponseEntity.ok(dashboardService.atualizarMetaDiaria(request.valor()));
    }
}
