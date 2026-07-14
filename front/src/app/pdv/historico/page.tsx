"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import {
  listarVendas,
  type PageVendaResumo,
  type TipoPagamento,
} from "@/services/vendas";
import { mensagemDeErro } from "@/lib/apiError";
import styles from "./historico.module.css";

const PAGE_SIZE = 10;

function formatarPreco(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function codigoVenda(id: number): string {
  return `#V${id.toString().padStart(4, "0")}`;
}

const ROTULOS_PAGAMENTO: Record<TipoPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  DEBITO: "Débito",
  CREDITO: "Crédito",
};

export default function HistoricoVendasPage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [page, setPage] = useState(0);
  // Valores em edição nos campos de data (não disparam busca sozinhos).
  const [inputDataInicio, setInputDataInicio] = useState("");
  const [inputDataFim, setInputDataFim] = useState("");
  // Filtro efetivamente aplicado — só muda ao enviar o formulário ou limpar.
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [pagina, setPagina] = useState<PageVendaResumo | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const resp = await listarVendas({
        page,
        size: PAGE_SIZE,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
      });
      setPagina(resp);
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível carregar o histórico."));
      setPagina(null);
    } finally {
      setLoading(false);
    }
  }, [page, dataInicio, dataFim]);

  // Busca ao entrar na tela e a cada troca de página ou de filtro aplicado
  // (envio do formulário / limpar) — nunca a cada tecla digitada na data.
  useEffect(() => {
    if (!isAuthenticated) return;
    carregar();
  }, [isAuthenticated, carregar]);

  if (authLoading || !isAuthenticated) return null;

  const vendas = pagina?.content ?? [];
  const totalPages = pagina?.totalPages ?? 1;
  const totalElements = pagina?.totalElements ?? 0;

  function aplicarFiltro(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    setDataInicio(inputDataInicio);
    setDataFim(inputDataFim);
  }

  function limparFiltro() {
    setInputDataInicio("");
    setInputDataFim("");
    setDataInicio("");
    setDataFim("");
    setPage(0);
  }

  return (
    <AppShell title="PDV — Histórico de vendas">
      <div className={styles.topo}>
        <Link href="/pdv" className={styles.voltar}>
          ← Voltar ao PDV
        </Link>
      </div>

      {erro && (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          {erro}
        </div>
      )}

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Vendas registradas</h2>
        <span className={styles.contador}>
          {totalElements} {totalElements === 1 ? "venda" : "vendas"}
        </span>
      </div>

      {/* Filtros de data — a busca só é disparada ao enviar o formulário */}
      <form className={styles.filters} onSubmit={aplicarFiltro}>
        <div className={styles.filterGroup}>
          <label htmlFor="dt-ini" className={styles.filterLabel}>
            De
          </label>
          <input
            id="dt-ini"
            className={styles.filterInput}
            type="date"
            value={inputDataInicio}
            onChange={(e) => setInputDataInicio(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="dt-fim" className={styles.filterLabel}>
            Até
          </label>
          <input
            id="dt-fim"
            className={styles.filterInput}
            type="date"
            value={inputDataFim}
            onChange={(e) => setInputDataFim(e.target.value)}
          />
        </div>
        <div className={styles.filterAcoes}>
          <button type="submit" className={styles.primaryBtn} disabled={loading}>
            Buscar
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={limparFiltro}
            disabled={loading || (!inputDataInicio && !inputDataFim && !dataInicio && !dataFim)}
          >
            Limpar
          </button>
        </div>
      </form>

      {/* Tabela */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Carregando vendas...</p>
        </div>
      ) : vendas.length === 0 ? (
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIcon}>🧾</div>
          <h3>Nenhuma venda encontrada</h3>
          <p>Tente ajustar o filtro de datas ou registre uma nova venda.</p>
          <Link href="/pdv/nova" className={styles.primaryBtn}>
            + Nova venda
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Data / hora</th>
                  <th>Operador</th>
                  <th>Pagamento</th>
                  <th style={{ textAlign: "right" }}>Itens</th>
                  <th style={{ textAlign: "right" }}>Subtotal</th>
                  <th style={{ textAlign: "right" }}>Desconto</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((v) => (
                  <tr key={v.id}>
                    <td className={styles.codigo}>{codigoVenda(v.id)}</td>
                    <td>{formatarDataHora(v.dataHora)}</td>
                    <td>{v.operador}</td>
                    <td>
                      <span className={styles.pagamentoBadge}>
                        {ROTULOS_PAGAMENTO[v.tipoPagamento]}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>{v.qtdItens}</td>
                    <td style={{ textAlign: "right" }}>{formatarPreco(v.subtotal)}</td>
                    <td style={{ textAlign: "right", color: "#dc2626" }}>
                      {v.descontoTotal > 0 ? `− ${formatarPreco(v.descontoTotal)}` : "—"}
                    </td>
                    <td className={styles.totalCell}>{formatarPreco(v.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              Página <strong>{page + 1}</strong> de <strong>{totalPages}</strong> ({totalElements} itens)
            </span>
            <div className={styles.pageBtns}>
              <button
                className={styles.pageBtn}
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`${styles.pageBtn} ${page === i ? styles.pageBtnActive : ""}`}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className={styles.pageBtn}
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                Próxima
              </button>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
