"use client";

// Tela de Fechamento de Caixa (US-022 / US-023)

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useFechamento } from "@/hooks/useFechamento";
import type { Fechamento } from "@/services/fechamento";
import AppShell from "@/components/AppShell";
import styles from "./caixa.module.css";

function formatarReal(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// monta a data local; new Date("yyyy-MM-dd") cai no dia anterior por fuso
function formatarData(data: string): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR");
}

type Tom = "ok" | "sobra" | "falta";

function calcularDivergencia(valorContado: number, saldoCalculado: number): {
  diferenca: number;
  rotulo: string;
  tom: Tom;
} {
  const diferenca = Number((valorContado - saldoCalculado).toFixed(2));
  if (diferenca === 0) return { diferenca, rotulo: "Caixa confere", tom: "ok" };
  if (diferenca > 0) return { diferenca, rotulo: "Sobra em caixa", tom: "sobra" };
  return { diferenca, rotulo: "Falta em caixa", tom: "falta" };
}

function LinhaResumo({ rotulo, valor, destaque = false }: {
  rotulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div className={destaque ? styles.linhaDestaque : styles.linha}>
      <span className={styles.rotulo}>{rotulo}</span>
      <span className={styles.valor}>{formatarReal(valor)}</span>
    </div>
  );
}

function ResumoDoDia({ dados }: { dados: Fechamento }) {
  return (
    <div className={styles.resumo}>
      <LinhaResumo rotulo="Total de vendas" valor={dados.totalVendas} />
      <LinhaResumo rotulo="Total de receitas" valor={dados.totalReceitas} />
      <LinhaResumo rotulo="Total de despesas" valor={dados.totalDespesas} />
      <LinhaResumo rotulo="Saldo calculado" valor={dados.saldoCalculado} destaque />
    </div>
  );
}

function Divergencia({ valorContado, saldoCalculado }: {
  valorContado: number;
  saldoCalculado: number;
}) {
  const { diferenca, rotulo, tom } = calcularDivergencia(valorContado, saldoCalculado);
  return (
    <div className={`${styles.divergencia} ${styles[tom]}`}>
      <span className={styles.divergenciaRotulo}>{rotulo}</span>
      <span className={styles.divergenciaValor}>
        {diferenca > 0 ? "+" : ""}{formatarReal(diferenca)}
      </span>
    </div>
  );
}

export default function CaixaPage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { fechamento, jaFechado, loading, erro, confirmando, erroConfirmar, confirmar } =
    useFechamento();

  const [valorFisico, setValorFisico] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) return null;

  const valorContado = Number(valorFisico);
  const valorValido = valorFisico !== "" && !Number.isNaN(valorContado) && valorContado >= 0;

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (!valorValido || confirmando) return;
    await confirmar(valorContado);
  }

  return (
    <AppShell title="Fechamento de Caixa">
      <div className={styles.pagina}>
        {loading && <p className={styles.estadoVazio}>Calculando o fechamento do dia…</p>}
        {erro && <div className={styles.alertaErro}>{erro}</div>}

        {!loading && !erro && fechamento && (
          <section className={styles.card}>
            <header className={styles.cabecalho}>
              <div>
                <h2 className={styles.titulo}>
                  {jaFechado ? "Caixa fechado" : "Conferência de caixa"}
                </h2>
                <p className={styles.subtitulo}>
                  {jaFechado && fechamento.fechadoEm
                    ? `Fechado por ${fechamento.responsavel ?? "—"} em ${formatarDataHora(fechamento.fechadoEm)}`
                    : `Movimento de ${formatarData(fechamento.dataFechamento)}`}
                </p>
              </div>
              <span className={jaFechado ? styles.selo : styles.seloAberto}>
                {jaFechado ? "Fechado" : "Aberto"}
              </span>
            </header>

            <ResumoDoDia dados={fechamento} />

            {jaFechado ? (
              <>
                <LinhaResumo
                  rotulo="Valor contado"
                  valor={fechamento.valorFisicoInformado ?? 0}
                />
                <Divergencia
                  valorContado={fechamento.valorFisicoInformado ?? 0}
                  saldoCalculado={fechamento.saldoCalculado}
                />
                <p className={styles.nota}>
                  O fechamento do dia já foi confirmado e não pode ser alterado.
                </p>
              </>
            ) : (
              <form className={styles.formulario} onSubmit={handleSubmit}>
                <label className={styles.rotuloCampo} htmlFor="valor-fisico">
                  Valor físico contado em caixa
                </label>
                <div className={styles.campoValor}>
                  <span className={styles.prefixo} aria-hidden="true">R$</span>
                  <input
                    id="valor-fisico"
                    className={styles.entrada}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={valorFisico}
                    onChange={(e) => setValorFisico(e.target.value)}
                    disabled={confirmando}
                  />
                </div>
                <p className={styles.ajuda}>
                  Conte o dinheiro em caixa e informe o total. Use ponto para os centavos.
                </p>

                {valorValido && (
                  <Divergencia
                    valorContado={valorContado}
                    saldoCalculado={fechamento.saldoCalculado}
                  />
                )}

                {erroConfirmar && <div className={styles.alertaErro}>{erroConfirmar}</div>}

                <button className={styles.botao} type="submit" disabled={!valorValido || confirmando}>
                  {confirmando ? "Confirmando…" : "Confirmar fechamento"}
                </button>
              </form>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}
