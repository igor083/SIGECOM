// =============================================================
// components/Carrinho.tsx — Carrinho de compras (PDV)
// =============================================================
// Fluxo em 2 etapas:
//   PRODUTOS  → lista, quantidade, desconto por item
//              → botão "Ir para pagamento"
//   PAGAMENTO → seleção de forma de pagamento
//              → botão "Confirmar venda" (aqui envia a request)
// Após confirmação, exibe o comprovante com todos os detalhes.
// =============================================================

"use client";

import { useState } from "react";
import { type UseCarrinhoResult, type ItemCalculado } from "@/hooks/useCarrinho";
import { type TipoDesconto, type TipoPagamento } from "@/services/vendas";
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

const ROTULOS_PAGAMENTO: Record<TipoPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  DEBITO: "Débito",
  CREDITO: "Crédito",
};

const OPCOES_PAGAMENTO: { tipo: TipoPagamento; icone: string; descricao: string }[] = [
  { tipo: "DINHEIRO", icone: "💵", descricao: "Pagamento em espécie" },
  { tipo: "PIX",      icone: "⚡", descricao: "Pagamento instantâneo" },
  { tipo: "DEBITO",   icone: "💳", descricao: "Cartão de débito" },
  { tipo: "CREDITO",  icone: "🏦", descricao: "Cartão de crédito" },
];

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

// ── Comprovante ──────────────────────────────────────────────

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
          <div className={styles.linhaSub}>
            <span>Pagamento</span>
            <span className={styles.pagamentoLabel}>
              {ROTULOS_PAGAMENTO[venda.tipoPagamento]}
            </span>
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
        step="1"
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

// ── Etapa: PAGAMENTO ─────────────────────────────────────────

function EtapaPagamento({ carrinho }: CarrinhoProps) {
  const {
    subtotal,
    descontoTotal,
    total,
    totalItens,
    tipoPagamento,
    selecionarPagamento,
    voltarParaProdutos,
    confirmar,
    confirmando,
    erroConfirmacao,
  } = carrinho;

  async function handleConfirmar() {
    try {
      await confirmar();
    } catch {
      // Erro tratado no hook e exposto por erroConfirmacao
    }
  }

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.cabecalho}>
        <button
          className={styles.btnVoltar}
          onClick={voltarParaProdutos}
          disabled={confirmando}
          aria-label="Voltar para produtos"
        >
          ← Voltar
        </button>
        <span className={styles.cabecalhoTitulo}>
          Forma de pagamento
          <span className={styles.badge}>{totalItens}</span>
        </span>
        <span /> {/* placeholder para grid */}
      </div>

      {/* Grid de opções */}
      <div className={styles.opcoesPagamento}>
        {OPCOES_PAGAMENTO.map((op) => {
          const selecionada = tipoPagamento === op.tipo;
          return (
            <button
              key={op.tipo}
              type="button"
              className={
                selecionada ? styles.opcaoPagamentoAtiva : styles.opcaoPagamento
              }
              onClick={() => selecionarPagamento(op.tipo)}
              disabled={confirmando}
              aria-pressed={selecionada}
            >
              <span className={styles.opcaoIcone} aria-hidden>
                {op.icone}
              </span>
              <span className={styles.opcaoTextos}>
                <span className={styles.opcaoTitulo}>
                  {ROTULOS_PAGAMENTO[op.tipo]}
                </span>
                <span className={styles.opcaoDescricao}>{op.descricao}</span>
              </span>
              {selecionada && (
                <span className={styles.opcaoCheck} aria-hidden>
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Rodapé: resumo + confirmação */}
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
          disabled={confirmando || !tipoPagamento}
          title={
            !tipoPagamento ? "Selecione uma forma de pagamento" : undefined
          }
        >
          {confirmando
            ? "Registrando venda..."
            : tipoPagamento
              ? `Confirmar venda em ${ROTULOS_PAGAMENTO[tipoPagamento]}`
              : "Selecione a forma de pagamento"}
        </button>
      </div>
    </div>
  );
}

// ── Etapa: PRODUTOS ──────────────────────────────────────────

function EtapaProdutos({ carrinho }: CarrinhoProps) {
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
    irParaPagamento,
  } = carrinho;

  const [descontoAbertoId, setDescontoAbertoId] = useState<number | null>(null);
  const [confirmandoLimpar, setConfirmandoLimpar] = useState(false);
  const [confirmandoRemocaoId, setConfirmandoRemocaoId] = useState<number | null>(null);

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

  // Sem window.confirm (bloqueavel pelo navegador): 1o clique no X arma (fica
  // vermelho), 2o clique remove. Reseta sozinho apos 3s.
  function confirmarRemocao(produtoId: number) {
    if (confirmandoRemocaoId === produtoId) {
      removerItem(produtoId);
      setConfirmandoRemocaoId(null);
      return;
    }
    setConfirmandoRemocaoId(produtoId);
    setTimeout(() => {
      setConfirmandoRemocaoId((cur) => (cur === produtoId ? null : cur));
    }, 3000);
  }

  // Confirmacao em duas etapas, sem window.confirm (que o navegador pode bloquear
  // e deixar o botao "sem funcionar"): 1o clique arma "Confirmar?", 2o clique limpa.
  // Reseta sozinho apos 3s se o usuario nao confirmar.
  function confirmarLimpar() {
    if (confirmandoLimpar) {
      limpar();
      setConfirmandoLimpar(false);
      return;
    }
    setConfirmandoLimpar(true);
    setTimeout(() => setConfirmandoLimpar(false), 3000);
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
          {confirmandoLimpar ? "Confirmar?" : "Limpar tudo"}
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
                <div className={styles.itemInfo}>
                  <span className={styles.itemNome}>{produto.nome}</span>
                  <span className={styles.itemPrecoUnit}>
                    {formatarPreco(produto.preco)} / un.
                  </span>
                </div>

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

                <button
                  className={styles.btnRemover}
                  onClick={() => confirmarRemocao(produto.id)}
                  aria-label={`Remover ${produto.nome}`}
                  title={confirmandoRemocaoId === produto.id ? "Clique de novo para confirmar" : "Remover item"}
                  style={confirmandoRemocaoId === produto.id ? { color: "var(--color-error)", background: "var(--color-error-bg)", fontWeight: 700 } : undefined}
                >
                  ×
                </button>
              </div>

              {temDesconto && !abertoDesconto && (
                <span className={styles.itemDescontoInfo}>
                  Desconto:{" "}
                  {calc.item.tipoDesconto === "PERCENTUAL"
                    ? `${calc.item.valorDesconto}%`
                    : formatarPreco(calc.item.valorDesconto)}{" "}
                  (− {formatarPreco(calc.descontoAplicado)})
                </span>
              )}

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

      {/* Rodapé */}
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

        {/* Etapa 1: só encaminha para pagamento — não envia request ainda. */}
        <button className={styles.btnConfirmar} onClick={irParaPagamento}>
          Ir para pagamento →
        </button>
      </div>
    </div>
  );
}

// ── Componente principal (roteador de etapa) ─────────────────

export default function Carrinho({ carrinho }: CarrinhoProps) {
  const { comprovante, fecharComprovante, etapa } = carrinho;

  // Prioridade máxima: comprovante da última venda
  if (comprovante) {
    return <Comprovante venda={comprovante} onFechar={fecharComprovante} />;
  }

  if (etapa === "PAGAMENTO") {
    return <EtapaPagamento carrinho={carrinho} />;
  }

  return <EtapaProdutos carrinho={carrinho} />;
}
