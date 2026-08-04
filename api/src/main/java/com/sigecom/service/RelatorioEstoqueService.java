package com.sigecom.service;

import com.sigecom.domain.Produto;
import com.sigecom.domain.enums.StatusEstoque;
import com.sigecom.model.response.relatorio.RelatorioEstoqueResponse;
import com.sigecom.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RelatorioEstoqueService {

    private final ProdutoRepository produtoRepository;

    private static final int ESCALA = 2;
    private static final RoundingMode ARREDONDAMENTO = RoundingMode.HALF_UP;

    public enum Ordenacao { QUANTIDADE_ASC, QUANTIDADE_DESC }

    @Transactional(readOnly = true)
    public RelatorioEstoqueResponse gerar(Long categoriaId, String busca, Ordenacao ordenacao) {
        String nome = (busca != null && !busca.isBlank()) ? busca.trim() : null;
        Sort sort = ordenacaoParaSort(ordenacao);

        List<Produto> produtos = produtoRepository.findParaRelatorioEstoque(categoriaId, nome, sort);

        List<RelatorioEstoqueResponse.ItemEstoque> itens = produtos.stream()
                .map(this::paraItem)
                .toList();

        RelatorioEstoqueResponse.Resumo resumo = montarResumo(itens);

        log.info("relatorio-estoque: categoria={} busca={} produtos={} alerta={} critico={} valor={}",
                categoriaId, nome, resumo.totalProdutos(), resumo.emAlerta(),
                resumo.emCritico(), resumo.valorTotalEstoque());

        return new RelatorioEstoqueResponse(resumo, itens);
    }

    private Sort ordenacaoParaSort(Ordenacao ordenacao) {
        Sort.Direction direcao = (ordenacao == Ordenacao.QUANTIDADE_DESC)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        return Sort.by(direcao, "qtdEstoque").and(Sort.by(Sort.Direction.ASC, "nome"));
    }

    private RelatorioEstoqueResponse.ItemEstoque paraItem(Produto produto) {
        int qtd = valorOuZero(produto.getQtdEstoque());
        int minimo = valorOuZero(produto.getEstoqueMinimo());
        BigDecimal preco = produto.getPreco() != null ? produto.getPreco() : BigDecimal.ZERO;
        BigDecimal valorEmEstoque = preco.multiply(BigDecimal.valueOf(qtd)).setScale(ESCALA, ARREDONDAMENTO);

        return new RelatorioEstoqueResponse.ItemEstoque(
                produto.getId(),
                produto.getNome(),
                produto.getCategoria().getId(),
                produto.getCategoria().getNome(),
                qtd,
                minimo,
                preco.setScale(ESCALA, ARREDONDAMENTO),
                valorEmEstoque,
                StatusEstoque.de(qtd, minimo)
        );
    }

    private RelatorioEstoqueResponse.Resumo montarResumo(List<RelatorioEstoqueResponse.ItemEstoque> itens) {
        long emAlerta = itens.stream().filter(i -> i.status() == StatusEstoque.ALERTA).count();
        long emCritico = itens.stream().filter(i -> i.status() == StatusEstoque.CRITICO).count();
        BigDecimal valorTotal = itens.stream()
                .map(RelatorioEstoqueResponse.ItemEstoque::valorEmEstoque)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(ESCALA, ARREDONDAMENTO);

        return new RelatorioEstoqueResponse.Resumo(itens.size(), emAlerta, emCritico, valorTotal);
    }

    private int valorOuZero(Integer valor) {
        return valor != null ? valor : 0;
    }
}
