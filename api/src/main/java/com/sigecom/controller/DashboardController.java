package com.sigecom.controller;

import com.sigecom.domain.enums.PeriodoRelatorio;
import com.sigecom.model.response.dashboard.DashboardDesempenhoResponse;
import com.sigecom.model.response.dashboard.MetaVendaDiariaResponse;
import com.sigecom.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/meta-diaria")
    public ResponseEntity<MetaVendaDiariaResponse> metaVendaDiaria() {
        return ResponseEntity.ok(dashboardService.metaVendaDiaria());
    }

    @GetMapping("/desempenho")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardDesempenhoResponse> desempenho(
            @RequestParam(required = false) PeriodoRelatorio periodo) {
        return ResponseEntity.ok(dashboardService.desempenho(periodo));
    }
}
