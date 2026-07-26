package com.sigecom.config;

import com.sigecom.domain.CategoriaFinanceira;
import com.sigecom.domain.enums.TipoLancamento;
import com.sigecom.repository.CategoriaFinanceiraRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

// so cria as categorias se a tabela estiver vazia
// nao roda nos testes porque eles usam H2
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "spring.datasource.driver-class-name",
                       havingValue = "org.postgresql.Driver")
public class CategoriaFinanceiraSeeder implements CommandLineRunner {

    private final CategoriaFinanceiraRepository categoriaFinanceiraRepository;

    private static CategoriaFinanceira categoria(String nome, TipoLancamento tipo) {
        CategoriaFinanceira cat = new CategoriaFinanceira();
        cat.setNome(nome);
        cat.setTipo(tipo);
        return cat;
    }

    @Override
    public void run(String... args) {
        if (categoriaFinanceiraRepository.count() > 0) {
            log.debug("Categorias financeiras já existem — seed ignorado.");
            return;
        }

        List<CategoriaFinanceira> categorias = List.of(
                categoria("Venda",                 TipoLancamento.RECEITA),
                categoria("Recebimento de Dívida", TipoLancamento.RECEITA),
                categoria("Outra Receita",         TipoLancamento.RECEITA),
                categoria("Compra de Mercadoria",  TipoLancamento.DESPESA),
                categoria("Salário",               TipoLancamento.DESPESA),
                categoria("Aluguel",               TipoLancamento.DESPESA),
                categoria("Conta de Luz",          TipoLancamento.DESPESA),
                categoria("Conta de Água",         TipoLancamento.DESPESA),
                categoria("Internet e Telefone",   TipoLancamento.DESPESA),
                categoria("Manutenção",            TipoLancamento.DESPESA),
                categoria("Impostos",              TipoLancamento.DESPESA),
                categoria("Fornecedores",          TipoLancamento.DESPESA),
                categoria("Outra Despesa",         TipoLancamento.DESPESA)
        );

        categoriaFinanceiraRepository.saveAll(categorias);

        log.info("Seed de categorias financeiras: {} categorias criadas.", categorias.size());
    }
}
