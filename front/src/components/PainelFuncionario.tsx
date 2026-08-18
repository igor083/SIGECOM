"use client";

// Painel do funcionário: o que ele precisa ver ao abrir o sistema.
//
// A ordem é a da rotina dele: primeiro o atalho para vender, depois como o dia
// está indo (meta e vendas próprias), depois o que exige atenção (caixa e
// estoque). Nada aqui depende de endpoint ADMIN.

import Link from "next/link";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import MetaVendaDiaria from "@/components/MetaVendaDiaria";
import { usePainelFuncionario, LIMITE_ESTOQUE_BAIXO } from "@/hooks/usePainelFuncionario";
import styles from "./PainelFuncionario.module.css";

function formatarPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  /** Id do funcionário logado — filtra as vendas do dia por responsável. */
  funcionarioId: number | undefined;
  primeiroNome: string;
}

export default function PainelFuncionario({ funcionarioId, primeiroNome }: Props) {
  const { vendas, estoque, caixa, carregando } = usePainelFuncionario(funcionarioId);

  const caixaFechado = caixa.dados?.id != null;

  return (
    <div className={styles.painel}>
      {/* ── Atalho principal: abrir venda em um clique ── */}
      <section className={styles.acoes}>
        <Link href="/pdv/nova" className={styles.cardPdv}>
          <div className={styles.pdvIcone}>
            <PointOfSaleOutlinedIcon sx={{ fontSize: 38 }} />
          </div>
          <div className={styles.pdvTextos}>
            <span className={styles.pdvTitulo}>Iniciar nova venda</span>
            <span className={styles.pdvDescricao}>
              Abrir o PDV, montar o carrinho e registrar a venda.
            </span>
          </div>
          <span className={styles.pdvSeta} aria-hidden>
            →
          </span>
        </Link>

        <div className={styles.acoesSecundarias}>
          <Link href="/pdv/historico" className={styles.acaoSecundaria}>
            <ReceiptLongOutlinedIcon sx={{ fontSize: 20 }} />
            <span>Histórico de vendas</span>
          </Link>
          <Link href="/produtos" className={styles.acaoSecundaria}>
            <Inventory2OutlinedIcon sx={{ fontSize: 20 }} />
            <span>Consultar produtos</span>
          </Link>
        </div>
      </section>

      {/* ── Como o dia está indo ── */}
      <section className={styles.linha}>
        <div className={styles.colunaMeta}>
          <MetaVendaDiaria />
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitulo}>Minhas vendas de hoje</span>
          </div>

          {carregando ? (
            <div className={styles.skeleton} />
          ) : vendas.erro ? (
            <p className={styles.erro}>{vendas.erro}</p>
          ) : vendas.dados && vendas.dados.quantidade > 0 ? (
            <>
              <div className={styles.numeros}>
                <div>
                  <span className={styles.numeroLabel}>Vendas</span>
                  <span className={styles.numeroPrincipal}>{vendas.dados.quantidade}</span>
                </div>
                <div className={styles.divisor} />
                <div>
                  <span className={styles.numeroLabel}>Total</span>
                  <span className={styles.numeroPrincipal}>
                    {vendas.dados.total != null ? formatarPreco(vendas.dados.total) : "—"}
                  </span>
                </div>
              </div>

              <ul className={styles.listaVendas}>
                {vendas.dados.ultimas.map((v) => (
                  <li key={v.id} className={styles.itemVenda}>
                    <span className={styles.vendaHora}>{formatarHora(v.dataHora)}</span>
                    <span className={styles.vendaItens}>
                      {v.qtdItens} {v.qtdItens === 1 ? "item" : "itens"}
                    </span>
                    <span className={styles.vendaValor}>{formatarPreco(v.total)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className={styles.vazio}>
              Você ainda não registrou vendas hoje, {primeiroNome}. Bora começar?
            </p>
          )}
        </div>
      </section>

      {/* ── O que pede atenção ── */}
      <section className={styles.linha}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitulo}>Caixa de hoje</span>
          </div>

          {carregando ? (
            <div className={styles.skeleton} />
          ) : caixa.erro ? (
            <p className={styles.erro}>{caixa.erro}</p>
          ) : caixa.dados ? (
            <>
              <div className={caixaFechado ? styles.statusFechado : styles.statusAberto}>
                {caixaFechado ? (
                  <CheckCircleOutlinedIcon sx={{ fontSize: 18 }} />
                ) : (
                  <PointOfSaleOutlinedIcon sx={{ fontSize: 18 }} />
                )}
                <span>{caixaFechado ? "Fechado" : "Em aberto"}</span>
              </div>

              <div className={styles.numeros}>
                <div>
                  <span className={styles.numeroLabel}>Vendas do dia</span>
                  <span className={styles.numeroPrincipal}>
                    {formatarPreco(caixa.dados.totalVendas)}
                  </span>
                </div>
              </div>

              {caixaFechado ? (
                <p className={styles.rodapeCard}>
                  Fechado{caixa.dados.responsavel ? ` por ${caixa.dados.responsavel}` : ""}
                  {caixa.dados.fechadoEm ? ` às ${formatarHora(caixa.dados.fechadoEm)}` : ""}.
                </p>
              ) : (
                <Link href="/caixa" className={styles.linkCard}>
                  Ir para o fechamento →
                </Link>
              )}
            </>
          ) : null}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitulo}>Estoque baixo</span>
            {estoque.dados && estoque.dados.totalCritico > 0 && (
              <span className={styles.badgeAlerta}>{estoque.dados.totalCritico}</span>
            )}
          </div>

          {carregando ? (
            <div className={styles.skeleton} />
          ) : estoque.erro ? (
            <p className={styles.erro}>{estoque.erro}</p>
          ) : estoque.dados && estoque.dados.itens.length > 0 ? (
            <>
              <ul className={styles.listaEstoque}>
                {estoque.dados.itens.map((p) => (
                  <li key={p.id} className={styles.itemEstoque}>
                    <WarningAmberOutlinedIcon className={styles.iconeAlerta} sx={{ fontSize: 16 }} />
                    <span className={styles.produtoNome} title={p.nome}>
                      {p.nome}
                    </span>
                    <span className={styles.produtoQtd}>
                      {p.qtdEstoque} / mín. {p.estoqueMinimo}
                    </span>
                  </li>
                ))}
              </ul>
              {estoque.dados.totalCritico > LIMITE_ESTOQUE_BAIXO && (
                <p className={styles.rodapeCard}>
                  e mais {estoque.dados.totalCritico - LIMITE_ESTOQUE_BAIXO} produto(s) em nível crítico.
                </p>
              )}
              <p className={styles.rodapeCard}>Avise o gerente para repor.</p>
            </>
          ) : (
            <p className={styles.vazio}>Nenhum produto em nível crítico. 👍</p>
          )}
        </div>
      </section>
    </div>
  );
}
