"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar, { type SidebarItem } from "@/components/Sidebar";
import { obterParametrosFinanceiros, salvarParametrosFinanceiros } from "@/services/parametrosFinanceiros";
import { calcularMarkup } from "@/lib/markup";
import styles from "./financeiro.module.css";

const ADMIN_MENU: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard/admin",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4",
  },
  {
    label: "Produtos",
    href: "/produtos",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    label: "PDV",
    href: "/pdv",
    icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
  },
  {
    label: "Financeiro",
    href: "/financeiro",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    label: "Caixa",
    href: "/caixa",
    icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
  },
  {
    label: "Relatórios",
    href: "/relatorios",
    icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    label: "Usuários",
    href: "/usuarios",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  },
];

export default function ParametrosFinanceirosPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  // Guard de rota (D-2)
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.perfil !== "ADMIN")) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  const [custosFixos, setCustosFixos] = useState(() => obterParametrosFinanceiros().custosFixosPercent.toString());
  const [impostos, setImpostos] = useState(() => obterParametrosFinanceiros().impostosPercent.toString());
  const [taxaMaquininha, setTaxaMaquininha] = useState(() => obterParametrosFinanceiros().taxaMaquininhaPercent.toString());
  const [comissao, setComissao] = useState(() => obterParametrosFinanceiros().comissaoPercent.toString());
  const [lucroDesejado, setLucroDesejado] = useState(() => obterParametrosFinanceiros().lucroDesejadoPercent.toString());
  const [diasUteis, setDiasUteis] = useState(() => obterParametrosFinanceiros().diasUteis.toString());

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const somaPercentuais =
    Number(custosFixos) +
    Number(impostos) +
    Number(taxaMaquininha) +
    Number(comissao) +
    Number(lucroDesejado);

  const markupCalculado = calcularMarkup({
    custosFixosPercent: Number(custosFixos),
    impostosPercent: Number(impostos),
    taxaMaquininhaPercent: Number(taxaMaquininha),
    comissaoPercent: Number(comissao),
    lucroDesejadoPercent: Number(lucroDesejado),
    diasUteis: Number(diasUteis),
  });

  const handleSalvar = (e: FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    const cf = parseFloat(custosFixos);
    const imp = parseFloat(impostos);
    const tm = parseFloat(taxaMaquininha);
    const com = parseFloat(comissao);
    const luc = parseFloat(lucroDesejado);
    const du = parseInt(diasUteis);

    if ([cf, imp, tm, com, luc, du].some(isNaN)) {
      setErro("Todos os campos devem ser preenchidos com valores numéricos válidos.");
      return;
    }

    if ([cf, imp, tm, com, luc].some(val => val < 0)) {
      setErro("Os percentuais não podem ser valores negativos.");
      return;
    }

    if (du <= 0) {
      setErro("Os dias úteis devem ser maiores que zero.");
      return;
    }

    if (cf + imp + tm + com + luc >= 100) {
      setErro("A soma dos percentuais não pode ser igual ou superior a 100% (inviabiliza o markup).");
      return;
    }

    salvarParametrosFinanceiros({
      custosFixosPercent: cf,
      impostosPercent: imp,
      taxaMaquininhaPercent: tm,
      comissaoPercent: com,
      lucroDesejadoPercent: luc,
      diasUteis: du,
    });

    setSucesso("Parâmetros financeiros salvos com sucesso!");
    setTimeout(() => setSucesso(null), 3000);
  };

  if (authLoading || !user || user.perfil !== "ADMIN") {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Verificando permissões de acesso...</p>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar items={ADMIN_MENU} />

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>Parâmetros Financeiros</h1>
        </header>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Markup e Projeção de Margens (ADMIN)</h2>

          {erro && (
            <div className={`${styles.alert} ${styles.alertError}`} role="alert">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className={`${styles.alert} ${styles.alertSuccess}`} role="alert">
              {sucesso}
            </div>
          )}

          <form onSubmit={handleSalvar}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="custos-fixos">Custos Fixos da Loja</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="custos-fixos"
                    className={styles.formInput}
                    type="number"
                    step="0.01"
                    min="0"
                    max="99"
                    value={custosFixos}
                    onChange={(e) => setCustosFixos(e.target.value)}
                    required
                  />
                  <span className={styles.inputSymbol}>%</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="impostos">Impostos (Alíquota Média)</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="impostos"
                    className={styles.formInput}
                    type="number"
                    step="0.01"
                    min="0"
                    max="99"
                    value={impostos}
                    onChange={(e) => setImpostos(e.target.value)}
                    required
                  />
                  <span className={styles.inputSymbol}>%</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="taxa-maquininha">Taxa Média da Maquininha</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="taxa-maquininha"
                    className={styles.formInput}
                    type="number"
                    step="0.01"
                    min="0"
                    max="99"
                    value={taxaMaquininha}
                    onChange={(e) => setTaxaMaquininha(e.target.value)}
                    required
                  />
                  <span className={styles.inputSymbol}>%</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="comissao">Comissão de Vendedores</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="comissao"
                    className={styles.formInput}
                    type="number"
                    step="0.01"
                    min="0"
                    max="99"
                    value={comissao}
                    onChange={(e) => setComissao(e.target.value)}
                    required
                  />
                  <span className={styles.inputSymbol}>%</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="lucro-desejado">Margem de Lucro Desejada</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="lucro-desejado"
                    className={styles.formInput}
                    type="number"
                    step="0.01"
                    min="0"
                    max="99"
                    value={lucroDesejado}
                    onChange={(e) => setLucroDesejado(e.target.value)}
                    required
                  />
                  <span className={styles.inputSymbol}>%</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="dias-uteis">Dias Úteis de Funcionamento</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="dias-uteis"
                    className={styles.formInput}
                    type="number"
                    min="1"
                    max="31"
                    value={diasUteis}
                    onChange={(e) => setDiasUteis(e.target.value)}
                    required
                  />
                  <span className={styles.inputSymbol}>dias</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1.5rem", padding: "1.25rem", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem" }}>Composição de Custo e Markup</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                Total de Custos/Margens do Preço: <strong>{somaPercentuais.toFixed(2)}%</strong>
              </p>
              <p style={{ fontSize: "1.125rem", fontWeight: "700", marginTop: "0.5rem", color: "var(--color-primary)" }}>
                Markup Sugerido: <strong>{markupCalculado > 0 ? markupCalculado.toFixed(3) : "Inválido (>= 100%)"}</strong>
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                Fórmula: Preço = CMV × Markup. Exemplo: Se o custo (CMV) for R$ 50,00, o preço sugerido será R$ {(50 * (markupCalculado > 0 ? markupCalculado : 0)).toFixed(2)}.
              </p>
            </div>

            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={somaPercentuais >= 100}
              >
                Salvar Parâmetros
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
