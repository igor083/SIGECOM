package com.sigecom.domain.enums;

public enum StatusEstoque {
    NORMAL,
    ALERTA,
    CRITICO;

    public static StatusEstoque de(int qtdEstoque, int estoqueMinimo) {
        if (qtdEstoque <= 0) {
            return CRITICO;
        }
        if (qtdEstoque <= estoqueMinimo) {
            return ALERTA;
        }
        return NORMAL;
    }
}
