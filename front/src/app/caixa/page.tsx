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

// SCRUM-161: compara com o esperado na gaveta (fundo + receitas - despesas),
// nunca com o resultado do dia. Gaveta de dinheiro nao fica negativa.
function calcularDivergencia(valorContado: number, saldoEsperado: number): {
  diferenca: number;
  rotulo: string;
  tom: Tom;
} {
  const diferenca = Number((valorContado - saldoEsperado).toFixed(2));
  if (diferenca === 0) return { diferenca, rotulo: "Caixa confere", tom: "ok" };
  if (diferenca > 0) return { diferenca, rotulo: "Sobra em caixa", tom: "sobra" };
  return { diferenca, rotulo: "Falta em caixa", tom: "falta" };
}

// O campo de fundo e editavel, entao o esperado tem que ser recalculado na tela.
// Nao da pra usar o saldoEsperado da API direto: ele veio com o fundo padrao.
function calcularEsperado(dados: Fechamento, fundoInformado: number): number {
  return Number((fundoInformado + dados.totalReceitas - dados.totalDespesas).toFixed(2));
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

function ResumoDoDia({ dados, esperado }: { dados: Fechamento; esperado: number }) {
  return (
    <div className={styles.resumo}>
      <LinhaResumo rotulo="Total de vendas" valor={dados.totalVendas} />
      <LinhaResumo rotulo="Total de receitas" valor={dados.totalReceitas} />
      <LinhaResumo rotulo="Total de despesas" valor={dados.totalDespesas} />
      {/* "Saldo calculado" grudado num numero negativo foi o que fez o bug passar */}
      <LinhaResumo rotulo="Resultado do dia" valor={dados.saldoCalculado} />
      <LinhaResumo rotulo="Esperado em caixa" valor={esperado} destaque />
    </div>
  );
}

function Divergencia({ valorContado, saldoEsperado }: {
  valorContado: number;
  saldoEsperado: number;
}) {
  const { diferenca, rotulo, tom } = calcularDivergencia(valorContado, saldoEsperado);
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
  // fundo de troco: pre-preenchido com o padrao que veio da API, mas editavel
  const [fundo, setFundo] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) return null;

  const valorContado = Number(valorFisico);
  const valorValido = valorFisico !== "" && !Number.isNaN(valorContado) && valorContado >= 0;

  const fundoTexto = fundo ?? (fechamento ? String(fechamento.fundoTroco) : "");
  const fundoInformado = Number(fundoTexto);
  const fundoValido = fundoTexto !== "" && !Number.isNaN(fundoInformado) && fundoInformado >= 0;

  const esperado = fechamento
    ? calcularEsperado(fechamento, fundoValido ? fundoInformado : 0)
    : 0;

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (!valorValido || !fundoValido || confirmando) return;
    await confirmar(valorContado, fundoInformado);
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

            <ResumoDoDia
              dados={fechamento}
              esperado={jaFechado ? fechamento.saldoEsperado : esperado}
            />

            {jaFechado ? (
              <>
                <LinhaResumo rotulo="Fundo de troco" valor={fechamento.fundoTroco} />
                <LinhaResumo
                  rotulo="Valor contado"
                  valor={fechamento.valorFisicoInformado ?? 0}
                />
                <Divergencia
                  valorContado={fechamento.valorFisicoInformado ?? 0}
                  saldoEsperado={fechamento.saldoEsperado}
                />
                <p className={styles.nota}>
                  O fechamento do dia já foi confirmado e não pode ser alterado.
                </p>
              </>
            ) : (
              <form className={styles.formulario} onSubmit={handleSubmit}>
                <label className={styles.rotuloCampo} htmlFor="fundo-troco">
                  Fundo de troco
                </label>
                <div className={styles.campoValor}>
                  <span className={styles.prefixo} aria-hidden="true">R$</span>
                  <input
                    id="fundo-troco"
                    className={styles.entrada}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={fundoTexto}
                    onChange={(e) => setFundo(e.target.value)}
                    disabled={confirmando}
                  />
                </div>
                <p className={styles.ajuda}>
                  Quanto tinha na gaveta quando o caixa abriu.
                </p>

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

                {valorValido && fundoValido && (
                  <>
                    <Divergencia valorContado={valorContado} saldoEsperado={esperado} />
                    {valorContado >= fundoInformado && (
                      <>
                        <LinhaResumo
                          rotulo="Sangria sugerida"
                          valor={Number((valorContado - fundoInformado).toFixed(2))}
                        />
                        <p className={styles.ajuda}>
                          Valor a retirar, deixando o fundo de troco na gaveta.
                        </p>
                      </>
                    )}
                  </>
                )}

                {erroConfirmar && <div className={styles.alertaErro}>{erroConfirmar}</div>}

                <button
                  className={styles.botao}
                  type="submit"
                  disabled={!valorValido || !fundoValido || confirmando}
                >
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
