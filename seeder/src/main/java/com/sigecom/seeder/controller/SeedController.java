package com.sigecom.seeder.controller;

import com.sigecom.seeder.model.SeedReport;
import com.sigecom.seeder.model.SeedResult;
import com.sigecom.seeder.model.SeedStatus;
import com.sigecom.seeder.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints de geracao de dados de teste.
 *
 * Toda rota e idempotente: a resposta traz 'criados' e 'ignorados' por etapa,
 * e a segunda chamada seguida volta com criados=0.
 */
@Tag(name = "Seed", description = "Geracao idempotente de dados de teste")
@RestController
@RequestMapping("/seed")
@RequiredArgsConstructor
public class SeedController {

    private final SeedService seedService;
    private final UsuarioSeedService usuarioSeedService;
    private final CatalogoSeedService catalogoSeedService;
    private final LancamentoSeedService lancamentoSeedService;
    private final VendaSeedService vendaSeedService;
    private final FechamentoSeedService fechamentoSeedService;

    @Operation(summary = "Roda todas as etapas na ordem correta de dependencia")
    @PostMapping
    public ResponseEntity<SeedReport> semearTudo() {
        return ResponseEntity.ok(seedService.semearTudo());
    }

    @Operation(summary = "Fotografia do banco, separando dado de seed de dado real")
    @GetMapping("/status")
    public ResponseEntity<SeedStatus> status() {
        return ResponseEntity.ok(seedService.status());
    }

    @Operation(summary = "Remove apenas o que o seeder gerou; dado real fica intacto")
    @DeleteMapping
    public ResponseEntity<SeedReport> limpar() {
        return ResponseEntity.ok(seedService.limpar());
    }

    // ── Etapas individuais ────────────────────────────────────────

    @Operation(summary = "Usuarios de teste (@seed.sigecom.local)")
    @PostMapping("/usuarios")
    public ResponseEntity<SeedResult> usuarios() {
        return ResponseEntity.ok(usuarioSeedService.semear());
    }

    @Operation(summary = "Categorias de produto")
    @PostMapping("/categorias-produto")
    public ResponseEntity<SeedResult> categoriasProduto() {
        return ResponseEntity.ok(catalogoSeedService.semearCategoriasProduto());
    }

    @Operation(summary = "Categorias financeiras, incluindo a categoria 'Venda'")
    @PostMapping("/categorias-financeiras")
    public ResponseEntity<SeedResult> categoriasFinanceiras() {
        return ResponseEntity.ok(catalogoSeedService.semearCategoriasFinanceiras());
    }

    @Operation(summary = "Catalogo de produtos (exige as categorias de produto)")
    @PostMapping("/produtos")
    public ResponseEntity<SeedResult> produtos() {
        return ResponseEntity.ok(catalogoSeedService.semearProdutos());
    }

    @Operation(summary = "Despesas mensais e compras semanais do periodo")
    @PostMapping("/lancamentos")
    public ResponseEntity<SeedResult> lancamentos() {
        return ResponseEntity.ok(lancamentoSeedService.semear());
    }

    @Operation(summary = "Historico de vendas: itens, baixa de estoque e receita no financeiro")
    @PostMapping("/vendas")
    public ResponseEntity<SeedResult> vendas() {
        return ResponseEntity.ok(vendaSeedService.semear());
    }

    @Operation(summary = "Fechamento de caixa dos dias ja encerrados")
    @PostMapping("/fechamentos")
    public ResponseEntity<SeedResult> fechamentos() {
        return ResponseEntity.ok(fechamentoSeedService.semear());
    }

    // ── Consultas ─────────────────────────────────────────────────

    @Operation(summary = "Usuarios de teste disponiveis para login na aplicacao")
    @GetMapping("/usuarios")
    public ResponseEntity<List<String>> listarUsuarios() {
        return ResponseEntity.ok(usuarioSeedService.carregarUsuariosSeed().stream()
                .map(u -> u.getEmail() + " (" + u.getPerfil() + ")")
                .toList());
    }
}
