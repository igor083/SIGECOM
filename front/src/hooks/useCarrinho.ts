// =============================================================
// hooks/useCarrinho.ts — Estado do carrinho (PDV)
// =============================================================
// Toda a lógica do carrinho fica aqui. O componente Carrinho.tsx
// recebe os valores prontos e só renderiza, não conhece as regras.
//
// Padrão do projeto: hook para lógica, componente para UI.
// =============================================================

"use client";

import { useState, useCallback, useMemo } from "react";
import { type Produto } from "@/services/produtos";

// ── Tipo ─────────────────────────────────────────────────────

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

export interface UseCarrinhoResult {
  itens: ItemCarrinho[];
  adicionarItem: (produto: Produto) => void;
  removerItem: (produtoId: number) => void;
  ajustarQuantidade: (produtoId: number, quantidade: number) => void;
  limpar: () => void;
  total: number;
  totalItens: number;
}

// ── Hook ─────────────────────────────────────────────────────

export function useCarrinho(): UseCarrinhoResult {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);

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
      return [...atual, { produto, quantidade: 1 }];
    });
  }, []);

  // CA-3: remoção — a confirmação fica no componente (é decisão de UI)
  const removerItem = useCallback((produtoId: number) => {
    setItens((atual) => atual.filter((i) => i.produto.id !== produtoId));
  }, []);

  // CA-2: ajustar quantidade diretamente no carrinho
  // CA-4: clampeia entre 1 e o estoque disponível
  const ajustarQuantidade = useCallback((produtoId: number, quantidade: number) => {
    setItens((atual) =>
      atual.map((i) => {
        if (i.produto.id !== produtoId) return i;
        const qtd = Math.max(1, Math.min(Math.floor(quantidade), i.produto.qtdEstoque));
        return { ...i, quantidade: qtd };
      })
    );
  }, []);

  const limpar = useCallback(() => setItens([]), []);

  // CA-5: subtotal e total são derivados, nunca armazenados
  const total = useMemo(
    () => itens.reduce((acc, i) => acc + i.produto.preco * i.quantidade, 0),
    [itens]
  );

  const totalItens = useMemo(
    () => itens.reduce((acc, i) => acc + i.quantidade, 0),
    [itens]
  );

  return { itens, adicionarItem, removerItem, ajustarQuantidade, limpar, total, totalItens };
}
