package com.sigecom.controller;

import com.sigecom.model.request.fechamento.FechamentoRequest;
import com.sigecom.model.response.fechamento.FechamentoResponse;
import com.sigecom.service.FechamentoCaixaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/fechamentos")
@RequiredArgsConstructor

public class FechamentoCaixaController {
    
    private final FechamentoCaixaService fechamentoCaixaService;

    // devolve o do dia, senao automatico critério 1 da us
    @GetMapping("/hoje")
    public ResponseEntity<FechamentoResponse> doDia() {
        return ResponseEntity.ok(fechamentoCaixaService.obterDoDia(LocalDate.now()));
    }


    // só post, não tem rota de editar
    @PostMapping
    public ResponseEntity<FechamentoResponse> confirmar(@Valid @RequestBody FechamentoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(fechamentoCaixaService.confirmar(request));
    }

}
