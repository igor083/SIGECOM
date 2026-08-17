package com.sigecom.seeder.service;

import com.sigecom.seeder.config.SeedProperties;
import com.sigecom.seeder.domain.FechamentoCaixa;
import com.sigecom.seeder.domain.SeedRegistro.Recurso;
import com.sigecom.seeder.domain.Usuario;
import com.sigecom.seeder.domain.enums.TipoLancamento;
import com.sigecom.seeder.model.SeedResult;
import com.sigecom.seeder.repository.FechamentoCaixaRepository;
import com.sigecom.seeder.repository.LancamentoFinanceiroRepository;
import com.sigecom.seeder.repository.VendaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Random;

/**
 * Fecha o caixa dos dias ja encerrados da janela.
 *
 * Os totais nao sao inventados: sao lidos do proprio banco com as mesmas
 * agregacoes do FechamentoCaixaService da aplicacao original
 * (saldo = receitas - despesas; esperado = fundo de troco + saldo). Assim o
 * historico gerado bate com o que a tela de caixa recalcularia.
 *
 * Idempotencia pela data: existe no maximo um fechamento por dia, entao a
 * propria data ja e a chave. Dia fechado de verdade pela aplicacao tambem e
 * respeitado - o seeder nunca sobrescreve.
 *
 * O dia corrente fica de fora de proposito: caixa so fecha depois que o dia
 * acaba, e fechar hoje travaria a operacao de quem estiver testando o PDV.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FechamentoSeedService {

    private static final BigDecimal FUNDO_TROCO = new BigDecimal("100.00");
    private static final LocalTime HORA_FECHAMENTO = LocalTime.of(19, 0);

    private final FechamentoCaixaRepository fechamentoCaixaRepository;
    private final VendaRepository vendaRepository;
    private final LancamentoFinanceiroRepository lancamentoFinanceiroRepository;
    private final UsuarioSeedService usuarioSeedService;
    private final SeedRegistroService registro;
    private final SeedProperties props;

    @Transactional
    public SeedResult semear() {
        List<Usuario> usuarios = usuarioSeedService.carregarUsuariosSeed();
        if (usuarios.isEmpty()) {
            return SeedResult.de("fechamentos", 0, 0,
                    "nenhum usuario de teste no banco - rode /seed/usuarios antes");
        }
        Usuario responsavel = usuarios.get(0);

        LocalDate hoje = LocalDate.now();
        int criados = 0;
        int ignorados = 0;

        for (int offset = props.getDias() - 1; offset >= 1; offset--) {
            LocalDate dia = hoje.minusDays(offset);

            if (fechamentoCaixaRepository.existsByDataFechamento(dia)) {
                ignorados++;
                continue;
            }

            LocalDateTime inicio = dia.atStartOfDay();
            LocalDateTime fim = dia.atTime(LocalTime.MAX);

            BigDecimal totalVendas = vendaRepository.somarTotalPorPeriodo(inicio, fim);
            BigDecimal totalReceitas = lancamentoFinanceiroRepository
                    .somarPorTipo(TipoLancamento.RECEITA, inicio, fim);
            BigDecimal totalDespesas = lancamentoFinanceiroRepository
                    .somarPorTipo(TipoLancamento.DESPESA, inicio, fim);

            // Dia sem nenhum movimento nao gera fechamento: caixa que nao
            // abriu nao fecha, e a linha so poluiria o historico.
            if (ehZero(totalVendas) && ehZero(totalReceitas) && ehZero(totalDespesas)) {
                continue;
            }

            BigDecimal saldoCalculado = totalReceitas.subtract(totalDespesas);
            BigDecimal saldoEsperado = FUNDO_TROCO.add(saldoCalculado);

            FechamentoCaixa salvo = fechamentoCaixaRepository.save(FechamentoCaixa.builder()
                    .usuario(responsavel)
                    .dataFechamento(dia)
                    .totalVendas(totalVendas)
                    .totalReceitas(totalReceitas)
                    .totalDespesas(totalDespesas)
                    .saldoCalculado(saldoCalculado)
                    .fundoTroco(FUNDO_TROCO)
                    .saldoEsperado(saldoEsperado)
                    .valorFisicoInformado(valorConferido(dia, saldoEsperado))
                    .fechadoEm(dia.atTime(HORA_FECHAMENTO))
                    .build());
            registro.marcar(Recurso.FECHAMENTO, salvo.getId());
            criados++;
        }

        log.info("Fechamentos de caixa: {} criados, {} ja existiam.", criados, ignorados);
        return SeedResult.de("fechamentos", criados, ignorados,
                "o dia corrente fica sempre em aberto");
    }

    /**
     * Valor fisico contado na gaveta. Bate com o esperado na maioria dos
     * dias; em ~1 de cada 7 sai uma pequena divergencia, para a tela de
     * conferencia ter caso real de sobra e de falta.
     */
    private BigDecimal valorConferido(LocalDate dia, BigDecimal saldoEsperado) {
        Random rnd = new Random(props.getRandomSeed() * 17L + dia.toEpochDay());
        if (rnd.nextInt(7) != 0) {
            return saldoEsperado;
        }
        BigDecimal diferenca = BigDecimal.valueOf(rnd.nextInt(4000) - 2000, 2);
        return saldoEsperado.add(diferenca);
    }

    private boolean ehZero(BigDecimal valor) {
        return valor == null || valor.compareTo(BigDecimal.ZERO) == 0;
    }
}
