package com.sigecom.domain.enums;

/**
 * Filtro de nível de estoque da listagem de produtos.
 *
 * Existe para a tela filtrar no servidor, e não sobre a página já carregada:
 * filtrar no cliente esconde produto que está em nível crítico numa página
 * seguinte, e o usuário conclui que não há nenhum.
 *
 * A regra de corte é a mesma de {@link StatusEstoque}: crítico/alerta é
 * qtdEstoque <= estoqueMinimo.
 */
public enum FiltroEstoque {

    /** Sem recorte por estoque. */
    TODOS(true, true),

    /** Só o que precisa de reposição (qtdEstoque <= estoqueMinimo). */
    BAIXO(true, false),

    /** Só o que está com folga (qtdEstoque > estoqueMinimo). */
    NORMAL(false, true);

    private final boolean incluiBaixo;
    private final boolean incluiNormal;

    FiltroEstoque(boolean incluiBaixo, boolean incluiNormal) {
        this.incluiBaixo = incluiBaixo;
        this.incluiNormal = incluiNormal;
    }

    /**
     * Os dois flags viram parâmetros da query em vez de um enum comparado a
     * literais. Nenhum deles é nulo, então não há ":param IS NULL" — que no
     * Postgres atrapalha a inferência de tipo do parâmetro no PREPARE.
     */
    public boolean incluiBaixo() {
        return incluiBaixo;
    }

    public boolean incluiNormal() {
        return incluiNormal;
    }
}
