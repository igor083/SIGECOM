"use client";

import { useState } from "react";
import { useMetaVendaDiaria } from "@/hooks/useMetaVendaDiaria";
import { useAuth } from "@/hooks/useAuth";
import { atualizarMetaVendaDiaria } from "@/services/dashboard";
import { mensagemDeErro } from "@/lib/apiError";
import styles from "./MetaVendaDiaria.module.css";

function formatarPreco(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MetaVendaDiaria() {
  const { dados, carregando, erro, recarregar } = useMetaVendaDiaria();
  const { user } = useAuth();
  const podeEditar = user?.perfil === "ADMIN";

  const [editando, setEditando] = useState(false);
  const [valorInput, setValorInput] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  if (carregando) {
    return <div className={styles.card}><span className={styles.skeleton} /></div>;
  }

  if (erro || !dados) {
    return (
      <div className={styles.card}>
        <span className={styles.erroTexto}>{erro ?? "Sem dados."}</span>
      </div>
    );
  }

  function iniciarEdicao() {
    setValorInput(dados!.metaDia.toFixed(2));
    setErroSalvar(null);
    setEditando(true);
  }

  function cancelarEdicao() {
    setEditando(false);
    setErroSalvar(null);
  }

  async function salvarMeta(e: React.FormEvent) {
    e.preventDefault();
    const valor = Number(valorInput.replace(",", "."));
    if (!Number.isFinite(valor) || valor <= 0) {
      setErroSalvar("Informe um valor de meta maior que zero.");
      return;
    }

    setSalvando(true);
    setErroSalvar(null);
    try {
      await atualizarMetaVendaDiaria(valor);
      await recarregar();
      setEditando(false);
    } catch (err) {
      setErroSalvar(mensagemDeErro(err, "Não foi possível salvar a meta."));
    } finally {
      setSalvando(false);
    }
  }

  const noBazul = dados.noBazul;
  const barraLargura = Math.min(dados.percentual, 100);

  return (
    <div className={styles.card}>
      <div className={styles.topo}>
        <span className={styles.titulo}>Meta do dia</span>
        <span className={noBazul ? styles.badgeAzul : styles.badgeAbaixo}>
          {noBazul ? "No azul" : "Abaixo da meta"}
        </span>
      </div>

      <div className={styles.valores}>
        <div className={styles.valorBloco}>
          <span className={styles.valorLabel}>Realizado hoje</span>
          <span className={styles.valorPrincipal}>{formatarPreco(dados.realizadoHoje)}</span>
        </div>
        <div className={styles.separador} />
        <div className={styles.valorBloco}>
          <span className={styles.valorLabel}>Meta</span>
          {!editando ? (
            <span className={styles.valorSecundario}>
              {formatarPreco(dados.metaDia)}
              {podeEditar && (
                <button
                  type="button"
                  className={styles.editarBtn}
                  onClick={iniciarEdicao}
                  aria-label="Editar meta do dia"
                >
                  Editar
                </button>
              )}
            </span>
          ) : (
            <form className={styles.editForm} onSubmit={salvarMeta}>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className={styles.editInput}
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
                autoFocus
                disabled={salvando}
              />
              <button type="submit" className={styles.salvarBtn} disabled={salvando}>
                {salvando ? "..." : "Salvar"}
              </button>
              <button
                type="button"
                className={styles.cancelarBtn}
                onClick={cancelarEdicao}
                disabled={salvando}
              >
                Cancelar
              </button>
            </form>
          )}
        </div>
        <div className={styles.separador} />
        <div className={styles.valorBloco}>
          <span className={styles.valorLabel}>Atingido</span>
          <span className={noBazul ? styles.percentualAzul : styles.percentualAbaixo}>
            {dados.percentual.toFixed(1)}%
          </span>
        </div>
      </div>

      {erroSalvar && <span className={styles.erroTexto}>{erroSalvar}</span>}

      {/* Barra de progresso */}
      <div className={styles.barraFundo}>
        <div
          className={noBazul ? styles.barraAzul : styles.barraAbaixo}
          style={{ width: `${barraLargura}%` }}
        />
      </div>
    </div>
  );
}
