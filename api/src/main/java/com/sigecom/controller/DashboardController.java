package com.sigecom.controller;

import com.sigecom.model.response.dashboard.MetaVendaDiariaResponse;
import com.sigecom.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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
}
