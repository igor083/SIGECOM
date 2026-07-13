// =============================================================
// components/Carrinho.tsx — Carrinho de compras (PDV)
// =============================================================
// Recebe o resultado do useCarrinho e renderiza:
//   - lista de itens com controle de quantidade
//   - estado vazio (CA-6)
//   - subtotal por item e total geral (CA-5)
//
// CA-3: confirmação de remoção fica aqui (decisão de UI).
// CA-4: os botões + / − ficam desabilitados nos limites de estoque.
// =============================================================

"use client";

import { type UseCarrinhoResult } from "@/hooks/useCarrinho";
import styles from "./Carrinho.module.css";

// ── Props ────────────────────────────────────────────────────

interface CarrinhoProps {
  carrinho: UseCarrinhoResult;
  /** Callback chamado quando o operador confirmar a venda. */
  onConfirmar?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────

function formatarPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ── Ícone ────────────────────────────────────────────────────

function IconeCarrinho() {
  return (
    <svg
      className={styles.vazioIcone}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

// ── Componente ───────────────────────────────────────────────

export default function Carrinho({ carrinho, onConfirmar }: CarrinhoProps) {
  const { itens, removerItem, ajustarQuantidade, limpar, total, totalItens } = carrinho;

  // CA-6: carrinho vazio mostra estado claro
  if (itens.length === 0) {
    return (
      <div className={styles.vazio}>
        <IconeCarrinho />
        <span className={styles.vazioTexto}>Nenhum item na venda</span>
        <span className={styles.vazioSub}>Busque um produto ao lado para começar</span>
      </div>
    );
  }

  function confirmarRemocao(produtoId: number, nome: string) {
    if (window.confirm(`Remover "${nome}" do carrinho?`)) {
      removerItem(produtoId);
    }
  }

  function confirmarLimpar() {
    if (window.confirm("Limpar todos os itens do carrinho?")) {
      limpar();
    }
  }

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.cabecalho}>
        <span className={styles.cabecalhoTitulo}>
          Itens da venda
          <span className={styles.badge}>{totalItens}</span>
        </span>
        <button className={styles.btnLimpar} onClick={confirmarLimpar}>
          Limpar tudo
        </button>
      </div>

      {/* Lista de itens */}
      <ul className={styles.lista}>
        {itens.map(({ produto, quantidade }) => (
          <li key={produto.id} className={styles.item}>
            {/* Nome + preço unitário */}
            <div className={styles.itemInfo}>
              <span className={styles.itemNome}>{produto.nome}</span>
              <span className={styles.itemPrecoUnit}>
                {formatarPreco(produto.preco)} / un.
              </span>
            </div>

            {/* Controle de quantidade */}
            <div className={styles.itemControles}>
              <button
                className={styles.btnQtd}
                onClick={() => ajustarQuantidade(produto.id, quantidade - 1)}
                disabled={quantidade <= 1}
                aria-label="Diminuir quantidade"
              >
                −
              </button>
              <input
                className={styles.inputQtd}
                type="number"
                min={1}
                max={produto.qtdEstoque}
                value={quantidade}
                onChange={(e) => ajustarQuantidade(produto.id, Number(e.target.value))}
                aria-label={`Quantidade de ${produto.nome}`}
              />
              <button
                className={styles.btnQtd}
                onClick={() => ajustarQuantidade(produto.id, quantidade + 1)}
                disabled={quantidade >= produto.qtdEstoque}
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>

            {/* Subtotal do item (CA-5) */}
            <span className={styles.itemSubtotal}>
              {formatarPreco(produto.preco * quantidade)}
            </span>

            {/* Remover (CA-3: pede confirmação) */}
            <button
              className={styles.btnRemover}
              onClick={() => confirmarRemocao(produto.id, produto.nome)}
              aria-label={`Remover ${produto.nome}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {/* Rodapé com total e botão de confirmar */}
      <div className={styles.rodape}>
        <div className={styles.totalLinha}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalValor}>{formatarPreco(total)}</span>
        </div>
        {onConfirmar && (
          <button className={styles.btnConfirmar} onClick={onConfirmar}>
            Confirmar venda
          </button>
        )}
      </div>
    </div>
  );
}
