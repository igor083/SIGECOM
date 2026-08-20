"use client";

// Dados do painel do funcionário.
//
// Só consome endpoints liberados para o perfil FUNCIONARIO — /dashboard/desempenho,
// /lancamentos e /relatorios são ADMIN e ficam de fora de propósito.
//
// Cada bloco falha por conta própria: se o alerta de estoque cair, a meta e as
// vendas do dia continuam aparecendo. Um painel meio carregado é mais útil que
// uma tela de erro inteira.

import { useCallback, useEffect, useState } from "react";
import { listarVendas, type VendaResumoResponse } from "@/services/vendas";
import { listarEstoqueBaixo, type Produto } from "@/services/produtos";
import { obterPreviewFechamento, type Fechamento } from "@/services/fechamento";
import { mensagemDeErro } from "@/lib/apiError";

/** Tamanho de página usado para somar as vendas do dia de uma vez só. */
const LIMITE_VENDAS_DIA = 500;

/** Quantos itens críticos aparecem no alerta antes do "e mais N". */
export const LIMITE_ESTOQUE_BAIXO = 5;

export interface VendasDoDia {
  quantidade: number;
  /** null quando o dia passou do limite da página e a soma seria parcial. */
  total: number | null;
  ultimas: VendaResumoResponse[];
}

export interface EstoqueBaixo {
  itens: Produto[];
  totalCritico: number;
}

interface Bloco<T> {
  dados: T | null;
  erro: string | null;
}

export interface PainelFuncionario {
  vendas: Bloco<VendasDoDia>;
  estoque: Bloco<EstoqueBaixo>;
  caixa: Bloco<Fechamento>;
  carregando: boolean;
  recarregar: () => void;
}

function hojeISO(): string {
  // Data local, não UTC: toISOString() vira o dia anterior à noite no Brasil.
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

export function usePainelFuncionario(funcionarioId: number | undefined): PainelFuncionario {
  const [vendas, setVendas] = useState<Bloco<VendasDoDia>>({ dados: null, erro: null });
  const [estoque, setEstoque] = useState<Bloco<EstoqueBaixo>>({ dados: null, erro: null });
  const [caixa, setCaixa] = useState<Bloco<Fechamento>>({ dados: null, erro: null });
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const hoje = hojeISO();

    const resultados = await Promise.allSettled([
      funcionarioId == null
        ? Promise.reject(new Error("sem usuário autenticado"))
        : listarVendas({
            dataInicio: hoje,
            dataFim: hoje,
            funcionarioId,
            page: 0,
            size: LIMITE_VENDAS_DIA,
          }),
      listarEstoqueBaixo({ page: 0, size: LIMITE_ESTOQUE_BAIXO }),
      obterPreviewFechamento(),
    ]);

    const [resVendas, resEstoque, resCaixa] = resultados;

    if (resVendas.status === "fulfilled") {
      const pagina = resVendas.value;
      // Só soma quando a página cobre o dia inteiro; caso contrário o valor
      // seria parcial e passaria uma informação errada.
      const completa = pagina.content.length === pagina.totalElements;
      setVendas({
        dados: {
          quantidade: pagina.totalElements,
          total: completa
            ? pagina.content.reduce((soma, v) => soma + v.total, 0)
            : null,
          ultimas: pagina.content.slice(0, 3),
        },
        erro: null,
      });
    } else {
      setVendas({
        dados: null,
        erro: mensagemDeErro(resVendas.reason, "Não foi possível carregar suas vendas de hoje."),
      });
    }

    if (resEstoque.status === "fulfilled") {
      setEstoque({
        dados: {
          itens: resEstoque.value.content,
          totalCritico: resEstoque.value.totalElements,
        },
        erro: null,
      });
    } else {
      setEstoque({
        dados: null,
        erro: mensagemDeErro(resEstoque.reason, "Não foi possível verificar o estoque."),
      });
    }

    if (resCaixa.status === "fulfilled") {
      setCaixa({ dados: resCaixa.value, erro: null });
    } else {
      setCaixa({
        dados: null,
        erro: mensagemDeErro(resCaixa.reason, "Não foi possível consultar o caixa de hoje."),
      });
    }

    setCarregando(false);
  }, [funcionarioId]);

  useEffect(() => {
    // Mesmo caso de useDashboardDesempenho: `carregar` liga o spinner antes do
    // primeiro await, de propósito, para o painel não exibir os números do
    // funcionário anterior enquanto recarrega.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, [carregar]);

  return { vendas, estoque, caixa, carregando, recarregar: carregar };
}
