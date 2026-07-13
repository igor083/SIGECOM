// =============================================================
// components/Carrinho.tsx — Carrinho de compras (PDV)
// =============================================================
// US-025: lista de itens, quantidade, remoção, estado vazio.
// US-026: desconto por item (percentual ou valor fixo);
//         exibe subtotal, desconto total e total em destaque.
// US-027: confirmar venda → chama API, mostra comprovante,
//         mostra erro quando algo falha (ex.: estoque insuficiente).
// =============================================================

"use client";

import { useState } from "react";
import { type UseCarrinhoResult, type ItemCalculado } from "@/hooks/useCarrinho";
import { type TipoDesconto } from "@/services/vendas";
import styles from "./Carrinho.module.css";

// ── Props ────────────────────────────────────────────────────

interface CarrinhoProps {
  carrinho: UseCarrinhoResult;
}

// ── Helpers ──────────────────────────────────────────────────

function formatarPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
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

// ── Comprovante (modal simples) ──────────────────────────────

function Comprovante({
  venda,
  onFechar,
}: {
  venda: NonNullable<UseCarrinhoResult["comprovante"]>;
  onFechar: () => void;
}) {
  return (
    <div className={styles.comprovanteOverlay} role="dialog" aria-modal="true">
      <div className={styles.comprovanteBox}>
        <header className={styles.comprovanteHeader}>
          <span className={styles.comprovanteTitulo}>Venda registrada</span>
          <span className={styles.comprovanteSub}>
            #{venda.id} · {formatarDataHora(venda.dataHora)}
          </span>
        </header>

        <ul className={styles.comprovanteLista}>
          {venda.itens.map((i) => (
            <li key={i.produtoId} className={styles.comprovanteItem}>
              <span className={styles.comprovanteNome}>{i.nomeProduto}</span>
              <span className={styles.comprovanteQtd}>× {i.quantidade}</span>
              <span className={styles.comprovanteValor}>
                {formatarPreco(i.subtotal)}
              </span>
            </li>
          ))}
        </ul>

        <div className={styles.comprovanteResumo}>
          <div className={styles.linhaSub}>
            <span>Subtotal</span>
            <span>{formatarPreco(venda.subtotal)}</span>
          </div>
          <div className={styles.linhaSub}>
            <span>Desconto</span>
            <span>− {formatarPreco(venda.descontoTotal)}</span>
          </div>
          <div className={styles.totalLinha}>
            <span className={styles.totalLabel}>Total pago</span>
            <span className={styles.totalValor}>{formatarPreco(venda.total)}</span>
          </div>
        </div>

        <button className={styles.btnConfirmar} onClick={onFechar}>
          Nova venda
        </button>
      </div>
    </div>
  );
}

// ── Painel de desconto por item ──────────────────────────────

function PainelDesconto({
  calc,
  onAplicar,
  onLimpar,
  onFechar,
}: {
  calc: ItemCalculado;
  onAplicar: (tipo: TipoDesconto, valor: number) => void;
  onLimpar: () => void;
  onFechar: () => void;
}) {
  const [tipo, setTipo] = useState<TipoDesconto>(
    calc.item.tipoDesconto ?? "VALOR_FIXO"
  );
  const [valor, setValor] = useState<string>(
    calc.item.valorDesconto > 0 ? String(calc.item.valorDesconto) : ""
  );

  function aplicar() {
    const num = Number(valor.replace(",", "."));
    if (!Number.isFinite(num) || num <= 0) {
      onLimpar();
    } else {
      onAplicar(tipo, num);
    }
    onFechar();
  }

  return (
    <div className={styles.painelDesconto}>
      <div className={styles.tipoDesconto}>
        <button
          type="button"
          className={tipo === "VALOR_FIXO" ? styles.tipoAtivo : styles.tipoInativo}
          onClick={() => setTipo("VALOR_FIXO")}
        >
          R$
        </button>
        <button
          type="button"
          className={tipo === "PERCENTUAL" ? styles.tipoAtivo : styles.tipoInativo}
          onClick={() => setTipo("PERCENTUAL")}
        >
          %
        </button>
      </div>
      <input
        className={styles.inputDesconto}
        type="number"
        min={0}
        step="0.01"
        placeholder={tipo === "PERCENTUAL" ? "% de desconto" : "R$ de desconto"}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        autoFocus
      />
      <div className={styles.acoesDesconto}>
        <button type="button" className={styles.btnDescontoLimpar} onClick={() => { onLimpar(); onFechar(); }}>
          Remover
        </button>
        <button type="button" className={styles.btnDescontoAplicar} onClick={aplicar}>
          Aplicar
        </button>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────

export default function Carrinho({ carrinho }: CarrinhoProps) {
  const {
    itens,
    itensCalculados,
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
  } = carrinho;

  // Qual item está com o painel de desconto aberto (id do produto)
  const [descontoAbertoId, setDescontoAbertoId] = useState<number | null>(null);

  // Comprovante tem prioridade — carrinho é esvaziado ao confirmar
  if (comprovante) {
    return <Comprovante venda={comprovante} onFechar={fecharComprovante} />;
  }

  // CA-6: carrinho vazio
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

  async function handleConfirmar() {
    try {
      await confirmar();
    } catch {
      // Erro já capturado no hook e exposto em erroConfirmacao
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
        {itensCalculados.map((calc) => {
          const { produto, quantidade } = calc.item;
          const abertoDesconto = descontoAbertoId === produto.id;
          const temDesconto = calc.descontoAplicado > 0;

          return (
            <li key={produto.id} className={styles.item}>
              <div className={styles.itemLinhaPrincipal}>
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

                {/* Subtotal do item */}
                <div className={styles.itemValores}>
                  {temDesconto && (
                    <span className={styles.itemBrutoRiscado}>
                      {formatarPreco(calc.bruto)}
                    </span>
                  )}
                  <span className={styles.itemSubtotal}>
                    {formatarPreco(calc.subtotal)}
                  </span>
                </div>

                {/* Botão de desconto */}
                <button
                  className={temDesconto ? styles.btnDescontoAtivo : styles.btnDesconto}
                  onClick={() =>
                    setDescontoAbertoId(abertoDesconto ? null : produto.id)
                  }
                  aria-label="Aplicar desconto"
                  title="Desconto por item"
                >
                  %
                </button>

                {/* Remover */}
                <button
                  className={styles.btnRemover}
                  onClick={() => confirmarRemocao(produto.id, produto.nome)}
                  aria-label={`Remover ${produto.nome}`}
                >
                  ×
                </button>
              </div>

              {/* Linha de desconto ativo (informativa) */}
              {temDesconto && !abertoDesconto && (
                <span className={styles.itemDescontoInfo}>
                  Desconto:{" "}
                  {calc.item.tipoDesconto === "PERCENTUAL"
                    ? `${calc.item.valorDesconto}%`
                    : formatarPreco(calc.item.valorDesconto)}{" "}
                  (− {formatarPreco(calc.descontoAplicado)})
                </span>
              )}

              {/* Painel de desconto */}
              {abertoDesconto && (
                <PainelDesconto
                  calc={calc}
                  onAplicar={(tipo, valor) => aplicarDesconto(produto.id, tipo, valor)}
                  onLimpar={() => aplicarDesconto(produto.id, null, 0)}
                  onFechar={() => setDescontoAbertoId(null)}
                />
              )}
            </li>
          );
        })}
      </ul>

      {/* Rodapé com resumo e confirmação */}
      <div className={styles.rodape}>
        <div className={styles.linhaSub}>
          <span>Subtotal</span>
          <span>{formatarPreco(subtotal)}</span>
        </div>
        <div className={styles.linhaSub}>
          <span>Desconto</span>
          <span>− {formatarPreco(descontoTotal)}</span>
        </div>
        <div className={styles.totalLinha}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalValor}>{formatarPreco(total)}</span>
        </div>

        {erroConfirmacao && (
          <div className={styles.erroBox} role="alert">
            {erroConfirmacao}
          </div>
        )}

        <button
          className={styles.btnConfirmar}
          onClick={handleConfirmar}
          disabled={confirmando}
        >
          {confirmando ? "Registrando venda..." : "Confirmar venda"}
        </button>
      </div>
    </div>
  );
}
