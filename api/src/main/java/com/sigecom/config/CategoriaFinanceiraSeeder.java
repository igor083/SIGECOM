package com.sigecom.config;

import com.sigecom.domain.CategoriaFinanceira;
import com.sigecom.domain.enums.DescricaoLancamento;
import com.sigecom.repository.CategoriaFinanceiraRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Popula as categorias financeiras padrão na primeira vez que o sistema sobe.
 *
 * Idempotente: só insere se a tabela estiver completamente vazia.
 * Nomes definidos em NOMES — map estático e explícito, sem derivação
 * heurística do enum. Se um valor do enum não estiver no mapa o sistema
 * falha no boot com mensagem clara (não silencia o problema com nome sem acento).
 *
 * Não roda em teste: a condição verifica o driver do datasource.
 * Com H2 (driver org.h2.Driver) o bean não é criado.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "spring.datasource.driver-class-name",
                       havingValue = "org.postgresql.Driver")
public class CategoriaFinanceiraSeeder implements CommandLineRunner {

    private final CategoriaFinanceiraRepository categoriaFinanceiraRepository;

    /**
     * Nomes legíveis para cada descrição de lançamento.
     * Definidos explicitamente para garantir acentuação correta.
     * Se um valor de DescricaoLancamento for adicionado no futuro
     * sem entrada aqui, o boot falha com IllegalStateException.
     */
    private static final Map<DescricaoLancamento, String> NOMES =
            new EnumMap<>(DescricaoLancamento.class);

    static {
        NOMES.put(DescricaoLancamento.VENDA,              "Venda");
        NOMES.put(DescricaoLancamento.RECEBIMENTO_DIVIDA, "Recebimento de Dívida");
        NOMES.put(DescricaoLancamento.OUTRA_RECEITA,      "Outra Receita");
        NOMES.put(DescricaoLancamento.COMPRA_MERCADORIA,  "Compra de Mercadoria");
        NOMES.put(DescricaoLancamento.SALARIO,            "Salário");
        NOMES.put(DescricaoLancamento.ALUGUEL,            "Aluguel");
        NOMES.put(DescricaoLancamento.CONTA_LUZ,          "Conta de Luz");
        NOMES.put(DescricaoLancamento.CONTA_AGUA,         "Conta de Água");
        NOMES.put(DescricaoLancamento.INTERNET_TELEFONE,  "Internet e Telefone");
        NOMES.put(DescricaoLancamento.MANUTENCAO,         "Manutenção");
        NOMES.put(DescricaoLancamento.IMPOSTOS,           "Impostos");
        NOMES.put(DescricaoLancamento.FORNECEDORES,       "Fornecedores");
        NOMES.put(DescricaoLancamento.OUTRA_DESPESA,      "Outra Despesa");
    }

    @Override
    public void run(String... args) {
        if (categoriaFinanceiraRepository.count() > 0) {
            log.debug("Categorias financeiras já existem — seed ignorado.");
            return;
        }

        // Valida que todos os valores do enum estão no mapa antes de persistir.
        // Falha no boot se DescricaoLancamento cresceu sem atualizar NOMES.
        for (DescricaoLancamento desc : DescricaoLancamento.values()) {
            if (!NOMES.containsKey(desc)) {
                throw new IllegalStateException(
                        "CategoriaFinanceiraSeeder: nome não definido para " + desc.name() +
                        " — adicione a entrada em NOMES antes de subir o sistema.");
            }
        }

        List<CategoriaFinanceira> categorias = NOMES.entrySet().stream()
                .map(entry -> {
                    CategoriaFinanceira cat = new CategoriaFinanceira();
                    cat.setNome(entry.getValue());
                    cat.setTipo(entry.getKey().getTipo());
                    return cat;
                })
                .collect(Collectors.toList());

        categoriaFinanceiraRepository.saveAll(categorias);

        log.info("Seed de categorias financeiras: {} categorias criadas.", categorias.size());
    }
}
