// =============================================================
// components/GradeProdutos.tsx — Catálogo em grade do PDV (SCRUM-160)
// =============================================================
// Antes, a área abaixo da busca ficava vazia até alguém digitar,
// e quem opera precisava saber o nome exato do produto. Aqui o
// catálogo aparece de cara, com foto, abas por categoria e clique
// que adiciona ao carrinho.
//
// Recebe `onSelecionar` — mesmo contrato do BuscaProduto, então o
// pai não sabe de onde o produto veio.
//
// Driver D-5: usa o hook useGradeProdutos, nunca a API direto.
// =============================================================

"use client";

import { useState } from "react";
import { type Produto } from "@/services/produtos";
import { useGradeProdutos } from "@/hooks/useGradeProdutos";
import styles from "./GradeProdutos.module.css";

interface GradeProdutosProps {
  /** Chamado ao clicar num produto com estoque. */
  onSelecionar: (produto: Produto) => void;
}

function formatarPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Badge de estoque: mesma leitura de faixa que o relatório usa. */
function badgeEstoque(produto: Produto): { classe: string; texto: string } {
  if (produto.qtdEstoque <= 0) return { classe: styles.badgeZero, texto: "Esgotado" };
  if (produto.qtdEstoque <= produto.estoqueMinimo)
    return { classe: styles.badgeCritico, texto: `Só ${produto.qtdEstoque}` };
  return { classe: styles.badgeOk, texto: `${produto.qtdEstoque} un` };
}

/**
 * Foto do produto. Link quebrado cai no espaço reservado em vez de
 * mostrar o ícone de imagem partida — o card pede isso explicitamente.
 */
function FotoProduto({ produto }: { produto: Produto }) {
  const [falhou, setFalhou] = useState(false);
  const badge = badgeEstoque(produto);

  if (!produto.imagemUrl || falhou) {
    return (
      <div className={styles.fotoVazia}>
        sem foto
        <span className={badge.classe}>{badge.texto}</span>
      </div>
    );
  }

  return (
    <div className={styles.foto}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.fotoImagem}
        src={produto.imagemUrl}
        alt={produto.nome}
        loading="lazy"
        onError={() => setFalhou(true)}
      />
      <span className={badge.classe}>{badge.texto}</span>
    </div>
  );
}

export default function GradeProdutos({ onSelecionar }: GradeProdutosProps) {
  const {
    produtos,
    abas,
    categoriaAtiva,
    selecionarCategoria,
    termo,
    setTermo,
    carregando,
    erro,
  } = useGradeProdutos();

  return (
    <div className={styles.container}>
      <div className={styles.buscaWrapper}>
        <input
          id="grade-busca-produto"
          type="text"
          className={styles.busca}
          placeholder="Buscar produto por nome..."
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          autoComplete="off"
          aria-label="Buscar produto por nome"
        />
      </div>

      {abas.length > 1 && (
        <div className={styles.abas} role="tablist" aria-label="Categorias">
          {abas.map((aba) => (
            <button
              key={aba.chave}
              type="button"
              role="tab"
              aria-selected={aba.chave === categoriaAtiva}
              className={aba.chave === categoriaAtiva ? styles.abaAtiva : styles.aba}
              onClick={() => selecionarCategoria(aba.chave)}
            >
              {aba.rotulo}
              <span className={styles.abaContagem}>{aba.quantidade}</span>
            </button>
          ))}
        </div>
      )}

      <div aria-live="polite">
        {erro && <div className={styles.erro} role="alert">{erro}</div>}

        {carregando && <div className={styles.mensagem}>Carregando produtos…</div>}

        {!carregando && !erro && produtos.length === 0 && (
          <div className={styles.mensagem}>
            {termo.trim()
              ? `Nenhum produto encontrado para “${termo.trim()}”`
              : "Nenhum produto cadastrado nesta categoria."}
          </div>
        )}

        {!carregando && produtos.length > 0 && (
          <div className={styles.grade}>
            {produtos.map((produto) => {
              const semEstoque = produto.qtdEstoque <= 0;
              return (
                <button
                  key={produto.id}
                  type="button"
                  disabled={semEstoque}
                  className={semEstoque ? styles.produtoEsgotado : styles.produto}
                  title={semEstoque ? "Produto sem estoque disponível" : produto.nome}
                  onClick={() => {
                    if (!semEstoque) onSelecionar(produto);
                  }}
                >
                  <FotoProduto produto={produto} />
                  <div className={styles.info}>
                    <span className={styles.nome}>{produto.nome}</span>
                    <div className={styles.categoria}>
                      {produto.categoria?.nome ?? "Sem categoria"}
                    </div>
                    <div className={styles.preco}>{formatarPreco(produto.preco)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
