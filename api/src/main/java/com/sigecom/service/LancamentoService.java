package com.sigecom.service;

import com.sigecom.domain.CategoriaFinanceira;
import com.sigecom.domain.LancamentoFinanceiro;
import com.sigecom.domain.Usuario;
import com.sigecom.domain.enums.TipoLancamento;
import com.sigecom.model.request.lancamento.LancamentoRequest;
import com.sigecom.model.response.lancamento.LancamentoResponse;
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
