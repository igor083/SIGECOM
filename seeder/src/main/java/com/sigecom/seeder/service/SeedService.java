package com.sigecom.seeder.service;

import com.sigecom.seeder.domain.*;
import com.sigecom.seeder.domain.SeedRegistro.Recurso;
import com.sigecom.seeder.model.SeedReport;
import com.sigecom.seeder.model.SeedResult;
import com.sigecom.seeder.model.SeedStatus;
import com.sigecom.seeder.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Predicate;

/**
 * Orquestra as etapas de seed, informa o estado do banco e faz a limpeza.
 *
 * A ordem das etapas nao e negociavel: produto depende de categoria de
 * produto, venda depende de produto + usuario + categoria "Venda", e o
 * fechamento le os totais que as etapas anteriores gravaram.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SeedService {

    private final UsuarioSeedService usuarioSeedService;
    private final CatalogoSeedService catalogoSeedService;
    private final LancamentoSeedService lancamentoSeedService;
    private final VendaSeedService vendaSeedService;
    private final FechamentoSeedService fechamentoSeedService;
    private final SeedRegistroService registro;

    private final UsuarioRepository usuarioRepository;
    private final CategoriaProdutoRepository categoriaProdutoRepository;
    private final CategoriaFinanceiraRepository categoriaFinanceiraRepository;
    private final ProdutoRepository produtoRepository;
    private final VendaRepository vendaRepository;
    private final ItemVendaRepository itemVendaRepository;
    private final LancamentoFinanceiroRepository lancamentoFinanceiroRepository;
    private final FechamentoCaixaRepository fechamentoCaixaRepository;

    @Value("${spring.datasource.url}")
    private String urlBanco;

    // ── Geracao ───────────────────────────────────────────────────

    public SeedReport semearTudo() {
        long inicio = System.currentTimeMillis();

        List<SeedResult> etapas = List.of(
                usuarioSeedService.semear(),
                catalogoSeedService.semearCategoriasProduto(),
                catalogoSeedService.semearCategoriasFinanceiras(),
                catalogoSeedService.semearProdutos(),
                lancamentoSeedService.semear(),
                vendaSeedService.semear(),
                fechamentoSeedService.semear()
        );

        SeedReport report = SeedReport.de(etapas, System.currentTimeMillis() - inicio);
        log.info("Seed completo: {} registros criados, {} ja existiam, em {}ms.",
                report.totalCriados(), report.totalIgnorados(), report.duracaoMs());
        return report;
    }

    // ── Status ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SeedStatus status() {
        return new SeedStatus(
                urlBanco,
                registro.quantidade(Recurso.USUARIO),
                usuarioRepository.count(),
                categoriaProdutoRepository.count(),
                categoriaFinanceiraRepository.count(),
                produtoRepository.count(),
                registro.quantidade(Recurso.VENDA),
                vendaRepository.count(),
                registro.quantidade(Recurso.LANCAMENTO),
                lancamentoFinanceiroRepository.count(),
                registro.quantidade(Recurso.FECHAMENTO),
                fechamentoCaixaRepository.count()
        );
    }

    // ── Limpeza ───────────────────────────────────────────────────

    /**
     * Remove o que o seeder criou, e so isso.
     *
     * A fonte da verdade e o livro-caixa (tabela seed_registro): so entra la
     * a linha que o seeder realmente inseriu. Cadastro que ele apenas
     * REAPROVEITOU - categoria, produto ou usuario que ja existiam quando ele
     * rodou - nunca e tocado.
     *
     * Em cima disso ainda vale uma guarda de integridade: registro que passou
     * a ser referenciado por dado real (produto que entrou numa venda do PDV,
     * categoria que ganhou lancamento manual) fica onde esta, e o relatorio
     * diz quantos foram mantidos e por que. Por isso a limpeza nunca falha por
     * violacao de chave estrangeira.
     *
     * Idempotente: rodar de novo devolve tudo zerado.
     */
    @Transactional
    public SeedReport limpar() {
        long inicio = System.currentTimeMillis();
        List<SeedResult> etapas = new ArrayList<>();

        // 1. Lancamentos - saem antes das categorias financeiras que apontam.
        etapas.add(remover("lancamentos", Recurso.LANCAMENTO,
                lancamentoFinanceiroRepository::findById,
                l -> true,
                lancamentoFinanceiroRepository::delete,
                null));

        // 2. Fechamentos de caixa.
        etapas.add(remover("fechamentos", Recurso.FECHAMENTO,
                fechamentoCaixaRepository::findById,
                f -> true,
                fechamentoCaixaRepository::delete,
                null));

        // 3. Vendas - os itens saem junto, por cascade/orphanRemoval.
        etapas.add(remover("vendas", Recurso.VENDA,
                vendaRepository::findById,
                v -> true,
                vendaRepository::delete,
                null));
        vendaRepository.flush();

        // 4. Produtos - so os que nenhuma venda referencia mais.
        etapas.add(remover("produtos", Recurso.PRODUTO,
                produtoRepository::findById,
                p -> !itemVendaRepository.existsByProdutoId(p.getId()),
                produtoRepository::delete,
                "por terem venda vinculada"));

        // 5. Categorias de produto orfas.
        etapas.add(remover("categorias-produto", Recurso.CATEGORIA_PRODUTO,
                categoriaProdutoRepository::findById,
                c -> !produtoRepository.existsByCategoriaId(c.getId()),
                categoriaProdutoRepository::delete,
                "por terem produto vinculado"));

        // 6. Categorias financeiras orfas e nao protegidas - mesma regra do
        //    CRUD da aplicacao.
        etapas.add(remover("categorias-financeiras", Recurso.CATEGORIA_FINANCEIRA,
                categoriaFinanceiraRepository::findById,
                c -> !c.isProtegida() && !lancamentoFinanceiroRepository.existsByCategoriaId(c.getId()),
                categoriaFinanceiraRepository::delete,
                "por serem protegidas ou terem lancamento vinculado"));

        // 7. Usuarios, por ultimo e so quando nada mais aponta para eles.
        etapas.add(remover("usuarios", Recurso.USUARIO,
                usuarioRepository::findById,
                u -> !vendaRepository.existsByUsuarioId(u.getId())
                     && !lancamentoFinanceiroRepository.existsByUsuarioId(u.getId())
                     && !fechamentoCaixaRepository.existsByUsuarioId(u.getId()),
                usuarioRepository::delete,
                "por terem registro vinculado"));

        long duracao = System.currentTimeMillis() - inicio;
        log.info("Limpeza concluida em {}ms.", duracao);
        return SeedReport.de(etapas, duracao);
    }

    /**
     * Percorre o que o livro-caixa diz que o seeder criou para um recurso e
     * apaga o que ainda pode ser apagado.
     *
     * O registro so sai do livro-caixa quando a linha correspondente e
     * removida de fato - registro mantido por ter dependente continua
     * anotado, e uma limpeza futura tenta de novo quando o dependente sumir.
     * Linha que ja nao existe mais (apagada pela aplicacao) tambem sai do
     * livro, para o contador nao mentir.
     */
    private <T> SeedResult remover(String rotulo,
                                   Recurso recurso,
                                   java.util.function.Function<Long, java.util.Optional<T>> buscar,
                                   Predicate<T> podeRemover,
                                   java.util.function.Consumer<T> apagar,
                                   String motivoMantido) {
        int removidos = 0;
        int mantidos = 0;

        for (Long id : registro.idsCriados(recurso)) {
            T alvo = buscar.apply(id).orElse(null);

            if (alvo == null) {
                registro.desmarcar(recurso, id);
                continue;
            }

            if (!podeRemover.test(alvo)) {
                mantidos++;
                continue;
            }

            apagar.accept(alvo);
            registro.desmarcar(recurso, id);
            removidos++;
        }

        String observacao = removidos + " removido(s)";
        if (mantidos > 0) {
            observacao += ", " + mantidos + " mantido(s) "
                    + (motivoMantido != null ? motivoMantido : "por dependencia");
        }
        return SeedResult.de(rotulo, 0, 0, observacao);
    }
}
