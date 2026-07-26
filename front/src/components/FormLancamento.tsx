"use client";

// =============================================================
// components/FormLancamento.tsx — Formulário de Lançamento Financeiro
// =============================================================
// Parametrizado por "tipo" para que o SCRUM-21 (receita, Igor)
// reaproveite sem reescrever. Nenhum acoplamento a DESPESA.
//
// D-5: este componente NÃO importa nada de services/lancamentos.ts.
//      Todos os dados (categorias, registrar) chegam via props do hook.
// =============================================================

import { useState, useEffect, type FormEvent } from "react";
import type {
  TipoLancamento,
  CategoriaFinanceira,
  LancamentoRequest,
  LancamentoResponse,
  DescricaoLancamento,
} from "@/services/lancamentos";
import styles from "./forms.module.css";

// ── Mapa de descrições por tipo ────────────────────────────────
// Cada entrada: [valor do enum Java, rótulo em português]
const DESCRICOES_DESPESA: [DescricaoLancamento, string][] = [
  ["COMPRA_MERCADORIA",  "Compra de mercadoria"],
  ["SALARIO",           "Salário"],
  ["ALUGUEL",           "Aluguel"],
  ["CONTA_LUZ",         "Conta de luz"],
  ["CONTA_AGUA",        "Conta de água"],
  ["INTERNET_TELEFONE", "Internet / Telefone"],
  ["MANUTENCAO",        "Manutenção"],
  ["IMPOSTOS",          "Impostos"],
  ["FORNECEDORES",      "Fornecedores"],
  ["OUTRA_DESPESA",     "Outra despesa"],
];

const DESCRICOES_RECEITA: [DescricaoLancamento, string][] = [
  ["VENDA",              "Venda"],
  ["RECEBIMENTO_DIVIDA", "Recebimento de dívida"],
  ["OUTRA_RECEITA",      "Outra receita"],
];

function descrPorTipo(tipo: TipoLancamento) {
  return tipo === "DESPESA" ? DESCRICOES_DESPESA : DESCRICOES_RECEITA;
}

// Retorna a data de hoje em yyyy-MM-dd (formato do <input type="date">)
function hoje(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ── Props ──────────────────────────────────────────────────────

interface FormLancamentoProps {
  // D-5: dados e ações chegam do hook, componente não acessa o service
  tipo: TipoLancamento;
  categorias: CategoriaFinanceira[];
  erroCategorias: string | null;
  mutando: boolean;
  onRegistrar: (req: LancamentoRequest) => Promise<LancamentoResponse>;
}

// ── Componente ─────────────────────────────────────────────────

export default function FormLancamento({
  tipo,
  categorias,
  erroCategorias,
  mutando,
  onRegistrar,
}: FormLancamentoProps) {
  const descricoes = descrPorTipo(tipo);

  // Estado do formulário
  const [valor,    setValor]    = useState("");
  const [data,     setData]     = useState(hoje);
  const [catId,    setCatId]    = useState("");
  const [descricao, setDescricao] = useState<DescricaoLancamento | "">(
    () => descricoes[0][0] // primeiro do tipo ao montar
  );

  // Feedback de UI
  const [erroLocal,  setErroLocal]  = useState<string | null>(null);
  const [sucesso,    setSucesso]    = useState(false);

  // Quando o tipo muda (DESPESA ↔ RECEITA), reseta a descrição
  // para que nunca fique um valor inválido pré-selecionado.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setDescricao(descrPorTipo(tipo)[0][0]);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [tipo]);

  // Limpa o feedback de sucesso após 3 s
  useEffect(() => {
    if (!sucesso) return;
    const t = setTimeout(() => setSucesso(false), 3000);
    return () => clearTimeout(t);
  }, [sucesso]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErroLocal(null);

    // Validação no cliente — critério 3 do card
    const valorNum = parseFloat(valor);
    if (!valor || isNaN(valorNum) || valorNum <= 0) {
      setErroLocal("O valor deve ser maior que zero.");
      return;
    }
    if (!catId) {
      setErroLocal("Selecione uma categoria.");
      return;
    }
    if (!descricao) {
      setErroLocal("Selecione uma descrição.");
      return;
    }

    const req: LancamentoRequest = {
      valor: valorNum,
      data,
      categoriaId: Number(catId),
      descricao: descricao as DescricaoLancamento,
      tipo,
    };

    try {
      await onRegistrar(req);
      // Limpa o formulário após sucesso
      setValor("");
      setData(hoje());
      setCatId("");
      setDescricao(descricoes[0][0]);
      setSucesso(true);
    } catch (err) {
      // Erro de rede/backend: a mensagem já vem formatada pelo hook
      setErroLocal(err instanceof Error ? err.message : "Falha ao registrar o lançamento.");
    }
  }

  const tituloTipo = tipo === "DESPESA" ? "Registrar despesa" : "Registrar receita";
  const desabilitado = mutando || !!erroCategorias;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
        {tituloTipo}
      </h2>

      {/* Valor */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="lanc-valor">Valor (R$)</label>
        <input
          id="lanc-valor"
          className={styles.input}
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0,00"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          disabled={desabilitado}
          required
        />
      </div>

      {/* Data */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="lanc-data">Data</label>
        <input
          id="lanc-data"
          className={styles.input}
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          disabled={desabilitado}
          required
        />
      </div>

      {/* Categoria — substitui o select se houver erro de carregamento */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="lanc-categoria">Categoria</label>
        {erroCategorias ? (
          <p className={`${styles.alert} ${styles.alertError}`} style={{ margin: 0 }}>
            {erroCategorias}
          </p>
        ) : (
          <select
            id="lanc-categoria"
            className={styles.select}
            value={catId}
            onChange={(e) => setCatId(e.target.value)}
            disabled={mutando}
            required
          >
            <option value="">Selecione...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        )}
      </div>

      {/* Descrição */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="lanc-descricao">Descrição</label>
        <select
          id="lanc-descricao"
          className={styles.select}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value as DescricaoLancamento)}
          disabled={desabilitado}
          required
        >
          {descricoes.map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Feedback de erro local (validação + backend) */}
      {erroLocal && (
        <p className={`${styles.alert} ${styles.alertError}`} role="alert">
          {erroLocal}
        </p>
      )}

      {/* Feedback de sucesso */}
      {sucesso && (
        <p className={`${styles.alert} ${styles.alertSuccess}`} role="status">
          Lançamento registrado com sucesso.
        </p>
      )}

      <button
        type="submit"
        className={styles.button}
        disabled={desabilitado}
      >
        {mutando ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
