package com.sigecom.domain.enums;

/**
 * Forma de pagamento de um lancamento financeiro.
 * Separado de TipoPagamento (que serve so a Venda) porque despesa
 * tem formas que venda nao tem: transferencia, boleto, debito automatico.
 * Para o fechamento de caixa, so DINHEIRO conta como movimentacao fisica.
 */
public enum FormaPagamentoLancamento {
    DINHEIRO,
    PIX,
    DEBITO,
    CREDITO,
    TRANSFERENCIA,
    BOLETO,
    OUTRO;

    /**
     * Traduz o TipoPagamento da Venda pra forma equivalente aqui.
     * Fonte unica de verdade — usado por VendaService e pelo backfill runner.
     */
    public static FormaPagamentoLancamento fromTipoPagamento(TipoPagamento tipo) {
        return switch (tipo) {
            case DINHEIRO -> DINHEIRO;
            case PIX -> PIX;
            case DEBITO -> DEBITO;
            case CREDITO -> CREDITO;
        };
    }
}
