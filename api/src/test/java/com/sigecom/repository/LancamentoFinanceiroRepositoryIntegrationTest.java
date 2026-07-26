package com.sigecom.repository;

import com.sigecom.domain.CategoriaFinanceira;
import com.sigecom.domain.LancamentoFinanceiro;
import com.sigecom.domain.Usuario;
import com.sigecom.domain.enums.TipoLancamento;
import com.sigecom.domain.enums.TipoUsuario;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Teste de integração do LancamentoFinanceiroRepository contra Postgres real.
 *
 * Objetivo: validar que a query com ":tipo IS NULL" no enum NÃO estoura
 * "could not determine data type of parameter" no driver Postgres.
 *
 * Aponta para o banco EXCLUSIVO de teste (sigecom_test), nunca para o de
 * desenvolvimento. create-drop é seguro aqui porque o banco é descartável.
 *
 * Pré-requisitos:
 *   docker start sigecom-db
 *   docker exec sigecom-db psql -U postgres -c "CREATE DATABASE sigecom_test;"
 *
 * Execução (só roda com a system property explícita):
 *   mvnw.cmd test -Dtest=LancamentoFinanceiroRepositoryIntegrationTest -Dtest.postgres=true
 *
 * NÃO roda no "mvn clean test" padrão — não quebra o build do time.
 */
@SpringBootTest
@Transactional
@EnabledIfSystemProperty(named = "test.postgres", matches = "true")
class LancamentoFinanceiroRepositoryIntegrationTest {

    /**
     * Aponta ao banco sigecom_test (exclusivo de teste, nunca o de desenvolvimento).
     * create-drop é seguro aqui: o banco é descartável e recriado a cada execução.
     */
    @DynamicPropertySource
    static void postgresProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",
                () -> "jdbc:postgresql://localhost:5432/sigecom_test");
        registry.add("spring.datasource.username", () -> "postgres");
        registry.add("spring.datasource.password", () -> "postgres");
        registry.add("spring.datasource.driver-class-name",
                () -> "org.postgresql.Driver");
        registry.add("spring.jpa.database-platform",
                () -> "org.hibernate.dialect.PostgreSQLDialect");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    @Autowired
    private LancamentoFinanceiroRepository lancamentoRepository;

    @Autowired
    private EntityManager entityManager;

    private CategoriaFinanceira categoriaDespesaAluguel;
    private CategoriaFinanceira categoriaDespesaLuz;
    private CategoriaFinanceira categoriaReceita;

    @BeforeEach
    void setUp() {
        Usuario usuario = Usuario.builder()
                .nome("Teste")
                .email("teste-integracao@sigecom.com")
                .senhaHash("hash")
                .perfil(TipoUsuario.ADMIN)
                .build();
        entityManager.persist(usuario);

        // Duas categorias de despesa — testa categoriaId=null corretamente
        categoriaDespesaAluguel = new CategoriaFinanceira();
        categoriaDespesaAluguel.setNome("Aluguel");
        categoriaDespesaAluguel.setTipo(TipoLancamento.DESPESA);
        entityManager.persist(categoriaDespesaAluguel);

        categoriaDespesaLuz = new CategoriaFinanceira();
        categoriaDespesaLuz.setNome("Conta de Luz");
        categoriaDespesaLuz.setTipo(TipoLancamento.DESPESA);
        entityManager.persist(categoriaDespesaLuz);

        categoriaReceita = new CategoriaFinanceira();
        categoriaReceita.setNome("Venda");
        categoriaReceita.setTipo(TipoLancamento.RECEITA);
        entityManager.persist(categoriaReceita);

        // DESPESA — Aluguel (10h)
        entityManager.persist(LancamentoFinanceiro.builder()
                .usuario(usuario)
                .categoria(categoriaDespesaAluguel)
                .tipo(TipoLancamento.DESPESA)
                .descricao("Aluguel de julho")
                .valor(new BigDecimal("1500.00"))
                .dataHora(LocalDate.now().atTime(10, 0))
                .build());

        // DESPESA — Conta de Luz (11h)
        entityManager.persist(LancamentoFinanceiro.builder()
                .usuario(usuario)
                .categoria(categoriaDespesaLuz)
                .tipo(TipoLancamento.DESPESA)
                .descricao("Conta de luz de julho")
                .valor(new BigDecimal("350.00"))
                .dataHora(LocalDate.now().atTime(11, 0))
                .build());

        // RECEITA — Venda (14h)
        entityManager.persist(LancamentoFinanceiro.builder()
                .usuario(usuario)
                .categoria(categoriaReceita)
                .tipo(TipoLancamento.RECEITA)
                .descricao("Venda de mercadoria")
                .valor(new BigDecimal("3000.00"))
                .dataHora(LocalDate.now().atTime(14, 0))
                .build());

        entityManager.flush();
    }

    // ── IS NULL com enum no Postgres real ──────────────────────────

    @Test
    @DisplayName("tipo = null retorna todos os tipos (valida IS NULL com enum no Postgres)")
    void findAllFiltrado_TipoNull_RetornaTodosTipos() {
        LocalDateTime inicio = LocalDate.now().atStartOfDay();
        LocalDateTime fim = LocalDate.now().atTime(LocalTime.MAX);

        Page<LancamentoFinanceiro> resultado = lancamentoRepository.findAllFiltrado(
                inicio, fim, null, null,
                PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "dataHora"))
        );

        assertEquals(3, resultado.getTotalElements(),
                "Com tipo = null, deve retornar 2 despesas + 1 receita = 3");
    }

    @Test
    @DisplayName("tipo = DESPESA filtra corretamente")
    void findAllFiltrado_TipoDespesa_RetornaSoDespesas() {
        LocalDateTime inicio = LocalDate.now().atStartOfDay();
        LocalDateTime fim = LocalDate.now().atTime(LocalTime.MAX);

        Page<LancamentoFinanceiro> resultado = lancamentoRepository.findAllFiltrado(
                inicio, fim, TipoLancamento.DESPESA, null,
                PageRequest.of(0, 10)
        );

        assertEquals(2, resultado.getTotalElements(),
                "Apenas as 2 despesas (Aluguel + Conta de Luz)");
        resultado.getContent().forEach(l ->
                assertEquals(TipoLancamento.DESPESA, l.getTipo()));
    }

    // ── Filtro de categoria ───────────────────────────────────────

    @Test
    @DisplayName("categoriaId = null retorna todas as categorias do tipo (2 despesas)")
    void findAllFiltrado_CategoriaNull_RetornaTodasCategorias() {
        LocalDateTime inicio = LocalDate.now().atStartOfDay();
        LocalDateTime fim = LocalDate.now().atTime(LocalTime.MAX);

        Page<LancamentoFinanceiro> resultado = lancamentoRepository.findAllFiltrado(
                inicio, fim, TipoLancamento.DESPESA, null,
                PageRequest.of(0, 10)
        );

        assertEquals(2, resultado.getTotalElements(),
                "Sem filtro de categoria, deve retornar Aluguel + Conta de Luz");
    }

    @Test
    @DisplayName("categoriaId específico filtra corretamente")
    void findAllFiltrado_CategoriaEspecifica_FiltraCorreto() {
        LocalDateTime inicio = LocalDate.now().atStartOfDay();
        LocalDateTime fim = LocalDate.now().atTime(LocalTime.MAX);

        Page<LancamentoFinanceiro> resultado = lancamentoRepository.findAllFiltrado(
                inicio, fim, TipoLancamento.DESPESA,
                categoriaDespesaAluguel.getId(),
                PageRequest.of(0, 10)
        );

        assertEquals(1, resultado.getTotalElements(),
                "Com categoriaId de Aluguel, deve retornar apenas 1");
        assertEquals("Aluguel", resultado.getContent().get(0).getCategoria().getNome());
    }

    // ── Intervalo de data ─────────────────────────────────────────

    @Test
    @DisplayName("Intervalo de data exclui registros fora do período")
    void findAllFiltrado_IntervaloDiferente_RetornaVazio() {
        LocalDateTime inicio = LocalDate.now().minusDays(2).atStartOfDay();
        LocalDateTime fim = LocalDate.now().minusDays(1).atTime(LocalTime.MAX);

        Page<LancamentoFinanceiro> resultado = lancamentoRepository.findAllFiltrado(
                inicio, fim, null, null,
                PageRequest.of(0, 10)
        );

        assertEquals(0, resultado.getTotalElements());
    }

    @Test
    @DisplayName("Lançamento das 14h aparece no filtro do próprio dia (dataFim com LocalTime.MAX)")
    void findAllFiltrado_LancamentoDas14h_ApareceFiltrandoODia() {
        LocalDateTime inicio = LocalDate.now().atStartOfDay();
        LocalDateTime fim = LocalDate.now().atTime(LocalTime.MAX);

        Page<LancamentoFinanceiro> resultado = lancamentoRepository.findAllFiltrado(
                inicio, fim, TipoLancamento.RECEITA, null,
                PageRequest.of(0, 10)
        );

        assertEquals(1, resultado.getTotalElements(),
                "Lançamento das 14h deve aparecer quando dataFim usa LocalTime.MAX");
    }
}
