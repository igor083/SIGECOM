package com.sigecom.controller.auth;

import com.sigecom.model.request.CadastroRequest;
import com.sigecom.model.request.LoginRequest;
import com.sigecom.model.response.LoginResponse;
import com.sigecom.model.response.UsuarioResponse;
import com.sigecom.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/cadastro")
    public ResponseEntity<UsuarioResponse> cadastro(@Valid @RequestBody CadastroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.cadastro(request));
    }
}
