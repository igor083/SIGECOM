package com.sigecom.service;

import com.sigecom.domain.Produto;
import com.sigecom.domain.enums.StatusEstoque;
import com.sigecom.model.response.relatorio.RelatorioReposicaoResponse;
import com.sigecom.repository.ItemVendaRepository;
import com.sigecom.repository.ProdutoRepository;
import com.sigecom.repository.projection.MovimentacaoProdutoAgregado;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// D-5: a conta de reposicao mora toda aqui; o RelatorioController so repassa os parametros
@Slf4j
@Service
@RequiredArgsConstructor
public class ReposicaoEstoqueService {

    private final ProdutoRepository produtoRepository;
    private final ItemVendaRepository itemVendaRepository;

    private static final int ESCALA = 2;
    private static final RoundingMode ARREDONDAMENTO = RoundingMode.HALF_UP;

    // giro por dia costuma ser fracao pequena, 2 casas jogaria a conta fora
    private static final int ESCALA_INTERNA = 6;

    @Transactional(readOnly = true)
    public RelatorioReposicaoResponse gerar(Long categoriaId, int janelaDias, int coberturaDias) {
        validarJanela(janelaDias, coberturaDias);

        LocalDate hoje = LocalDate.now();
        // janela inclui o dia de hoje, por isso o -1: 30 dias sao hoje mais os 29 anteriores
        LocalDate dataInicio = hoje.minusDays(janelaDias - 1L);
        LocalDateTime inicio = dataInicio.atStartOfDay();
        LocalDateTime fim = hoje.atTime(LocalTime.MAX);

        Map<Long, Long> vendidoPorProduto = vendasDoPeriodo(inicio, fim, categoriaId);

        // sem ordenacao no banco: quem manda na ordem final e o porUrgencia(), que ja desempata por nome
        List<Produto> produtos = produtoRepository.findParaRelatorioEstoque(
                categoriaId, null, Sort.unsorted());

        List<RelatorioReposicaoResponse.ItemReposicao> itens = new ArrayList<>();
        for (Produto produto : produtos) {
            RelatorioReposicaoResponse.ItemReposicao item = paraItem(
                    produto,
                    vendidoPorProduto.getOrDefault(produto.getId(), 0L),
                    janelaDias,
                    coberturaDias);
            if (item != null) {
                itens.add(item);
            }
        }

        itens.sort(porUrgencia());

        RelatorioReposicaoResponse.Resumo resumo = montarResumo(
                itens, janelaDias, coberturaDias, dataInicio, hoje);

        log.info("relatorio-reposicao: categoria={} janela={} cobertura={} produtos={} unidades={} valor={}",
                categoriaId, janelaDias, coberturaDias, resumo.produtosParaRepor(),
                resumo.unidadesSugeridas(), resumo.valorEstimadoPrecoVenda());

        return new RelatorioReposicaoResponse(resumo, itens);
    }

    // teto de 365 pra conta nao estourar o int e devolver sugestao negativa em silencio
    private static final int LIMITE_DIAS = 365;

    private void validarJanela(int janelaDias, int coberturaDias) {
        // janela é o denominador do giro: zero ou negativo quebraria a divisão
        if (janelaDias < 1 || janelaDias > LIMITE_DIAS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A janela de análise precisa ser de 1 a 365 dias");
        }
        if (coberturaDias < 1 || coberturaDias > LIMITE_DIAS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A cobertura desejada precisa ser de 1 a 365 dias");
        }
    }

    private Map<Long, Long> vendasDoPeriodo(LocalDateTime inicio, LocalDateTime fim, Long categoriaId) {
        Map<Long, Long> porProduto = new HashMap<>();
        // produtoId vai null de proposito: aqui o recorte é a loja inteira, ou a categoria
        for (MovimentacaoProdutoAgregado agregado :
                itemVendaRepository.agregarPorProduto(inicio, fim, null, categoriaId)) {
            porProduto.put(agregado.produtoId(), agregado.unidades() != null ? agregado.unidades() : 0L);
        }
        return porProduto;
    }

    private RelatorioReposicaoResponse.ItemReposicao paraItem(Produto produto,
                                                              long unidadesVendidas,
                                                              int janelaDias,
                                                              int coberturaDias) {
        int qtd = valorOuZero(produto.getQtdEstoque());
        int minimo = valorOuZero(produto.getEstoqueMinimo());

        BigDecimal giroDiario = BigDecimal.valueOf(unidadesVendidas)
                .divide(BigDecimal.valueOf(janelaDias), ESCALA_INTERNA, ARREDONDAMENTO);

        // divido só no fim pra não arrastar erro de arredondamento do giro pra dentro da sugestão
        BigDecimal numerador = BigDecimal.valueOf(unidadesVendidas)
                .multiply(BigDecimal.valueOf(coberturaDias))
                .subtract(BigDecimal.valueOf((long) qtd * janelaDias));
        // não existe meia unidade de compra, sobra sempre vira uma unidade a mais
        int sugestao = numerador
                .divide(BigDecimal.valueOf(janelaDias), 0, RoundingMode.CEILING)
                // exact pra estourar em vez de truncar calado se a conta passar do int
                .intValueExact();

        // quem já está no mínimo ou abaixo entra mesmo sem giro, repondo até o mínimo
        if (sugestao <= 0 && qtd <= minimo) {
            sugestao = minimo - qtd;
        }

        // produto zerado sempre precisa de compra, senao ele some daqui e aparece como critico na tela de estoque
        if (sugestao <= 0 && qtd <= 0) {
            sugestao = 1;
        }

        // quem esta exatamente no minimo fica de fora: o minimo e o ponto de alerta, nao o de ruptura
        if (sugestao <= 0) {
            return null;
        }

        BigDecimal preco = produto.getPreco() != null ? produto.getPreco() : BigDecimal.ZERO;
        BigDecimal valorEstimado = preco.multiply(BigDecimal.valueOf(sugestao))
                .setScale(ESCALA, ARREDONDAMENTO);

        return new RelatorioReposicaoResponse.ItemReposicao(
                produto.getId(),
                produto.getNome(),
                produto.getCategoria().getId(),
                produto.getCategoria().getNome(),
                qtd,
                minimo,
                unidadesVendidas,
                giroDiario.setScale(ESCALA, ARREDONDAMENTO),
                sugestao,
                preco.setScale(ESCALA, ARREDONDAMENTO),
                valorEstimado,
                StatusEstoque.de(qtd, minimo)
        );
    }

    // ordem escrita na mão pra nao depender da posicao do status dentro do enum
    private static final List<StatusEstoque> ORDEM_URGENCIA =
            List.of(StatusEstoque.CRITICO, StatusEstoque.ALERTA, StatusEstoque.NORMAL);

    private Comparator<RelatorioReposicaoResponse.ItemReposicao> porUrgencia() {
        // a janela é a mesma pra todos, então ordenar por unidades vendidas é o mesmo que por giro, só que exato
        return Comparator
                .comparingInt((RelatorioReposicaoResponse.ItemReposicao i) -> ORDEM_URGENCIA.indexOf(i.status()))
                .thenComparing(RelatorioReposicaoResponse.ItemReposicao::unidadesVendidas, Comparator.reverseOrder())
                .thenComparing(RelatorioReposicaoResponse.ItemReposicao::nome);
    }

    private RelatorioReposicaoResponse.Resumo montarResumo(
            List<RelatorioReposicaoResponse.ItemReposicao> itens,
            int janelaDias,
            int coberturaDias,
            LocalDate dataInicio,
            LocalDate dataFim) {

        long unidades = itens.stream()
                .mapToLong(RelatorioReposicaoResponse.ItemReposicao::sugestaoCompra)
                .sum();
        BigDecimal valor = itens.stream()
                .map(RelatorioReposicaoResponse.ItemReposicao::valorEstimadoPrecoVenda)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(ESCALA, ARREDONDAMENTO);

        return new RelatorioReposicaoResponse.Resumo(
                itens.size(), unidades, valor, janelaDias, coberturaDias, dataInicio, dataFim);
    }

    private int valorOuZero(Integer valor) {
        return valor != null ? valor : 0;
    }
}
