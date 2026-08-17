"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLancamentos } from "@/hooks/useLancamentos";
import { useSaldo } from "@/hooks/useSaldo";
import type { TipoLancamento } from "@/services/lancamentos";
import AppShell from "@/components/AppShell";
import FormLancamento from "@/components/FormLancamento";
import PainelSaldo from "@/components/PainelSaldo";

function formatarReal(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function corDoTipo(tipo: TipoLancamento): string {
  return tipo === "RECEITA" ? "var(--color-success)" : "var(--color-error)";
}

const COLUNAS = "1fr 110px 150px 150px";

const estiloSelect: React.CSSProperties = {
  height: "36px", padding: "0 10px", fontSize: "14px",
  border: "1px solid var(--color-border)", borderRadius: "6px",
  background: "var(--color-bg-card)", color: "var(--color-text)", cursor: "pointer",
};

const estiloInput: React.CSSProperties = {
  height: "36px", padding: "0 10px", fontSize: "14px",
  border: "1px solid var(--color-border)", borderRadius: "6px",
  background: "var(--color-bg-card)", color: "var(--color-text)",
};

const estiloLabel: React.CSSProperties = {
  fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500,
};

const estiloLinkCategorias: React.CSSProperties = {
  fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)",
  textDecoration: "none", padding: "6px 12px", borderRadius: "6px",
  border: "1px solid var(--color-border)", background: "var(--color-bg-card)",
};

export default function PaginaLancamentos() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.perfil !== "ADMIN")) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  const {
    saldo,
    periodo,
    setPeriodo,
    loading: loadingSaldo,
    erro: erroSaldo,
    recarregar: recarregarSaldo,
  } = useSaldo("mes");

  const {
    lancamentosPage,
    categorias,
    erroCategorias,
    loading,
    mutando,
    erro,
    filtros,
    setFiltros,
    page,
    setPage,
    registrar,
  } = useLancamentos(recarregarSaldo);

  if (authLoading || !isAuthenticated || user?.perfil !== "ADMIN") return null;

  const lancamentos    = lancamentosPage?.content ?? [];
  const totalPages     = lancamentosPage?.totalPages ?? 1;
  const totalElements  = lancamentosPage?.totalElements ?? 0;

  const categoriasFiltro = filtros.tipo
    ? categorias.filter((c) => c.tipo === filtros.tipo)
    : categorias;

  return (
    <AppShell title="Financeiro">
      {/* Acesso ao CRUD de categorias: é lá que a categoria "Venda",
          pré-requisito do PDV, é cadastrada. */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
        <Link href="/financeiro/categorias" style={estiloLinkCategorias}>
          Gerenciar categorias
        </Link>
      </div>

      <PainelSaldo
        saldo={saldo}
        periodo={periodo}
        loading={loadingSaldo}
        erro={erroSaldo}
        onPeriodoChange={setPeriodo}
      />

      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>

        <div style={{
          width: "320px",
          flexShrink: 0,
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "10px",
          padding: "24px",
          boxShadow: "var(--shadow-sm)",
        }}>
          <FormLancamento
            categorias={categorias}
            erroCategorias={erroCategorias}
            mutando={mutando}
            onRegistrar={registrar}
          />
        </div>

        <div style={{ flex: 1, minWidth: "320px" }}>

          <div style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            padding: "16px 20px",
            marginBottom: "16px",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={estiloLabel} htmlFor="filtro-tipo">Tipo</label>
              <select
                id="filtro-tipo"
                value={filtros.tipo ?? ""}
                onChange={(e) =>
                  setFiltros({
                    tipo: e.target.value ? (e.target.value as TipoLancamento) : undefined,
                    categoriaId: undefined,
                  })
                }
                style={estiloSelect}
              >
                <option value="">Todos</option>
                <option value="RECEITA">Receitas</option>
                <option value="DESPESA">Despesas</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={estiloLabel} htmlFor="filtro-cat">Categoria</label>
              <select
                id="filtro-cat"
                value={filtros.categoriaId ?? ""}
                onChange={(e) =>
                  setFiltros({ categoriaId: e.target.value ? Number(e.target.value) : undefined })
                }
                style={estiloSelect}
              >
                <option value="">Todas as categorias</option>
                {categoriasFiltro.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={estiloLabel} htmlFor="filtro-inicio">De</label>
              <input
                id="filtro-inicio"
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ dataInicio: e.target.value })}
                style={estiloInput}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={estiloLabel} htmlFor="filtro-fim">Até</label>
              <input
                id="filtro-fim"
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ dataFim: e.target.value })}
                style={estiloInput}
              />
            </div>

            <button
              onClick={() =>
                setFiltros({ tipo: undefined, categoriaId: undefined, dataInicio: "", dataFim: "" })
              }
              style={{
                height: "36px", padding: "0 14px", fontSize: "13px",
                border: "1px solid var(--color-border)", borderRadius: "6px",
                background: "var(--color-bg)", color: "var(--color-text-secondary)", cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Limpar filtros
            </button>
          </div>

          <div style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            boxShadow: "var(--shadow-sm)",
            overflow: "hidden",
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: COLUNAS,
              padding: "12px 20px",
              borderBottom: "1px solid var(--color-border)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}>
              <span>Descrição / Categoria</span>
              <span style={{ textAlign: "center" }}>Tipo</span>
              <span style={{ textAlign: "right" }}>Valor</span>
              <span style={{ textAlign: "center" }}>Data</span>
            </div>

            {erro && (
              <div style={{ padding: "24px 20px", color: "var(--color-error)", fontSize: "14px" }}>
                {erro}
              </div>
            )}

            {!erro && loading && (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>
                Carregando...
              </div>
            )}

            {!erro && !loading && lancamentos.length === 0 && (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>
                Nenhum lançamento encontrado para os filtros selecionados.
              </div>
            )}

            {!erro && !loading && lancamentos.map((l, idx) => (
              <div
                key={l.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: COLUNAS,
                  padding: "14px 20px",
                  borderBottom: idx < lancamentos.length - 1 ? "1px solid var(--color-border)" : "none",
                  alignItems: "center",
                  fontSize: "14px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, color: "var(--color-text)" }}>
                    {l.descricao}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    {l.categoria.nome}
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: corDoTipo(l.tipo),
                    background: l.tipo === "RECEITA"
                      ? "color-mix(in srgb, var(--color-success) 12%, transparent)"
                      : "color-mix(in srgb, var(--color-error) 10%, transparent)",
                    borderRadius: "999px",
                    padding: "3px 10px",
                  }}>
                    {l.tipo === "RECEITA" ? "Receita" : "Despesa"}
                  </span>
                </div>

                <div style={{ textAlign: "right", fontWeight: 600, color: corDoTipo(l.tipo) }}>
                  {formatarReal(l.valor)}
                </div>

                <div style={{ textAlign: "center", color: "var(--color-text-secondary)" }}>
                  {formatarDataHora(l.dataHora)}
                </div>
              </div>
            ))}
          </div>

          {!erro && !loading && totalElements > 0 && (
            <div style={{
              marginTop: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "13px",
              color: "var(--color-text-secondary)",
            }}>
              <span>{totalElements} registro{totalElements !== 1 ? "s" : ""}</span>

              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  style={{
                    height: "30px", padding: "0 10px", fontSize: "13px",
                    border: "1px solid var(--color-border)", borderRadius: "6px",
                    background: page === 0 ? "var(--color-bg)" : "var(--color-bg-card)",
                    color: page === 0 ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                    cursor: page === 0 ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Anterior
                </button>

                <span style={{ padding: "0 6px" }}>
                  Página {page + 1} de {totalPages}
                </span>

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                  style={{
                    height: "30px", padding: "0 10px", fontSize: "13px",
                    border: "1px solid var(--color-border)", borderRadius: "6px",
                    background: page >= totalPages - 1 ? "var(--color-bg)" : "var(--color-bg-card)",
                    color: page >= totalPages - 1 ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                    cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
