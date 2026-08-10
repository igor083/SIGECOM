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
  /**
   * Muda para forçar recarga do catálogo. Depois de uma venda o estoque
   * caiu no banco, e a grade não pode continuar mostrando o número velho.
   */
  versao?: number;
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

export default function GradeProdutos({ onSelecionar, versao = 0 }: GradeProdutosProps) {
  const {
    produtos,
    abas,
    categoriaAtiva,
    selecionarCategoria,
    termo,
    setTermo,
    carregando,
    buscando,
    erro,
    catalogoTruncado,
    totalNoCatalogo,
    recarregar,
  } = useGradeProdutos(versao);

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
        {buscando && <span className={styles.aviso}>Buscando…</span>}
        {/* Nao esconder o limite: o operador precisa saber que a grade nao
            mostra tudo, e que a busca por nome alcanca o resto. */}
        {catalogoTruncado && !buscando && (
          <span className={styles.aviso}>
            Mostrando {abas[0]?.quantidade ?? 0} de {totalNoCatalogo} produtos. Use a busca
            para achar os demais.
          </span>
        )}
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
        {erro && (
          <div className={styles.erro} role="alert">
            <span>{erro}</span>
            {/* sem isto o PDV ficava travado ate dar F5 */}
            <button type="button" className={styles.tentarDeNovo} onClick={() => recarregar()}>
              Tentar de novo
            </button>
          </div>
        )}

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
                  {/* key pela URL: link corrigido depois de uma recarga
                      precisa sair do estado "falhou" */}
                  <FotoProduto key={produto.imagemUrl ?? "sem-foto"} produto={produto} />
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
