package com.sigecom.service;

import com.sigecom.domain.CategoriaFinanceira;
import com.sigecom.domain.LancamentoFinanceiro;
import com.sigecom.domain.Usuario;
import com.sigecom.domain.enums.TipoLancamento;
import com.sigecom.model.request.lancamento.LancamentoRequest;
import com.sigecom.model.response.lancamento.LancamentoResponse;
import com.sigecom.model.response.lancamento.SaldoResponse;
import com.sigecom.repository.CategoriaFinanceiraRepository;
import com.sigecom.repository.LancamentoFinanceiroRepository;
import com.sigecom.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
public class LancamentoService {

    private final LancamentoFinanceiroRepository lancamentoFinanceiroRepository;
    private final CategoriaFinanceiraRepository categoriaFinanceiraRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public LancamentoResponse registrar(LancamentoRequest request) {
        Usuario responsavel = usuarioAutenticado();

        CategoriaFinanceira categoria = categoriaFinanceiraRepository.findById(request.categoriaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Categoria financeira não encontrada"));

        if (categoria.getTipo() != request.tipo()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A categoria informada não pertence ao tipo do lançamento");
        }
        if (request.descricao().getTipo() != request.tipo()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A descrição informada não pertence ao tipo do lançamento");
        }

        LancamentoFinanceiro lancamento = LancamentoFinanceiro.builder()
                .usuario(responsavel)
                .categoria(categoria)
                .tipo(request.tipo())
                .descricao(request.descricao())
                .valor(request.valor())
                .dataHora(resolverDataHora(request.data()))
                .build();

        LancamentoFinanceiro salvo = lancamentoFinanceiroRepository.save(lancamento);
        log.info("Lançamento {} ({}) registrado por {} — valor={}",
                salvo.getId(), salvo.getTipo(), responsavel.getEmail(), salvo.getValor());

        return LancamentoResponse.toResponse(salvo);
    }

    // D-5: toda lógica de filtro e conversão de data fica no service,
    //       nunca no controller nem no repository.
    @Transactional(readOnly = true)
    public Page<LancamentoResponse> listar(TipoLancamento tipo,
                                           Long categoriaId,
                                           LocalDate dataInicio,
                                           LocalDate dataFim,
                                           Pageable pageable) {
        // Nunca passa null ao repository: parâmetro nulo em "(:param IS NULL OR ...)" para
        // tipo LocalDateTime no Postgres não tem tipo definido e estoura 500.
        // Usa limites amplos em vez de null — mesmo padrão do VendaService.listar().
        LocalDateTime inicio = (dataInicio != null)
                ? dataInicio.atStartOfDay()
                : LocalDate.of(1970, 1, 1).atStartOfDay();
        LocalDateTime fim = (dataFim != null)
                ? dataFim.atTime(LocalTime.MAX)  // atStartOfDay() perderia os lançamentos do próprio dia
                : LocalDateTime.now().plusYears(100);

        // A conversão .map() acontece dentro da transação para evitar
        // LazyInitializationException na relação LAZY da categoria.
        return lancamentoFinanceiroRepository
                .findAllFiltrado(inicio, fim, tipo, categoriaId, pageable)
                .map(LancamentoResponse::toResponse);
    }

    /**
     * Calcula o saldo operacional da loja no período informado.
     *
     * O saldo é derivado: receitas − despesas somados em SQL.
     * Não existe coluna de saldo — duas fontes de verdade divergem (R-01).
     *
     * Regras de período:
     *  - inicio nulo  → primeiro dia do mês corrente
     *  - fim nulo     → hoje ao final do dia (atTime(LocalTime.MAX))
     *  - inicio > fim → 400 com mensagem em português
     *
     * O COALESCE na query garante que período sem lançamentos devolve 0,
     * nunca null (null.subtract() estouraria NullPointerException).
     */
    @Transactional(readOnly = true)
    public SaldoResponse calcularSaldo(LocalDate inicio, LocalDate fim) {
        LocalDate hoje = LocalDate.now();

        // Período padrão: mês corrente quando não informado
        LocalDate inicioEfetivo = (inicio != null) ? inicio : hoje.withDayOfMonth(1);
        LocalDate fimEfetivo    = (fim    != null) ? fim    : hoje;

        if (inicioEfetivo.isAfter(fimEfetivo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A data de início não pode ser posterior à data de fim");
        }

        // Converte para LocalDateTime — mesma regra do listar():
        //   atTime(LocalTime.MAX) no fim para não perder lançamentos do próprio dia.
        LocalDateTime dtInicio = inicioEfetivo.atStartOfDay();
        LocalDateTime dtFim    = fimEfetivo.atTime(LocalTime.MAX); // não usar atStartOfDay() aqui

        BigDecimal totalReceitas = lancamentoFinanceiroRepository
                .somarPorTipo(TipoLancamento.RECEITA, dtInicio, dtFim);
        BigDecimal totalDespesas = lancamentoFinanceiroRepository
                .somarPorTipo(TipoLancamento.DESPESA, dtInicio, dtFim);

        // COALESCE na query devolve 0 quando não há linhas, mas defendemos
        // contra null aqui também caso a query seja alterada no futuro.
        BigDecimal receitas = (totalReceitas != null) ? totalReceitas : BigDecimal.ZERO;
        BigDecimal despesas = (totalDespesas != null) ? totalDespesas : BigDecimal.ZERO;

        return new SaldoResponse(
                receitas,
                despesas,
                receitas.subtract(despesas),
                inicioEfetivo,
                fimEfetivo
        );
    }

    private LocalDateTime resolverDataHora(LocalDate data) {
        return data.isEqual(LocalDate.now())
                ? LocalDateTime.now()
                : data.atStartOfDay();
    }

    private Usuario usuarioAutenticado() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Usuário não identificado"));
    }
}
