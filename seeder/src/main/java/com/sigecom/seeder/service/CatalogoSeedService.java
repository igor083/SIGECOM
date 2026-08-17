package com.sigecom.seeder.service;

import com.sigecom.seeder.domain.CategoriaFinanceira;
import com.sigecom.seeder.domain.CategoriaProduto;
import com.sigecom.seeder.domain.Produto;
import com.sigecom.seeder.domain.SeedRegistro.Recurso;
import com.sigecom.seeder.model.SeedResult;
import com.sigecom.seeder.repository.CategoriaFinanceiraRepository;
import com.sigecom.seeder.repository.CategoriaProdutoRepository;
import com.sigecom.seeder.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Semeia o cadastro base: categorias de produto, categorias financeiras e
 * o catalogo de produtos.
 *
 * Todas as tres etapas sao idempotentes por chave natural (nome, par
 * nome+tipo, nome). Registro que ja existe e reaproveitado sem sofrer
 * update: se alguem mudou o preco de um produto pela aplicacao, o seeder
 * respeita a mudanca.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogoSeedService {

    private final CategoriaProdutoRepository categoriaProdutoRepository;
    private final CategoriaFinanceiraRepository categoriaFinanceiraRepository;
    private final ProdutoRepository produtoRepository;
    private final SeedRegistroService registro;

    @Transactional
    public SeedResult semearCategoriasProduto() {
        int criados = 0;
        int ignorados = 0;

        for (String nome : SeedCatalogo.CATEGORIAS_PRODUTO) {
            if (categoriaProdutoRepository.findByNomeIgnoreCase(nome).isPresent()) {
                ignorados++;
                continue;
            }
            CategoriaProduto salva = categoriaProdutoRepository.save(
                    CategoriaProduto.builder().nome(nome).build());
            registro.marcar(Recurso.CATEGORIA_PRODUTO, salva.getId());
            criados++;
        }

        log.info("Categorias de produto: {} criadas, {} ja existiam.", criados, ignorados);
        return SeedResult.de("categorias-produto", criados, ignorados);
    }

    @Transactional
    public SeedResult semearCategoriasFinanceiras() {
        int criados = 0;
        int ignorados = 0;

        for (SeedCatalogo.CategoriaFinanceiraSeed def : SeedCatalogo.CATEGORIAS_FINANCEIRAS) {
            boolean existe = categoriaFinanceiraRepository
                    .findFirstByNomeIgnoreCaseAndTipo(def.nome(), def.tipo())
                    .isPresent();
            if (existe) {
                ignorados++;
                continue;
            }

            // protegida=false: categoria criada aqui e dado de teste e precisa
            // continuar editavel pelo CRUD do admin e removivel pela limpeza.
            CategoriaFinanceira salva = categoriaFinanceiraRepository.save(CategoriaFinanceira.builder()
                    .nome(def.nome())
                    .tipo(def.tipo())
                    .protegida(false)
                    .build());
            registro.marcar(Recurso.CATEGORIA_FINANCEIRA, salva.getId());
            criados++;
        }

        log.info("Categorias financeiras: {} criadas, {} ja existiam.", criados, ignorados);
        return SeedResult.de("categorias-financeiras", criados, ignorados);
    }

    @Transactional
    public SeedResult semearProdutos() {
        int criados = 0;
        int ignorados = 0;
        List<String> semCategoria = new ArrayList<>();

        for (SeedCatalogo.ProdutoSeed def : SeedCatalogo.PRODUTOS) {
            if (produtoRepository.findFirstByNomeIgnoreCase(def.nome()).isPresent()) {
                ignorados++;
                continue;
            }

            CategoriaProduto categoria = categoriaProdutoRepository
                    .findByNomeIgnoreCase(def.categoria())
                    .orElse(null);

            // Nao cria categoria implicitamente: manter as etapas explicitas
            // deixa claro no relatorio o que faltou rodar antes.
            if (categoria == null) {
                semCategoria.add(def.nome());
                continue;
            }

            Produto salvo = produtoRepository.save(Produto.builder()
                    .categoria(categoria)
                    .nome(def.nome())
                    .descricao(def.nome() + " - item de demonstracao")
                    .preco(def.precoDecimal())
                    .qtdEstoque(def.estoqueInicial())
                    .estoqueMinimo(def.estoqueMinimo())
                    .ativo(true)
                    .build());
            registro.marcar(Recurso.PRODUTO, salvo.getId());
            criados++;
        }

        String obs = semCategoria.isEmpty()
                ? null
                : "sem categoria correspondente (rode /seed/categorias-produto antes): " + semCategoria;

        log.info("Produtos: {} criados, {} ja existiam, {} sem categoria.",
                criados, ignorados, semCategoria.size());
        return SeedResult.de("produtos", criados, ignorados, obs);
    }

    @Transactional(readOnly = true)
    public List<Produto> carregarProdutosDoCatalogo() {
        List<Produto> produtos = new ArrayList<>();
        for (SeedCatalogo.ProdutoSeed def : SeedCatalogo.PRODUTOS) {
            produtoRepository.findFirstByNomeIgnoreCase(def.nome()).ifPresent(produtos::add);
        }
        return produtos;
    }
}
