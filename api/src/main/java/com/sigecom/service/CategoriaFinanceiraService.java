package com.sigecom.service;

import com.sigecom.domain.CategoriaFinanceira;
import com.sigecom.domain.enums.TipoLancamento;
import com.sigecom.model.request.lancamento.CadastroCategoriaFinanceiraRequest;
import com.sigecom.model.request.lancamento.EditCategoriaFinanceiraRequest;
import com.sigecom.model.response.lancamento.CategoriaFinanceiraResponse;
import com.sigecom.repository.CategoriaFinanceiraRepository;
import com.sigecom.repository.LancamentoFinanceiroRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static com.sigecom.model.response.lancamento.CategoriaFinanceiraResponse.toResponse;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoriaFinanceiraService {

    private final CategoriaFinanceiraRepository categoriaFinanceiraRepository;
    private final LancamentoFinanceiroRepository lancamentoFinanceiroRepository;

    @Transactional
    public CategoriaFinanceiraResponse cadastrar(CadastroCategoriaFinanceiraRequest request) {
        String nome = request.nome().trim();
        if (categoriaFinanceiraRepository.existsByNomeIgnoreCaseAndTipo(nome, request.tipo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Já existe uma categoria com este nome para o tipo informado");
        }

        CategoriaFinanceira categoria = new CategoriaFinanceira();
        categoria.setNome(nome);
        categoria.setTipo(request.tipo());

        CategoriaFinanceira salva = categoriaFinanceiraRepository.save(categoria);
        log.info("Nova categoria financeira: id={}, nome={}, tipo={}",
                salva.getId(), salva.getNome(), salva.getTipo());

        return toResponse(salva);
    }

    public List<CategoriaFinanceiraResponse> listar(TipoLancamento tipo) {
        List<CategoriaFinanceira> categorias = (tipo == null)
                ? categoriaFinanceiraRepository.findAll()
                : categoriaFinanceiraRepository.findByTipo(tipo);
        return categorias.stream().map(CategoriaFinanceiraResponse::toResponse).toList();
    }

    public CategoriaFinanceiraResponse buscarPorId(Long id) {
        return toResponse(buscarEntidade(id));
    }

    @Transactional
    public CategoriaFinanceiraResponse editar(Long id, EditCategoriaFinanceiraRequest request) {
        CategoriaFinanceira categoria = buscarEntidade(id);

        if (categoria.isProtegida()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Categorias do sistema não podem ser editadas");
        }

        String nome = request.nome().trim();
        // tipo é opcional no request — quando ausente, mantém o tipo atual
        TipoLancamento novoTipo = (request.tipo() != null) ? request.tipo() : categoria.getTipo();

        boolean nomeMudou = !nome.equalsIgnoreCase(categoria.getNome());
        boolean tipoMudou = novoTipo != categoria.getTipo();

        // Alterar o tipo quebraria a consistência tipo-lançamento dos registros
        // já existentes (registrar() exige categoria.tipo == lancamento.tipo).
        if (tipoMudou && lancamentoFinanceiroRepository.existsByCategoriaId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Não é possível alterar o tipo de uma categoria que possui lançamentos vinculados");
        }

        // A identidade única é (nome, tipo): revalida se qualquer um dos dois mudou.
        if ((nomeMudou || tipoMudou)
                && categoriaFinanceiraRepository.existsByNomeIgnoreCaseAndTipo(nome, novoTipo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Já existe uma categoria com este nome para o tipo informado");
        }

        categoria.setNome(nome);
        categoria.setTipo(novoTipo);
        CategoriaFinanceira atualizada = categoriaFinanceiraRepository.save(categoria);
        log.info("Categoria financeira atualizada: id={}, nome={}, tipo={}",
                atualizada.getId(), atualizada.getNome(), atualizada.getTipo());

        return toResponse(atualizada);
    }

    @Transactional
    public void remover(Long id) {
        CategoriaFinanceira categoria = buscarEntidade(id);

        if (categoria.isProtegida()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Categorias do sistema não podem ser removidas");
        }

        if (lancamentoFinanceiroRepository.existsByCategoriaId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Não é possível remover uma categoria que possui lançamentos vinculados");
        }

        categoriaFinanceiraRepository.delete(categoria);
        log.info("Categoria financeira removida: id={}, nome={}", categoria.getId(), categoria.getNome());
    }

    private CategoriaFinanceira buscarEntidade(Long id) {
        return categoriaFinanceiraRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Categoria financeira não encontrada"));
    }
}
