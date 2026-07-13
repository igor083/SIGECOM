// =============================================================
// hooks/useCarrinho.ts — Estado do carrinho (PDV)
// =============================================================
// Toda a lógica do carrinho fica aqui. Componentes só renderizam.
//
// US-025: itens + quantidade
// US-026: desconto por item (percentual ou valor fixo);
//         subtotal, desconto total e total final calculados
//         localmente com a MESMA regra do backend (2 casas
//         decimais, HALF_UP, total nunca negativo).
// US-027: confirmar() persiste no backend, baixa estoque e
//         devolve comprovante — carrinho é esvaziado no sucesso.
// =============================================================

"use client";

import { useState, useCallback, useMemo } from "react";
import { type Produto } from "@/services/produtos";
import {
  confirmarVenda,
  type TipoDesconto,
  type VendaResponse,
  type ItemVendaRequest,
} from "@/services/vendas";
import { mensagemDeErro } from "@/lib/apiError";

// ── Tipos ────────────────────────────────────────────────────

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
  tipoDesconto: TipoDesconto | null;
  valorDesconto: number; // 0 quando não há desconto
}

/** Valores calculados por item, prontos para exibir. */
export interface ItemCalculado {
  item: ItemCarrinho;
  bruto: number;
  descontoAplicado: number;
  subtotal: number;
}

export interface UseCarrinhoResult {
  itens: ItemCarrinho[];
  itensCalculados: ItemCalculado[];
  adicionarItem: (produto: Produto) => void;
  removerItem: (produtoId: number) => void;
  ajustarQuantidade: (produtoId: number, quantidade: number) => void;
  aplicarDesconto: (
    produtoId: number,
    tipo: TipoDesconto | null,
    valor: number
  ) => void;
  limpar: () => void;
  subtotal: number;
  descontoTotal: number;
  total: number;
  totalItens: number;
  confirmar: () => Promise<VendaResponse>;
  confirmando: boolean;
  erroConfirmacao: string | null;
  comprovante: VendaResponse | null;
  fecharComprovante: () => void;
}

// ── Arredondamento consistente com o backend (HALF_UP, 2 casas) ─

function round2(n: number): number {
  // Math.round trata HALF_UP para positivos; garantimos 2 casas.
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Calcula bruto, descontoAplicado e subtotal de um item. */
function calcularItem(item: ItemCarrinho): ItemCalculado {
  const bruto = round2(item.produto.preco * item.quantidade);

  let descontoAplicado = 0;
  if (item.tipoDesconto && item.valorDesconto > 0) {
    if (item.tipoDesconto === "PERCENTUAL") {
      const percentual = Math.min(item.valorDesconto, 100);
      descontoAplicado = round2((bruto * percentual) / 100);
    } else {
      descontoAplicado = round2(item.valorDesconto);
    }
    // Nunca ultrapassa o bruto do item (CA: total nunca negativo)
    if (descontoAplicado > bruto) descontoAplicado = bruto;
  }

  const subtotal = round2(bruto - descontoAplicado);
  return { item, bruto, descontoAplicado, subtotal };
}

// ── Hook ─────────────────────────────────────────────────────

export function useCarrinho(): UseCarrinhoResult {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [confirmando, setConfirmando] = useState(false);
  const [erroConfirmacao, setErroConfirmacao] = useState<string | null>(null);
  const [comprovante, setComprovante] = useState<VendaResponse | null>(null);

  // CA-1: adicionar produto; se já no carrinho, incrementa
  // CA-4: quantidade não pode exceder o estoque disponível
  const adicionarItem = useCallback((produto: Produto) => {
    setItens((atual) => {
      const existe = atual.find((i) => i.produto.id === produto.id);
      if (existe) {
        return atual.map((i) =>
          i.produto.id === produto.id
            ? { ...i, quantidade: Math.min(i.quantidade + 1, produto.qtdEstoque) }
            : i
        );
      }
      return [
        ...atual,
        {
          produto,
          quantidade: 1,
          tipoDesconto: null,
          valorDesconto: 0,
        },
      ];
    });
  }, []);

  const removerItem = useCallback((produtoId: number) => {
    setItens((atual) => atual.filter((i) => i.produto.id !== produtoId));
  }, []);

  const ajustarQuantidade = useCallback((produtoId: number, quantidade: number) => {
    setItens((atual) =>
      atual.map((i) => {
        if (i.produto.id !== produtoId) return i;
        const qtd = Math.max(1, Math.min(Math.floor(quantidade), i.produto.qtdEstoque));
        return { ...i, quantidade: qtd };
      })
    );
  }, []);

  // US-026: desconto por item (percentual ou valor fixo)
  const aplicarDesconto = useCallback(
    (produtoId: number, tipo: TipoDesconto | null, valor: number) => {
      setItens((atual) =>
        atual.map((i) => {
          if (i.produto.id !== produtoId) return i;
          const valorSanitizado = Number.isFinite(valor) && valor > 0 ? valor : 0;
          return {
            ...i,
            tipoDesconto: valorSanitizado > 0 ? tipo : null,
            valorDesconto: valorSanitizado,
          };
        })
      );
    },
    []
  );

  const limpar = useCallback(() => setItens([]), []);

  // US-026: cálculo automático — recomputado a cada mudança do carrinho
  const itensCalculados = useMemo(() => itens.map(calcularItem), [itens]);

  const { subtotal, descontoTotal, total } = useMemo(() => {
    let sub = 0;
    let desc = 0;
    for (const c of itensCalculados) {
      sub += c.bruto;
      desc += c.descontoAplicado;
    }
    sub = round2(sub);
    desc = round2(desc);
    const t = round2(Math.max(sub - desc, 0)); // CA: total nunca negativo
    return { subtotal: sub, descontoTotal: desc, total: t };
  }, [itensCalculados]);

  const totalItens = useMemo(
    () => itens.reduce((acc, i) => acc + i.quantidade, 0),
    [itens]
  );

  // US-027: confirmar venda
  const confirmar = useCallback(async (): Promise<VendaResponse> => {
    if (itens.length === 0) {
      const msg = "Adicione ao menos um item ao carrinho antes de confirmar.";
      setErroConfirmacao(msg);
      throw new Error(msg);
    }
    setConfirmando(true);
    setErroConfirmacao(null);
    try {
      const payload: ItemVendaRequest[] = itens.map((i) => ({
        produtoId: i.produto.id,
        quantidade: i.quantidade,
        tipoDesconto: i.tipoDesconto,
        valorDesconto: i.valorDesconto > 0 ? i.valorDesconto : null,
      }));
      const venda = await confirmarVenda({ itens: payload });
      setComprovante(venda);
      setItens([]); // CA US-027: carrinho é esvaziado após confirmação
      return venda;
    } catch (err) {
      setErroConfirmacao(mensagemDeErro(err));
      throw err;
    } finally {
      setConfirmando(false);
    }
  }, [itens]);

  const fecharComprovante = useCallback(() => setComprovante(null), []);

  return {
    itens,
    itensCalculados,
    adicionarItem,
    removerItem,
    ajustarQuantidade,
    aplicarDesconto,
    limpar,
    subtotal,
    descontoTotal,
    total,
    totalItens,
    confirmar,
    confirmando,
    erroConfirmacao,
    comprovante,
    fecharComprovante,
  };
}
