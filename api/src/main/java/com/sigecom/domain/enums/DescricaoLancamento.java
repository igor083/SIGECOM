package com.sigecom.domain.enums;

/**
 * Motivos pré-definidos para lançamentos financeiros.
 * Cada valor indica a qual tipo de lançamento (RECEITA ou DESPESA) pertence.
 */
public enum DescricaoLancamento {
    // Receitas
    VENDA(TipoLancamento.RECEITA),
    RECEBIMENTO_DIVIDA(TipoLancamento.RECEITA),
    OUTRA_RECEITA(TipoLancamento.RECEITA),

    // Despesas
    COMPRA_MERCADORIA(TipoLancamento.DESPESA),
    SALARIO(TipoLancamento.DESPESA),
    ALUGUEL(TipoLancamento.DESPESA),
    CONTA_LUZ(TipoLancamento.DESPESA),
    CONTA_AGUA(TipoLancamento.DESPESA),
    INTERNET_TELEFONE(TipoLancamento.DESPESA),
    MANUTENCAO(TipoLancamento.DESPESA),
    IMPOSTOS(TipoLancamento.DESPESA),
    FORNECEDORES(TipoLancamento.DESPESA),
    OUTRA_DESPESA(TipoLancamento.DESPESA);

    private final TipoLancamento tipo;

    DescricaoLancamento(TipoLancamento tipo) {
        this.tipo = tipo;
    }

    public TipoLancamento getTipo() {
        return tipo;
    }
}
