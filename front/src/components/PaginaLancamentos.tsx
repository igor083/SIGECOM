"use client";

// Tela unica do Financeiro (SCRUM-21/SCRUM-22): receitas e despesas juntas.
// Reaproveita FormLancamento (que escolhe o tipo), useLancamentos, useSaldo
// e PainelSaldo. O tipo aqui e filtro da lista e coluna da tabela.

import { useEffect } from "react";
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
  // iso = "2026-07-26T14:30:00" → "26/07/2026 14:30"
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// receita = verde, despesa = vermelho — usado no valor e na etiqueta de tipo
function corDoTipo(tipo: TipoLancamento): string {
  return tipo === "RECEITA" ? "#16a34a" : "#dc2626";
}

const COLUNAS = "1fr 110px 150px 150px"; // Descrição/Categoria | Tipo | Valor | Data

export default function PaginaLancamentos() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  // D-2: quem nao for ADMIN vai pro login
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.perfil !== "ADMIN")) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  // o saldo vem primeiro porque o useLancamentos precisa do recarregar dele
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

  // o filtro de categoria mostra as categorias do tipo filtrado (ou todas)
  const categoriasFiltro = filtros.tipo
    ? categorias.filter((c) => c.tipo === filtros.tipo)
    : categorias;

  return (
    <AppShell title="Financeiro">
      <PainelSaldo
        saldo={saldo}
        periodo={periodo}
        loading={loadingSaldo}
        erro={erroSaldo}
        onPeriodoChange={setPeriodo}
      />

      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>

        <div style={{
          width: "320px",
          flexShrink: 0,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "24px",
          boxShadow: "0 1px 4px rgba(0,0,0,.06)",
        }}>
          <FormLancamento
            categorias={categorias}
            erroCategorias={erroCategorias}
            mutando={mutando}
            onRegistrar={registrar}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>

          <div style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "16px 20px",
            marginBottom: "16px",
            boxShadow: "0 1px 4px rgba(0,0,0,.06)",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}
                     htmlFor="filtro-tipo">Tipo</label>
              <select
                id="filtro-tipo"
                value={filtros.tipo ?? ""}
                onChange={(e) =>
                  // trocar o tipo limpa a categoria (pode nao existir no novo tipo)
                  setFiltros({
                    tipo: e.target.value ? (e.target.value as TipoLancamento) : undefined,
                    categoriaId: undefined,
                  })
                }
                style={{
                  height: "36px", padding: "0 10px", fontSize: "14px",
                  border: "1px solid #e2e8f0", borderRadius: "6px",
                  background: "#fff", color: "#0f172a", cursor: "pointer",
                }}
              >
                <option value="">Todos</option>
                <option value="RECEITA">Receitas</option>
                <option value="DESPESA">Despesas</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}
                     htmlFor="filtro-cat">Categoria</label>
              <select
                id="filtro-cat"
                value={filtros.categoriaId ?? ""}
                onChange={(e) =>
                  setFiltros({ categoriaId: e.target.value ? Number(e.target.value) : undefined })
                }
                style={{
                  height: "36px", padding: "0 10px", fontSize: "14px",
                  border: "1px solid #e2e8f0", borderRadius: "6px",
                  background: "#fff", color: "#0f172a", cursor: "pointer",
                }}
              >
                <option value="">Todas as categorias</option>
                {categoriasFiltro.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}
                     htmlFor="filtro-inicio">De</label>
              <input
                id="filtro-inicio"
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ dataInicio: e.target.value })}
                style={{
                  height: "36px", padding: "0 10px", fontSize: "14px",
                  border: "1px solid #e2e8f0", borderRadius: "6px",
                  background: "#fff", color: "#0f172a",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}
                     htmlFor="filtro-fim">Até</label>
              <input
                id="filtro-fim"
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ dataFim: e.target.value })}
                style={{
                  height: "36px", padding: "0 10px", fontSize: "14px",
                  border: "1px solid #e2e8f0", borderRadius: "6px",
                  background: "#fff", color: "#0f172a",
                }}
              />
            </div>

            <button
              onClick={() =>
                setFiltros({ tipo: undefined, categoriaId: undefined, dataInicio: "", dataFim: "" })
              }
              style={{
                height: "36px", padding: "0 14px", fontSize: "13px",
                border: "1px solid #e2e8f0", borderRadius: "6px",
                background: "#f8fafc", color: "#475569", cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Limpar filtros
            </button>
          </div>

          <div style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            boxShadow: "0 1px 4px rgba(0,0,0,.06)",
            overflow: "hidden",
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: COLUNAS,
              padding: "12px 20px",
              borderBottom: "1px solid #f1f5f9",
              fontSize: "12px",
              fontWeight: 600,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}>
              <span>Descrição / Categoria</span>
              <span style={{ textAlign: "center" }}>Tipo</span>
              <span style={{ textAlign: "right" }}>Valor</span>
              <span style={{ textAlign: "center" }}>Data</span>
            </div>

            {erro && (
              <div style={{ padding: "24px 20px", color: "#dc2626", fontSize: "14px" }}>
                {erro}
              </div>
            )}

            {!erro && loading && (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                Carregando...
              </div>
            )}

            {!erro && !loading && lancamentos.length === 0 && (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
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
                  borderBottom: idx < lancamentos.length - 1 ? "1px solid #f8fafc" : "none",
                  alignItems: "center",
                  fontSize: "14px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, color: "#0f172a" }}>
                    {l.descricao}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                    {l.categoria.nome}
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: corDoTipo(l.tipo),
                    background: l.tipo === "RECEITA" ? "#f0fdf4" : "#fef2f2",
                    borderRadius: "999px",
                    padding: "3px 10px",
                  }}>
                    {l.tipo === "RECEITA" ? "Receita" : "Despesa"}
                  </span>
                </div>

                <div style={{ textAlign: "right", fontWeight: 600, color: corDoTipo(l.tipo) }}>
                  {formatarReal(l.valor)}
                </div>

                <div style={{ textAlign: "center", color: "#64748b" }}>
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
              color: "#64748b",
            }}>
              <span>{totalElements} registro{totalElements !== 1 ? "s" : ""}</span>

              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  style={{
                    height: "30px", padding: "0 10px", fontSize: "13px",
                    border: "1px solid #e2e8f0", borderRadius: "6px",
                    background: page === 0 ? "#f8fafc" : "#fff",
                    color: page === 0 ? "#cbd5e1" : "#475569",
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
                    border: "1px solid #e2e8f0", borderRadius: "6px",
                    background: page >= totalPages - 1 ? "#f8fafc" : "#fff",
                    color: page >= totalPages - 1 ? "#cbd5e1" : "#475569",
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
