package com.sigecom.seeder.service;

import com.sigecom.seeder.config.SeedProperties;
import com.sigecom.seeder.domain.CategoriaFinanceira;
import com.sigecom.seeder.domain.LancamentoFinanceiro;
import com.sigecom.seeder.domain.SeedRegistro.Recurso;
import com.sigecom.seeder.domain.Usuario;
import com.sigecom.seeder.domain.enums.TipoLancamento;
import com.sigecom.seeder.model.SeedResult;
import com.sigecom.seeder.repository.CategoriaFinanceiraRepository;
import com.sigecom.seeder.repository.LancamentoFinanceiroRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Gera as despesas do periodo: as mensais fixas (aluguel, folha, contas) e a
 * compra de mercadoria semanal.
 *
 * Idempotencia pela descricao: cada lancamento gerado recebe uma descricao
 * unica que carrega a competencia - "[seed] Aluguel 2026-07",
 * "[seed] Reposicao de estoque 2026-07-14". Reexecutar so cria a competencia
 * que ainda faltava.
 *
 * As receitas nao aparecem aqui: elas nascem das vendas, em VendaSeedService,
 * exatamente como na aplicacao original.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LancamentoSeedService {

    private static final DateTimeFormatter COMPETENCIA_MES = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final DateTimeFormatter COMPETENCIA_DIA = DateTimeFormatter.ISO_LOCAL_DATE;

    private final LancamentoFinanceiroRepository lancamentoFinanceiroRepository;
    private final CategoriaFinanceiraRepository categoriaFinanceiraRepository;
    private final UsuarioSeedService usuarioSeedService;
    private final SeedRegistroService registro;
    private final SeedProperties props;

    @Transactional
    public SeedResult semear() {
        List<Usuario> usuarios = usuarioSeedService.carregarUsuariosSeed();
        if (usuarios.isEmpty()) {
            return SeedResult.de("lancamentos", 0, 0,
                    "nenhum usuario de teste no banco - rode /seed/usuarios antes");
        }
        // Despesa e ato administrativo: sai sempre no nome do gerente.
        Usuario responsavel = usuarios.get(0);

        LocalDate hoje = LocalDate.now();
        LocalDate inicio = hoje.minusDays(props.getDias() - 1L);

        int criados = 0;
        int ignorados = 0;
        List<String> semCategoria = new ArrayList<>();

        // ── Despesas mensais fixas ──
        YearMonth mesAtual = YearMonth.from(inicio);
        YearMonth ultimoMes = YearMonth.from(hoje);
        while (!mesAtual.isAfter(ultimoMes)) {
            for (SeedCatalogo.DespesaSeed def : SeedCatalogo.DESPESAS_MENSAIS) {
                int dia = Math.min(def.diaDoMes(), mesAtual.lengthOfMonth());
                LocalDate data = mesAtual.atDay(dia);

                // Fora da janela ou ainda no futuro: nao lanca.
                if (data.isBefore(inicio) || data.isAfter(hoje)) {
                    continue;
                }

                String descricao = SeedCatalogo.PREFIXO_LANCAMENTO
                        + def.rotulo() + " " + mesAtual.format(COMPETENCIA_MES);

                Resultado r = registrar(descricao, def, data, responsavel, semCategoria);
                criados += r.criado() ? 1 : 0;
                ignorados += r.ignorado() ? 1 : 0;
            }
            mesAtual = mesAtual.plusMonths(1);
        }

        // ── Compra de mercadoria semanal ──
        SeedCatalogo.DespesaSeed compra = SeedCatalogo.COMPRA_SEMANAL;
        for (LocalDate data = inicio; !data.isAfter(hoje); data = data.plusDays(1)) {
            if (data.getDayOfWeek() != DayOfWeek.of(compra.diaDoMes())) {
                continue;
            }

            String descricao = SeedCatalogo.PREFIXO_LANCAMENTO
                    + compra.rotulo() + " " + data.format(COMPETENCIA_DIA);

            Resultado r = registrar(descricao, compra, data, responsavel, semCategoria);
            criados += r.criado() ? 1 : 0;
            ignorados += r.ignorado() ? 1 : 0;
        }

        String obs = semCategoria.isEmpty()
                ? null
                : "sem categoria financeira correspondente (rode /seed/categorias-financeiras antes): "
                  + semCategoria.stream().distinct().toList();

        log.info("Lancamentos de despesa: {} criados, {} ja existiam.", criados, ignorados);
        return SeedResult.de("lancamentos", criados, ignorados, obs);
    }

    private record Resultado(boolean criado, boolean ignorado) {}

    private Resultado registrar(String descricao,
                                SeedCatalogo.DespesaSeed def,
                                LocalDate data,
                                Usuario responsavel,
                                List<String> semCategoria) {

        if (lancamentoFinanceiroRepository.existsByDescricao(descricao)) {
            return new Resultado(false, true);
        }

        CategoriaFinanceira categoria = categoriaFinanceiraRepository
                .findFirstByNomeIgnoreCaseAndTipo(def.categoria(), TipoLancamento.DESPESA)
                .orElse(null);

        if (categoria == null) {
            semCategoria.add(def.categoria());
            return new Resultado(false, false);
        }

        LancamentoFinanceiro salvo = lancamentoFinanceiroRepository.save(LancamentoFinanceiro.builder()
                .usuario(responsavel)
                .categoria(categoria)
                .tipo(TipoLancamento.DESPESA)
                .descricao(descricao)
                .valor(def.valorDecimal())
                // 8h: antes do primeiro slot de venda, para o saldo do dia
                // ficar na ordem cronologica que a tela espera.
                .dataHora(data.atTime(8, 0))
                .build());
        registro.marcar(Recurso.LANCAMENTO, salvo.getId());

        return new Resultado(true, false);
    }
}
