package com.sigecom.seeder.service;

import com.sigecom.seeder.domain.enums.TipoLancamento;
import com.sigecom.seeder.domain.enums.TipoUsuario;

import java.math.BigDecimal;
import java.util.List;

/**
 * Catalogo fixo dos dados de teste.
 *
 * Tudo aqui e deterministico e serve como chave natural de idempotencia:
 * usuario e identificado pelo email, categoria de produto pelo nome,
 * categoria financeira pelo par (nome, tipo) e produto pelo nome. Reexecutar
 * o seeder nunca duplica nada porque a busca acontece por essas chaves.
 *
 * Para aumentar o volume de dados, edite estas listas - nao ha nada
 * aleatorio na composicao do catalogo.
 */
public final class SeedCatalogo {

    private SeedCatalogo() {}

    /**
     * Dominio dos usuarios de teste. Deixa obvio, em qualquer tela da
     * aplicacao, que aquele registro veio do seeder - todo movimento gerado
     * (venda, lancamento, fechamento) sai no nome de um usuario daqui.
     *
     * Nao e o criterio da limpeza: quem manda nisso e o livro-caixa
     * (SeedRegistroService), que sabe exatamente quais linhas o seeder
     * inseriu e quais ele apenas reaproveitou.
     */
    public static final String DOMINIO_SEED = "@seed.sigecom.local";

    /** Prefixo das descricoes de lancamento geradas que nao vem de venda. */
    public static final String PREFIXO_LANCAMENTO = "[seed] ";

    /** Categoria de receita usada pela venda - mesma que o VendaService procura. */
    public static final String CATEGORIA_VENDA = "Venda";

    // ── Usuarios ──────────────────────────────────────────────────

    public record UsuarioSeed(String nome, String email, TipoUsuario perfil) {}

    public static final List<UsuarioSeed> USUARIOS = List.of(
            new UsuarioSeed("Gerente de Teste",   "gerente"  + DOMINIO_SEED, TipoUsuario.ADMIN),
            new UsuarioSeed("Rafael Santos",      "rafael"   + DOMINIO_SEED, TipoUsuario.FUNCIONARIO),
            new UsuarioSeed("Juliana Prado",      "juliana"  + DOMINIO_SEED, TipoUsuario.FUNCIONARIO),
            new UsuarioSeed("Marcos Vieira",      "marcos"   + DOMINIO_SEED, TipoUsuario.FUNCIONARIO),
            new UsuarioSeed("Carla Nogueira",     "carla"    + DOMINIO_SEED, TipoUsuario.FUNCIONARIO)
    );

    // ── Categorias de produto ─────────────────────────────────────

    public static final List<String> CATEGORIAS_PRODUTO = List.of(
            "Bebidas",
            "Mercearia",
            "Hortifruti",
            "Limpeza",
            "Higiene",
            "Padaria",
            "Frios e Laticinios",
            "Doces e Snacks"
    );

    // ── Categorias financeiras ────────────────────────────────────

    public record CategoriaFinanceiraSeed(String nome, TipoLancamento tipo) {}

    /**
     * Inclui a categoria "Venda", exigida em runtime pelo VendaService da
     * aplicacao original. A aplicacao nao a cria mais sozinha - o admin cria
     * pela tela de categorias financeiras, ou o seeder cria aqui.
     */
    public static final List<CategoriaFinanceiraSeed> CATEGORIAS_FINANCEIRAS = List.of(
            new CategoriaFinanceiraSeed(CATEGORIA_VENDA,          TipoLancamento.RECEITA),
            new CategoriaFinanceiraSeed("Recebimento de Divida",  TipoLancamento.RECEITA),
            new CategoriaFinanceiraSeed("Outra Receita",          TipoLancamento.RECEITA),
            new CategoriaFinanceiraSeed("Compra de Mercadoria",   TipoLancamento.DESPESA),
            new CategoriaFinanceiraSeed("Salario",                TipoLancamento.DESPESA),
            new CategoriaFinanceiraSeed("Aluguel",                TipoLancamento.DESPESA),
            new CategoriaFinanceiraSeed("Conta de Luz",           TipoLancamento.DESPESA),
            new CategoriaFinanceiraSeed("Conta de Agua",          TipoLancamento.DESPESA),
            new CategoriaFinanceiraSeed("Internet e Telefone",    TipoLancamento.DESPESA),
            new CategoriaFinanceiraSeed("Manutencao",             TipoLancamento.DESPESA),
            new CategoriaFinanceiraSeed("Impostos",               TipoLancamento.DESPESA),
            new CategoriaFinanceiraSeed("Fornecedores",           TipoLancamento.DESPESA),
            new CategoriaFinanceiraSeed("Outra Despesa",          TipoLancamento.DESPESA)
    );

    // ── Produtos ──────────────────────────────────────────────────

    public record ProdutoSeed(String nome,
                              String categoria,
                              String preco,
                              int estoqueInicial,
                              int estoqueMinimo) {

        public BigDecimal precoDecimal() {
            return new BigDecimal(preco);
        }
    }

    /**
     * Estoque inicial folgado de proposito: as vendas geradas dao baixa e o
     * catalogo precisa aguentar a janela inteira sem zerar. Alguns itens tem
     * estoque baixo de proposito, para a tela de alerta de estoque ter o que
     * mostrar.
     */
    public static final List<ProdutoSeed> PRODUTOS = List.of(
            // Bebidas
            new ProdutoSeed("Agua Mineral 500ml",        "Bebidas",   "2.50",  1200, 100),
            new ProdutoSeed("Refrigerante Cola 2L",      "Bebidas",   "9.90",   600,  60),
            new ProdutoSeed("Suco de Laranja 1L",        "Bebidas",   "7.50",   400,  40),
            new ProdutoSeed("Cerveja Lata 350ml",        "Bebidas",  "4.20",  1500, 150),
            new ProdutoSeed("Energetico 250ml",          "Bebidas",  "8.90",    90,  30),

            // Mercearia
            new ProdutoSeed("Arroz Branco 5kg",          "Mercearia", "24.90",  500,  50),
            new ProdutoSeed("Feijao Carioca 1kg",        "Mercearia", "8.50",   600,  60),
            new ProdutoSeed("Oleo de Soja 900ml",        "Mercearia", "6.90",   450,  45),
            new ProdutoSeed("Acucar Refinado 1kg",       "Mercearia", "4.80",   500,  50),
            new ProdutoSeed("Cafe Torrado 500g",         "Mercearia", "18.90",  350,  40),
            new ProdutoSeed("Macarrao Espaguete 500g",   "Mercearia", "4.20",   400,  40),

            // Hortifruti
            new ProdutoSeed("Banana Prata kg",           "Hortifruti", "6.90",  300,  40),
            new ProdutoSeed("Tomate kg",                 "Hortifruti", "8.90",  250,  40),
            new ProdutoSeed("Batata Inglesa kg",         "Hortifruti", "5.90",  300,  40),
            new ProdutoSeed("Cebola kg",                 "Hortifruti", "5.50",   60,  30),

            // Limpeza
            new ProdutoSeed("Detergente Neutro 500ml",   "Limpeza",   "2.90",   500,  50),
            new ProdutoSeed("Sabao em Po 1kg",           "Limpeza",   "14.90",  300,  30),
            new ProdutoSeed("Agua Sanitaria 1L",         "Limpeza",   "5.50",   350,  35),
            new ProdutoSeed("Desinfetante 2L",           "Limpeza",   "11.90",  200,  25),

            // Higiene
            new ProdutoSeed("Sabonete 90g",              "Higiene",   "2.20",   700,  70),
            new ProdutoSeed("Shampoo 350ml",             "Higiene",   "16.90",  200,  25),
            new ProdutoSeed("Creme Dental 90g",          "Higiene",   "5.90",   400,  40),
            new ProdutoSeed("Papel Higienico 4un",       "Higiene",   "12.90",  300,  30),

            // Padaria
            new ProdutoSeed("Pao Frances kg",            "Padaria",   "16.90",  200,  30),
            new ProdutoSeed("Pao de Forma 500g",         "Padaria",   "9.90",   180,  25),
            new ProdutoSeed("Bolo de Cenoura fatia",     "Padaria",   "6.50",    45,  20),

            // Frios e Laticinios
            new ProdutoSeed("Leite Integral 1L",         "Frios e Laticinios", "5.90",  800,  80),
            new ProdutoSeed("Queijo Mussarela kg",       "Frios e Laticinios", "42.90", 120,  20),
            new ProdutoSeed("Presunto Fatiado 200g",     "Frios e Laticinios", "12.90", 150,  20),
            new ProdutoSeed("Iogurte Natural 170g",      "Frios e Laticinios", "3.90",  400,  40),
            new ProdutoSeed("Manteiga 200g",             "Frios e Laticinios", "13.90",  55,  25),

            // Doces e Snacks
            new ProdutoSeed("Chocolate ao Leite 90g",    "Doces e Snacks", "7.90",  400,  40),
            new ProdutoSeed("Biscoito Recheado 130g",    "Doces e Snacks", "3.50",  600,  60),
            new ProdutoSeed("Batata Chips 100g",         "Doces e Snacks", "9.90",  250,  30),
            new ProdutoSeed("Bala Sortida 500g",         "Doces e Snacks", "15.90",  70,  25)
    );

    // ── Despesas recorrentes ──────────────────────────────────────

    /**
     * Despesa que se repete todo mes num dia fixo. A descricao gerada carrega
     * o competencia ("[seed] Aluguel 2026-07"), o que a torna unica por mes e
     * serve de chave de idempotencia.
     */
    public record DespesaSeed(String categoria, String rotulo, String valor, int diaDoMes) {

        public BigDecimal valorDecimal() {
            return new BigDecimal(valor);
        }
    }

    public static final List<DespesaSeed> DESPESAS_MENSAIS = List.of(
            new DespesaSeed("Aluguel",             "Aluguel",              "4500.00", 5),
            new DespesaSeed("Salario",             "Folha de pagamento",   "9800.00", 5),
            new DespesaSeed("Conta de Luz",        "Energia eletrica",      "870.00", 10),
            new DespesaSeed("Conta de Agua",       "Agua e esgoto",         "240.00", 12),
            new DespesaSeed("Internet e Telefone", "Internet e telefone",   "310.00", 15),
            new DespesaSeed("Impostos",            "Impostos do mes",      "2150.00", 20),
            new DespesaSeed("Manutencao",          "Manutencao predial",    "480.00", 22)
    );

    /**
     * Compra de mercadoria: acontece toda semana, no dia da semana indicado
     * (1 = segunda). Descricao carrega a data, garantindo unicidade semanal.
     */
    public static final DespesaSeed COMPRA_SEMANAL =
            new DespesaSeed("Compra de Mercadoria", "Reposicao de estoque", "3200.00", 1);
}
