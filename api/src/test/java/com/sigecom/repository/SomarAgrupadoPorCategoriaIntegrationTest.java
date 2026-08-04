package com.sigecom.repository;

import com.sigecom.domain.CategoriaFinanceira;
import com.sigecom.domain.LancamentoFinanceiro;
import com.sigecom.domain.Usuario;
import com.sigecom.domain.enums.TipoLancamento;
import com.sigecom.domain.enums.TipoUsuario;
import com.sigecom.repository.projection.CategoriaFinanceiraAgregado;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// Prova que somarAgrupadoPorCategoria roda corretamente contra o Postgres real.
// Mockito nao detecta erros de SQL (alias errado, tipo incompativel com a projecao),
// que so aparecem em execucao. Por isso este teste existe.
//
// Banco: sigecom_test (nunca sigecom — regra de seguranca 1 do AGENTS.md).
// Execucao: mvnw.cmd test -Dtest=SomarAgrupadoPorCategoriaIntegrationTest -Dtest.postgres=true
@SpringBootTest
@Transactional
@EnabledIfSystemProperty(named = "test.postgres", matches = "true")
class SomarAgrupadoPorCategoriaIntegrationTest {

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

    private CategoriaFinanceira categoriaVenda;
    private CategoriaFinanceira categoriaAluguel;
    private CategoriaFinanceira categoriaLuz;

    @BeforeEach
    void setUp() {
        Usuario usuario = Usuario.builder()
                .nome("Teste")
                .email("integracao-relatorio@sigecom.com")
                .senhaHash("hash")
                .perfil(TipoUsuario.ADMIN)
                .build();
        entityManager.persist(usuario);

        categoriaVenda = new CategoriaFinanceira();
        categoriaVenda.setNome("Venda");
        categoriaVenda.setTipo(TipoLancamento.RECEITA);
        entityManager.persist(categoriaVenda);

        categoriaAluguel = new CategoriaFinanceira();
        categoriaAluguel.setNome("Aluguel");
        categoriaAluguel.setTipo(TipoLancamento.DESPESA);
        entityManager.persist(categoriaAluguel);

        categoriaLuz = new CategoriaFinanceira();
        categoriaLuz.setNome("Conta de Luz");
        categoriaLuz.setTipo(TipoLancamento.DESPESA);
        entityManager.persist(categoriaLuz);

        entityManager.persist(lancamento(usuario, categoriaVenda, TipoLancamento.RECEITA, "3000.00", 14, "Venda de produtos"));
        entityManager.persist(lancamento(usuario, categoriaAluguel, TipoLancamento.DESPESA, "1500.00", 10, "Aluguel da loja"));
        entityManager.persist(lancamento(usuario, categoriaLuz, TipoLancamento.DESPESA, "350.00", 11, "Conta de luz"));
        // segundo lancamento na mesma categoria — testa que o SUM agrega corretamente
        entityManager.persist(lancamento(usuario, categoriaAluguel, TipoLancamento.DESPESA, "200.00", 12, "Aluguel da loja"));

        entityManager.flush();
    }

    private LancamentoFinanceiro lancamento(Usuario u, CategoriaFinanceira cat,
                                            TipoLancamento tipo, String valor, int hora,
                                            String descricao) {
        return LancamentoFinanceiro.builder()
                .usuario(u)
                .categoria(cat)
                .tipo(tipo)
                .descricao(descricao)
                .valor(new BigDecimal(valor))
                .dataHora(LocalDate.now().atTime(hora, 0))
                .build();
    }

    @Test
    @DisplayName("retorna 3 linhas e soma corretamente (Aluguel tem 2 lancamentos)")
    void somarAgrupado_SemFiltroCategoria_AgregaPorCategoriaNoPostgres() {
        var ini = LocalDate.now().atStartOfDay();
        var fim = LocalDate.now().atTime(LocalTime.MAX);

        List<CategoriaFinanceiraAgregado> resultado =
                lancamentoRepository.somarAgrupadoPorCategoria(ini, fim, null);

        // 3 categorias distintas
        assertThat(resultado).hasSize(3);

        CategoriaFinanceiraAgregado aluguel = resultado.stream()
                .filter(a -> "Aluguel".equals(a.getCategoriaNome()))
                .findFirst().orElseThrow();

        // SUM deve ter somado os dois lancamentos de Aluguel
        assertThat(aluguel.getTotal()).isEqualByComparingTo("1700.00");
        assertThat(aluguel.getTipo()).isEqualTo(TipoLancamento.DESPESA);
    }

    @Test
    @DisplayName("filtro por categoriaId retorna apenas a categoria pedida")
    void somarAgrupado_ComCategoriaId_FiltraNoPostgres() {
        var ini = LocalDate.now().atStartOfDay();
        var fim = LocalDate.now().atTime(LocalTime.MAX);

        List<CategoriaFinanceiraAgregado> resultado =
                lancamentoRepository.somarAgrupadoPorCategoria(ini, fim, categoriaLuz.getId());

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getCategoriaNome()).isEqualTo("Conta de Luz");
        assertThat(resultado.get(0).getTotal()).isEqualByComparingTo("350.00");
        assertThat(resultado.get(0).getTipo()).isEqualTo(TipoLancamento.DESPESA);
    }

    @Test
    @DisplayName("periodo sem lancamentos retorna lista vazia (sem NullPointerException)")
    void somarAgrupado_PeriodoVazio_RetornaListaVazia() {
        var ini = LocalDate.now().minusDays(10).atStartOfDay();
        var fim = LocalDate.now().minusDays(5).atTime(LocalTime.MAX);

        List<CategoriaFinanceiraAgregado> resultado =
                lancamentoRepository.somarAgrupadoPorCategoria(ini, fim, null);

        assertThat(resultado).isEmpty();
    }

    @Test
    @DisplayName("lancamento das 14h aparece com dataFim usando LocalTime.MAX")
    void somarAgrupado_LancamentoDas14h_ApareceFiltrandoODia() {
        var ini = LocalDate.now().atStartOfDay();
        var fim = LocalDate.now().atTime(LocalTime.MAX);

        List<CategoriaFinanceiraAgregado> resultado =
                lancamentoRepository.somarAgrupadoPorCategoria(ini, fim, categoriaVenda.getId());

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getTotal()).isEqualByComparingTo("3000.00");
    }
}
