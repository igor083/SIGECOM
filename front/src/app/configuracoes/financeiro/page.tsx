"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import Breadcrumb from "@/components/Breadcrumb";
import { obterParametrosFinanceiros, salvarParametrosFinanceiros } from "@/services/parametrosFinanceiros";
import { calcularMarkup } from "@/lib/markup";
import styles from "./financeiro.module.css";

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
    <AppShell title="Parâmetros Financeiros">
      <Breadcrumb
        trilha={[
          { label: "Configurações", href: "/configuracoes" },
          { label: "Parâmetros Financeiros" },
        ]}
      />

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Markup e Projeção de Margens</h2>

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

          <div className={styles.resumo}>
            <h3 className={styles.resumoTitulo}>Composição de Custo e Markup</h3>
            <p className={styles.resumoLinha}>
              Total de Custos/Margens do Preço: <strong>{somaPercentuais.toFixed(2)}%</strong>
            </p>
            <p className={styles.resumoDestaque}>
              Markup Sugerido: <strong>{markupCalculado > 0 ? markupCalculado.toFixed(3) : "Inválido (>= 100%)"}</strong>
            </p>
            <p className={styles.resumoNota}>
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
    </AppShell>
  );
}
