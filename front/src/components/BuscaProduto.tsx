// =============================================================
// components/BuscaProduto.tsx — Busca rápida de produtos (PDV)
// =============================================================
// Componente reutilizável: input de busca + lista de resultados.
// Recebe `onSelecionar` — o pai decide o que fazer com o produto
// (na US-028, adiciona ao carrinho). Não guarda estado de venda.
//
// Driver D-5: usa o hook useBuscaProduto (que usa o service).
//             Componente nunca chama API direto.
// =============================================================

"use client";

import { type Produto } from "@/services/produtos";
import { useBuscaProduto } from "@/hooks/useBuscaProduto";
import styles from "./BuscaProduto.module.css";

// ── Props ────────────────────────────────────────────────────

interface BuscaProdutoProps {
  /** Callback chamado ao selecionar um produto com estoque. */
  onSelecionar: (produto: Produto) => void;
}

// ── Helpers de formatação ────────────────────────────────────

/** Formata preço em Real brasileiro. */
function formatarPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// ── Ícones SVG inline (evita dependência de lib) ─────────────

function IconeBusca() {
  return (
    <svg
      className={styles.searchIcon}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconeDigitar() {
  return (
    <svg
      className={styles.mensagemIcone}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconeVazio() {
  return (
    <svg
      className={styles.mensagemIcone}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

// ── Componente ───────────────────────────────────────────────

export default function BuscaProduto({ onSelecionar }: BuscaProdutoProps) {
  const { termo, setTermo, resultados, carregando, erro } = useBuscaProduto();

  const temTermo = termo.trim().length >= 2;
  const semResultados = temTermo && !carregando && resultados.length === 0 && !erro;

  return (
    <div className={styles.container}>
      {/* Campo de busca */}
      <div className={styles.searchWrapper}>
        <input
          id="busca-produto-input"
          type="text"
          className={styles.input}
          placeholder="Buscar produto por nome..."
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          autoComplete="off"
          aria-label="Buscar produto por nome"
        />
        <IconeBusca />
        {carregando && <span className={styles.spinner} aria-label="Buscando..." />}
      </div>

      {/* Erro */}
      {erro && (
        <div className={styles.erro} role="alert">
          <span>{erro}</span>
        </div>
      )}

      {/* Estado: digite para buscar */}
      {!temTermo && !erro && (
        <div className={styles.mensagem}>
          <IconeDigitar />
          <span className={styles.mensagemTexto}>
            Digite ao menos 2 caracteres para buscar um produto
          </span>
        </div>
      )}

      {/* Estado: nenhum resultado */}
      {semResultados && (
        <div className={styles.mensagem}>
          <IconeVazio />
          <span className={styles.mensagemTexto}>
            Nenhum produto encontrado para &ldquo;{termo.trim()}&rdquo;
          </span>
        </div>
      )}

      {/* Lista de resultados */}
      {resultados.length > 0 && (
        <ul className={styles.resultados} role="listbox" aria-label="Resultados da busca">
          {resultados.map((produto) => {
            const semEstoque = produto.qtdEstoque <= 0;

            return (
              <li
                key={produto.id}
                className={semEstoque ? styles.itemDesabilitado : styles.item}
                role="option"
                aria-disabled={semEstoque}
                aria-selected={false}
                onClick={() => {
                  if (!semEstoque) {
                    onSelecionar(produto);
                  }
                }}
                onKeyDown={(e) => {
                  if (!semEstoque && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelecionar(produto);
                  }
                }}
                tabIndex={semEstoque ? -1 : 0}
              >
                <div className={styles.itemInfo}>
                  <span className={styles.itemNome}>{produto.nome}</span>
                  <span className={styles.itemEstoque}>
                    {semEstoque
                      ? "Sem unidades disponíveis"
                      : `${produto.qtdEstoque} un. em estoque`}
                  </span>
                </div>

                {semEstoque ? (
                  <span className={styles.badgeSemEstoque}>Sem estoque</span>
                ) : (
                  <span className={styles.itemPreco}>
                    {formatarPreco(produto.preco)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
