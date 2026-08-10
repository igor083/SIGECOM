package com.sigecom.service;

import com.sigecom.domain.FechamentoCaixa;
import com.sigecom.domain.Usuario;
import com.sigecom.domain.enums.TipoLancamento;
import com.sigecom.model.request.fechamento.FechamentoRequest;
import com.sigecom.model.response.fechamento.FechamentoResponse;
import com.sigecom.repository.FechamentoCaixaRepository;
import com.sigecom.repository.LancamentoFinanceiroRepository;
import com.sigecom.repository.UsuarioRepository;
import com.sigecom.repository.VendaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;


@Slf4j
@Service
@RequiredArgsConstructor
public class FechamentoCaixaService {

    private final FechamentoCaixaRepository fechamentoCaixaRepository;
    private final VendaRepository vendaRepository;
    private final LancamentoFinanceiroRepository lancamentoFinanceiroRepository;
    private final UsuarioRepository usuarioRepository;

    // Fundo padrao da loja. Loja diferente usa fundo diferente, por isso e configuravel.
    @Value("${sigecom.caixa.fundo-troco}")
    private BigDecimal fundoTrocoPadrao;


    // totalVendas só para mostrar na tela. saldo usa receita - despesa
    @Transactional(readOnly = true)
    public FechamentoResponse calcularPreview(LocalDate data) {
        return calcularPreview(data, fundoTrocoPadrao);
    }

    // O GET nao sabe qual fundo o operador vai informar, entao usa o padrao.
    // O confirmar recalcula com o fundo que veio no request (SCRUM-161).
    @Transactional(readOnly = true)
    public FechamentoResponse calcularPreview(LocalDate data, BigDecimal fundoTroco) {
        LocalDateTime inicio = data.atStartOfDay();
        LocalDateTime fim = data.atTime(LocalTime.MAX);

        BigDecimal totalVendas = vendaRepository.somarTotalPorPeriodo(inicio, fim);
        BigDecimal totalReceitas = lancamentoFinanceiroRepository.somarPorTipo(TipoLancamento.RECEITA, inicio, fim);
        BigDecimal totalDespesas = lancamentoFinanceiroRepository.somarPorTipo(TipoLancamento.DESPESA, inicio, fim);

        // resultado do dia: continua existindo, mas nao e dinheiro na gaveta
        BigDecimal saldoCalculado = totalReceitas.subtract(totalDespesas);
        // o que se espera contar na gaveta: nunca fica negativo por causa do fundo
        BigDecimal saldoEsperado = fundoTroco.add(totalReceitas).subtract(totalDespesas);

        return new FechamentoResponse(null, data, totalVendas, totalReceitas, totalDespesas,
                saldoCalculado, fundoTroco, saldoEsperado, null, null, null);
    }

    // permite saber qual estado tá, pra mostrar o fechamento feito
    @Transactional(readOnly = true)
    public FechamentoResponse obterDoDia(LocalDate data) {
        return fechamentoCaixaRepository.findByDataFechamento(data)
                .map(FechamentoResponse::toResponse)
                .orElseGet(() -> calcularPreview(data));
    }
    
    // confere se já tem algum fechamento, se não calcula os totais e salva (R-02)
    @Transactional
    public FechamentoResponse confirmar(FechamentoRequest request) {
        LocalDate hoje = LocalDate.now();

        if (fechamentoCaixaRepository.existsByDataFechamento(hoje)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O caixa já foi fechado hoje, não pode ser alterado");
        }

        Usuario responsavel = usuarioAutenticado();
        // vale o fundo informado pelo operador, nao o padrao: se ele abriu com 50, e 50
        FechamentoResponse preview = calcularPreview(hoje, request.fundoTroco());

        FechamentoCaixa fechamento = FechamentoCaixa.builder()
                .usuario(responsavel)
                .dataFechamento(hoje)
                .totalVendas(preview.totalVendas())
                .totalReceitas(preview.totalReceitas())
                .totalDespesas(preview.totalDespesas())
                .saldoCalculado(preview.saldoCalculado())
                .fundoTroco(preview.fundoTroco())
                .saldoEsperado(preview.saldoEsperado())
                .valorFisicoInformado(request.valorFisicoInformado())
                .fechadoEm(LocalDateTime.now())
                .build();

        FechamentoCaixa salvo = fechamentoCaixaRepository.save(fechamento);
        log.info("Fechamento {} confirmado por {} — saldo={}",
                salvo.getId(), responsavel.getEmail(), salvo.getSaldoCalculado());

        return FechamentoResponse.toResponse(salvo);
    }

    private Usuario usuarioAutenticado() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Usuário não identificado"));
    }
}
