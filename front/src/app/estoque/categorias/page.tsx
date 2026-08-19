"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  listarCategorias,
  criarCategoria,
  editarCategoria,
  removerCategoria,
  type CategoriaProduto,
} from "@/services/categorias";
import { mensagemDeErro } from "@/lib/apiError";
import AppShell from "@/components/AppShell";
import Breadcrumb from "@/components/Breadcrumb";
import styles from "../estoque.module.css";
import s from "./categorias.module.css";

export default function CategoriasPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState<"criar" | "editar" | "excluir" | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaProduto | null>(null);
  const [formNome, setFormNome] = useState("");
  const [modalErro, setModalErro] = useState<string | null>(null);
  const [modalSucesso, setModalSucesso] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.perfil !== "ADMIN") {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!isAuthenticated || user?.perfil !== "ADMIN") return;
    carregar();
  }, [isAuthenticated, user]);

  async function carregar() {
    setLoading(true);
    setErro(null);
    try {
      const data = await listarCategorias();
      setCategorias(data);
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível carregar as categorias."));
    } finally {
      setLoading(false);
    }
  }

  function abrirCriar() {
    setFormNome(""); setModalErro(null); setModalSucesso(null);
    setModalAberto("criar");
  }

  function abrirEditar(cat: CategoriaProduto) {
    setCategoriaSelecionada(cat); setFormNome(cat.nome);
    setModalErro(null); setModalSucesso(null);
    setModalAberto("editar");
  }

  function abrirExcluir(cat: CategoriaProduto) {
    setCategoriaSelecionada(cat); setModalErro(null); setModalSucesso(null);
    setModalAberto("excluir");
  }

  function fecharModal() {
    setModalAberto(null); setCategoriaSelecionada(null);
    setModalErro(null); setModalSucesso(null);
  }

  async function handleCriar(e: FormEvent) {
    e.preventDefault();
    if (!formNome.trim()) return;
    setMutating(true); setModalErro(null);
    try {
      await criarCategoria(formNome.trim());
      setModalSucesso("Categoria criada com sucesso!");
      await carregar();
      setTimeout(fecharModal, 900);
    } catch (err) {
      setModalErro(mensagemDeErro(err, "Não foi possível criar a categoria."));
    } finally { setMutating(false); }
  }

  async function handleEditar(e: FormEvent) {
    e.preventDefault();
    if (!categoriaSelecionada || !formNome.trim()) return;
    setMutating(true); setModalErro(null);
    try {
      await editarCategoria(categoriaSelecionada.id, formNome.trim());
      setModalSucesso("Categoria atualizada com sucesso!");
      await carregar();
      setTimeout(fecharModal, 900);
    } catch (err) {
      setModalErro(mensagemDeErro(err, "Não foi possível atualizar a categoria."));
    } finally { setMutating(false); }
  }

  async function handleExcluir() {
    if (!categoriaSelecionada) return;
    setMutating(true); setModalErro(null);
    try {
      await removerCategoria(categoriaSelecionada.id);
      setModalSucesso("Categoria removida com sucesso!");
      await carregar();
      setTimeout(fecharModal, 900);
    } catch (err) {
      setModalErro(mensagemDeErro(err, "Não foi possível remover a categoria."));
    } finally { setMutating(false); }
  }

  if (authLoading || !isAuthenticated || user?.perfil !== "ADMIN") {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Verificando permissões...</p>
      </div>
    );
  }

  return (
    <AppShell title="Tipos de Produtos">
      <Breadcrumb
        trilha={[
          { label: "Produtos", href: "/estoque" },
          { label: "Tipos de Produtos" },
        ]}
      />

      {erro && <div className={s.alertError} role="alert">{erro}</div>}

      {/* Cabeçalho da seção */}
      <div className={s.sectionHeader}>
        <div>
          <h2 className={s.sectionTitle}>Categorias</h2>
          <p className={s.sectionSub}>
            {categorias.length} {categorias.length === 1 ? "categoria cadastrada" : "categorias cadastradas"}
          </p>
        </div>
        <button className={s.primaryBtn} onClick={abrirCriar}>
          + Nova Categoria
        </button>
      </div>

      {/* Lista de categorias */}
      {loading ? (
        <div className={s.loadingInline}>
          <div className={s.spinner} />
          <p>Carregando categorias...</p>
        </div>
      ) : categorias.length === 0 ? (
        <div className={s.empty}>
          <div className={s.emptyIcon}>🏷️</div>
          <h3>Nenhuma categoria cadastrada</h3>
          <p>Crie a primeira categoria para organizar os produtos.</p>
        </div>
      ) : (
        <div className={s.list}>
          {categorias.map((cat, idx) => {
            const count = cat.quantidadeProdutos ?? 0;
            return (
              <div key={cat.id} className={s.listItem}>
                <div className={s.listLeft}>
                  <span className={s.listIndex}>{idx + 1}</span>
                  <span className={s.listName}>{cat.nome}</span>
                </div>
                <div className={s.listRight}>
                  <span className={`${s.badge} ${count === 0 ? s.badgeEmpty : ""}`}>
                    {count} {count === 1 ? "produto" : "produtos"}
                  </span>
                  <button
                    className={`${s.iconBtn} ${s.iconBtnEdit}`}
                    title="Editar"
                    onClick={() => abrirEditar(cat)}
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    className={`${s.iconBtn} ${s.iconBtnDelete}`}
                    title="Excluir"
                    onClick={() => abrirExcluir(cat)}
                    disabled={count > 0}
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Criar ── */}
      {modalAberto === "criar" && (
        <div className={s.overlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2>Nova Categoria</h2>
              <button className={s.closeBtn} onClick={fecharModal} disabled={mutating}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCriar}>
              <div className={s.modalBody}>
                {modalErro && <div className={s.alertError}>{modalErro}</div>}
                {modalSucesso && <div className={s.alertSuccess}>{modalSucesso}</div>}
                <div className={s.formGroup}>
                  <label htmlFor="criar-nome">Nome *</label>
                  <input id="criar-nome" className={s.formInput} type="text" placeholder="Ex: Bebidas" value={formNome} onChange={(e) => setFormNome(e.target.value)} disabled={mutating} required autoFocus />
                </div>
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.secondaryBtn} onClick={fecharModal} disabled={mutating}>Cancelar</button>
                <button type="submit" className={s.primaryBtn} disabled={mutating || !formNome.trim()}>{mutating ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Editar ── */}
      {modalAberto === "editar" && (
        <div className={s.overlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2>Editar Categoria</h2>
              <button className={s.closeBtn} onClick={fecharModal} disabled={mutating}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEditar}>
              <div className={s.modalBody}>
                {modalErro && <div className={s.alertError}>{modalErro}</div>}
                {modalSucesso && <div className={s.alertSuccess}>{modalSucesso}</div>}
                <div className={s.formGroup}>
                  <label htmlFor="editar-nome">Nome *</label>
                  <input id="editar-nome" className={s.formInput} type="text" value={formNome} onChange={(e) => setFormNome(e.target.value)} disabled={mutating} required autoFocus />
                </div>
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.secondaryBtn} onClick={fecharModal} disabled={mutating}>Cancelar</button>
                <button type="submit" className={s.primaryBtn} disabled={mutating || !formNome.trim()}>{mutating ? "Salvando..." : "Salvar Alterações"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Excluir ── */}
      {modalAberto === "excluir" && (
        <div className={s.overlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2>Remover Categoria</h2>
              <button className={s.closeBtn} onClick={fecharModal} disabled={mutating}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className={s.modalBody}>
              {modalErro && <div className={s.alertError}>{modalErro}</div>}
              {modalSucesso && <div className={s.alertSuccess}>{modalSucesso}</div>}
              <p className={s.confirmText}>
                Tem certeza que deseja remover <strong>{categoriaSelecionada?.nome}</strong>?
              </p>
              <p className={s.confirmHint}>
                ⚠️ A remoção será rejeitada se houver produtos vinculados a esta categoria.
              </p>
            </div>
            <div className={s.modalFooter}>
              <button type="button" className={s.secondaryBtn} onClick={fecharModal} disabled={mutating}>Cancelar</button>
              <button type="button" className={s.dangerBtn} onClick={handleExcluir} disabled={mutating}>{mutating ? "Removendo..." : "Confirmar Remoção"}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
