"use client";

// Formulario unico de lancamento (receita ou despesa).
// O tipo e escolhido aqui e filtra a lista de categorias.
// D-5: nao chama a API, tudo vem do hook por props

import { useState, useEffect, useMemo, type FormEvent } from "react";
import type {
  TipoLancamento,
  CategoriaFinanceira,
  LancamentoRequest,
  LancamentoResponse,
} from "@/services/lancamentos";
import styles from "./forms.module.css";

// o input date so aceita yyyy-MM-dd
function hoje(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

interface FormLancamentoProps {
  categorias: CategoriaFinanceira[]; // todas (receita e despesa); filtramos pelo tipo aqui
  erroCategorias: string | null;
  mutando: boolean;
  onRegistrar: (req: LancamentoRequest) => Promise<LancamentoResponse>;
}

export default function FormLancamento({
  categorias,
  erroCategorias,
  mutando,
  onRegistrar,
}: FormLancamentoProps) {
  const [tipo,      setTipo]      = useState<TipoLancamento>("RECEITA");
  const [valor,     setValor]     = useState("");
  const [data,      setData]      = useState(hoje);
  const [catId,     setCatId]     = useState("");
  const [descricao, setDescricao] = useState("");

  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [sucesso,   setSucesso]   = useState(false);

  // categorias do tipo selecionado — cada categoria ja carrega o proprio tipo
  const categoriasDoTipo = useMemo(
    () => categorias.filter((c) => c.tipo === tipo),
    [categorias, tipo]
  );

  useEffect(() => {
    if (!sucesso) return;
    const t = setTimeout(() => setSucesso(false), 3000);
    return () => clearTimeout(t);
  }, [sucesso]);

  // ao trocar o tipo a categoria escolhida pode nao existir mais no novo tipo
  function handleTipoChange(novo: TipoLancamento) {
    setTipo(novo);
    setCatId("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErroLocal(null);

    // criterio 3 do card, nao pode zero nem negativo
    const valorNum = parseFloat(valor);
    if (!valor || isNaN(valorNum) || valorNum <= 0) {
      setErroLocal("O valor deve ser maior que zero.");
      return;
    }
    if (!catId) {
      setErroLocal("Selecione uma categoria.");
      return;
    }
    if (!descricao.trim()) {
      setErroLocal("Informe uma descrição.");
      return;
    }

    const req: LancamentoRequest = {
      valor: valorNum,
      data,
      categoriaId: Number(catId),
      descricao: descricao.trim(),
      tipo,
    };

    try {
      await onRegistrar(req);
      setValor("");
      setData(hoje());
      setCatId("");
      setDescricao("");
      setSucesso(true);
    } catch (err) {
      setErroLocal(err instanceof Error ? err.message : "Falha ao registrar o lançamento.");
    }
  }

  const desabilitado = mutando || !!erroCategorias;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
        Novo lançamento
      </h2>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="lanc-tipo">Tipo</label>
        <select
          id="lanc-tipo"
          className={styles.select}
          value={tipo}
          onChange={(e) => handleTipoChange(e.target.value as TipoLancamento)}
          disabled={desabilitado}
        >
          <option value="RECEITA">Receita</option>
          <option value="DESPESA">Despesa</option>
        </select>
      </div>

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
            {categoriasDoTipo.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="lanc-descricao">Descrição</label>
        <input
          id="lanc-descricao"
          className={styles.input}
          type="text"
          maxLength={255}
          placeholder={tipo === "DESPESA" ? "Ex.: conta de luz de julho" : "Ex.: venda do balcão"}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          disabled={desabilitado}
          required
        />
      </div>

      {erroLocal && (
        <p className={`${styles.alert} ${styles.alertError}`} role="alert">
          {erroLocal}
        </p>
      )}

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
