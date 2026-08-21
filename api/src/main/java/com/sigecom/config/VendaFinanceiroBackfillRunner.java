package com.sigecom.config;

import com.sigecom.domain.CategoriaFinanceira;
import com.sigecom.domain.LancamentoFinanceiro;
import com.sigecom.domain.Venda;
import com.sigecom.domain.enums.FormaPagamentoLancamento;
import com.sigecom.domain.enums.TipoLancamento;
import com.sigecom.repository.CategoriaFinanceiraRepository;
import com.sigecom.repository.LancamentoFinanceiroRepository;
import com.sigecom.repository.VendaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

// Backfill de vendas registradas antes da integração venda -> financeiro
// (PR #27, commit 6b9c87e): essas vendas nunca ganharam um lançamento de
// receita porque o código que faz isso ainda não existia quando foram
// confirmadas. Para cada venda sem lançamento correspondente, cria a
// receita retroativa com a data da própria venda (não a data de hoje),
// pra ela cair no período certo do painel de saldo.
//
// Idempotente: roda em todo start, mas só cria o que ainda não existe
// (checa pela mesma convenção de descrição usada em
// VendaService.registrarReceitaNoFinanceiro, já que não há FK venda_id
// em lancamento_financeiro). Depois que todas as vendas antigas forem
// cobertas, vira um no-op.
@Slf4j
@Component
@RequiredArgsConstructor
@Order(1)
@ConditionalOnProperty(name = "spring.datasource.driver-class-name",
                       havingValue = "org.postgresql.Driver")
public class VendaFinanceiroBackfillRunner implements CommandLineRunner {

    private static final String CATEGORIA_VENDA = "Venda";

    private final VendaRepository vendaRepository;
    private final LancamentoFinanceiroRepository lancamentoFinanceiroRepository;
    private final CategoriaFinanceiraRepository categoriaFinanceiraRepository;

    @Override
    public void run(String... args) {
        CategoriaFinanceira categoria = categoriaFinanceiraRepository
                .findFirstByNomeIgnoreCaseAndTipo(CATEGORIA_VENDA, TipoLancamento.RECEITA)
                .orElse(null);

        if (categoria == null) {
            log.warn("Backfill venda->financeiro ignorado: categoria '{}' ainda não existe.", CATEGORIA_VENDA);
            return;
        }

        int criados = 0;
        int falhas = 0;
        for (Venda venda : vendaRepository.findAll()) {
            String descricao = "Venda #" + venda.getId();
            if (lancamentoFinanceiroRepository.existsByDescricao(descricao)) {
                continue;
            }

            // Nunca deixa uma venda problemática impedir o boot da aplicação:
            // loga e segue para a próxima, em vez de propagar a exceção.
            try {
                LancamentoFinanceiro lancamento = LancamentoFinanceiro.builder()
                        .usuario(venda.getUsuario())
                        .categoria(categoria)
                        .tipo(TipoLancamento.RECEITA)
                        .descricao(descricao)
                        .valor(venda.getTotal())
                        .formaPagamento(FormaPagamentoLancamento.fromTipoPagamento(venda.getTipoPagamento()))
                        .dataHora(venda.getDataHora())
                        .build();

                lancamentoFinanceiroRepository.save(lancamento);
                criados++;
            } catch (Exception e) {
                falhas++;
                log.error("Backfill venda->financeiro: falha ao criar receita da venda {}.", venda.getId(), e);
            }
        }

        if (criados > 0 || falhas > 0) {
            log.info("Backfill venda->financeiro: {} receita(s) retroativa(s) criada(s), {} falha(s).", criados, falhas);
        } else {
            log.debug("Backfill venda->financeiro: nada a fazer, todas as vendas já têm lançamento.");
        }
    }
}
