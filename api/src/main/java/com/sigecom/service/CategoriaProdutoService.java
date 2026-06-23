package com.sigecom.service;

import com.sigecom.domain.CategoriaProduto;
import com.sigecom.model.request.categoria.CadastroCategoriaProdutoRequest;
import com.sigecom.model.request.categoria.EditCategoriaProdutoRequest;
import com.sigecom.model.response.categoria.CategoriaProdutoResponse;
import com.sigecom.repository.CategoriaProdutoRepository;
import com.sigecom.repository.ProdutoRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static com.sigecom.model.response.categoria.CategoriaProdutoResponse.toResponse;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoriaProdutoService {

    private final CategoriaProdutoRepository categoriaProdutoRepository;
    private final ProdutoRepository produtoRepository;

    @Transactional
    public CategoriaProdutoResponse cadastrar(CadastroCategoriaProdutoRequest request) {
        String nome = request.nome().trim();
        if (categoriaProdutoRepository.existsByNomeIgnoreCase(nome)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma categoria com este nome");
        }

        CategoriaProduto categoria = new CategoriaProduto();
        categoria.setNome(nome);

        CategoriaProduto salva = categoriaProdutoRepository.save(categoria);
        log.info("Nova categoria cadastrada: id={}, nome={}", salva.getId(), salva.getNome());

        return toResponse(salva);
    }

    public List<CategoriaProdutoResponse> listar() {
        return categoriaProdutoRepository.findAll().stream()
                .map(CategoriaProdutoResponse::toResponse)
                .toList();
    }

    public CategoriaProdutoResponse buscarPorId(Long id) {
        return toResponse(buscarEntidade(id));
    }

    @Transactional
    public CategoriaProdutoResponse editar(Long id, EditCategoriaProdutoRequest request) {
        CategoriaProduto categoria = buscarEntidade(id);
        String nome = request.nome().trim();

        if (!nome.equalsIgnoreCase(categoria.getNome())
                && categoriaProdutoRepository.existsByNomeIgnoreCase(nome)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma categoria com este nome");
        }

        categoria.setNome(nome);
        CategoriaProduto atualizada = categoriaProdutoRepository.save(categoria);
        log.info("Categoria atualizada: id={}, nome={}", atualizada.getId(), atualizada.getNome());

        return toResponse(atualizada);
    }

    @Transactional
    public void remover(Long id) {
        CategoriaProduto categoria = buscarEntidade(id);

        if (produtoRepository.existsByCategoriaId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Não é possível remover uma categoria que possui produtos vinculados");
        }

        categoriaProdutoRepository.delete(categoria);
        log.info("Categoria removida: id={}, nome={}", categoria.getId(), categoria.getNome());
    }

    private CategoriaProduto buscarEntidade(Long id) {
        return categoriaProdutoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada"));
    }
}
