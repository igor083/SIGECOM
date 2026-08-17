"use client";

// Categorias financeiras: CRUD do admin.
//
// Tela obrigatória, não conveniência: a categoria "Venda" (RECEITA) é
// pré-requisito de operação — VendaService.confirmar() recusa a venda sem
// ela. A aplicação não cria mais categoria nenhuma sozinha, então é aqui
// que o primeiro cadastro acontece. O aviso no topo aparece justamente
// enquanto essa categoria não existir.

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  listarCategoriasFinanceiras,
  criarCategoriaFinanceira,
  editarCategoriaFinanceira,
  removerCategoriaFinanceira,
  type CategoriaFinanceira,
  type TipoLancamento,
} from "@/services/categoriasFinanceiras";
import { mensagemDeErro } from "@/lib/apiError";
import AppShell from "@/components/AppShell";
import s from "./categorias.module.css";

const CATEGORIA_VENDA = "Venda";

export default function CategoriasFinanceirasPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<TipoLancamento | "">("");

  const [modalAberto, setModalAberto] = useState<"criar" | "editar" | "excluir" | null>(null);
  const [selecionada, setSelecionada] = useState<CategoriaFinanceira | null>(null);
  const [formNome, setFormNome] = useState("");
  const [formTipo, setFormTipo] = useState<TipoLancamento>("DESPESA");
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
      setCategorias(await listarCategoriasFinanceiras());
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível carregar as categorias."));
    } finally {
      setLoading(false);
    }
  }

  const temCategoriaVenda = categorias.some(
    (c) => c.nome.trim().toLowerCase() === CATEGORIA_VENDA.toLowerCase() && c.tipo === "RECEITA"
  );

  const visiveis = filtroTipo ? categorias.filter((c) => c.tipo === filtroTipo) : categorias;
  const receitas = categorias.filter((c) => c.tipo === "RECEITA").length;
  const despesas = categorias.length - receitas;

  function abrirCriar(tipoInicial: TipoLancamento = "DESPESA", nomeInicial = "") {
    setFormNome(nomeInicial);
    setFormTipo(tipoInicial);
    setModalErro(null);
    setModalSucesso(null);
    setModalAberto("criar");
  }

  function abrirEditar(cat: CategoriaFinanceira) {
    setSelecionada(cat);
    setFormNome(cat.nome);
    setFormTipo(cat.tipo);
    setModalErro(null);
    setModalSucesso(null);
    setModalAberto("editar");
  }

  function abrirExcluir(cat: CategoriaFinanceira) {
    setSelecionada(cat);
    setModalErro(null);
    setModalSucesso(null);
    setModalAberto("excluir");
  }

  function fecharModal() {
    setModalAberto(null);
    setSelecionada(null);
    setModalErro(null);
    setModalSucesso(null);
  }

  async function handleCriar(e: FormEvent) {
    e.preventDefault();
    if (!formNome.trim()) return;
    setMutating(true);
    setModalErro(null);
    try {
      await criarCategoriaFinanceira(formNome.trim(), formTipo);
      setModalSucesso("Categoria criada com sucesso!");
      await carregar();
      setTimeout(fecharModal, 900);
    } catch (err) {
      setModalErro(mensagemDeErro(err, "Não foi possível criar a categoria."));
    } finally {
      setMutating(false);
    }
  }

  async function handleEditar(e: FormEvent) {
    e.preventDefault();
    if (!selecionada || !formNome.trim()) return;
    setMutating(true);
    setModalErro(null);
    try {
      await editarCategoriaFinanceira(selecionada.id, formNome.trim(), formTipo);
      setModalSucesso("Categoria atualizada com sucesso!");
      await carregar();
      setTimeout(fecharModal, 900);
    } catch (err) {
      setModalErro(mensagemDeErro(err, "Não foi possível atualizar a categoria."));
    } finally {
      setMutating(false);
    }
  }

  async function handleExcluir() {
    if (!selecionada) return;
    setMutating(true);
    setModalErro(null);
    try {
      await removerCategoriaFinanceira(selecionada.id);
      setModalSucesso("Categoria removida com sucesso!");
      await carregar();
      setTimeout(fecharModal, 900);
    } catch (err) {
      setModalErro(mensagemDeErro(err, "Não foi possível remover a categoria."));
    } finally {
      setMutating(false);
    }
  }

  if (authLoading || !isAuthenticated || user?.perfil !== "ADMIN") {
    return (
      <div className={s.loadingInline}>
        <div className={s.spinner} />
        <p>Verificando permissões...</p>
      </div>
    );
  }

  return (
    <AppShell title="Categorias Financeiras">
      {erro && <div className={s.alertError} role="alert">{erro}</div>}

      {/* Sem a categoria "Venda" o PDV não fecha venda nenhuma — avisa e resolve no clique. */}
      {!loading && !temCategoriaVenda && (
        <div className={s.alertWarning} role="alert">
          <div>
            <strong>A categoria &ldquo;Venda&rdquo; (Receita) não existe.</strong>
            <p>
              Toda venda confirmada no PDV é lançada no financeiro nessa categoria. Sem ela,
              o registro de vendas falha.
            </p>
          </div>
          <button className={s.primaryBtn} onClick={() => abrirCriar("RECEITA", CATEGORIA_VENDA)}>
            Criar agora
          </button>
        </div>
      )}

      <div className={s.sectionHeader}>
        <div>
          <h2 className={s.sectionTitle}>Categorias</h2>
          <p className={s.sectionSub}>
            {receitas} de receita &middot; {despesas} de despesa
          </p>
        </div>
        <div className={s.headerActions}>
          <select
            className={s.select}
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as TipoLancamento | "")}
            aria-label="Filtrar por tipo"
          >
            <option value="">Todos os tipos</option>
            <option value="RECEITA">Somente receitas</option>
            <option value="DESPESA">Somente despesas</option>
          </select>
          <button className={s.primaryBtn} onClick={() => abrirCriar()}>
            + Nova Categoria
          </button>
        </div>
      </div>

      {loading ? (
        <div className={s.loadingInline}>
          <div className={s.spinner} />
          <p>Carregando categorias...</p>
        </div>
      ) : visiveis.length === 0 ? (
        <div className={s.empty}>
          <div className={s.emptyIcon}>🏷️</div>
          <h3>Nenhuma categoria {filtroTipo ? "para este filtro" : "cadastrada"}</h3>
          <p>As categorias classificam receitas e despesas no módulo financeiro.</p>
        </div>
      ) : (
        <div className={s.list}>
          {visiveis.map((cat) => (
            <div key={cat.id} className={s.listItem}>
              <div className={s.listLeft}>
                <span
                  className={`${s.tipoTag} ${cat.tipo === "RECEITA" ? s.tipoReceita : s.tipoDespesa}`}
                >
                  {cat.tipo === "RECEITA" ? "Receita" : "Despesa"}
                </span>
                <span className={s.listName}>{cat.nome}</span>
                {cat.protegida && (
                  <span className={s.badgeSistema} title="Categoria do sistema: não pode ser editada nem removida">
                    sistema
                  </span>
                )}
              </div>
              <div className={s.listRight}>
                <button
                  className={`${s.iconBtn} ${s.iconBtnEdit}`}
                  title={cat.protegida ? "Categoria do sistema não pode ser editada" : "Editar"}
                  onClick={() => abrirEditar(cat)}
                  disabled={cat.protegida}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  className={`${s.iconBtn} ${s.iconBtnDelete}`}
                  title={cat.protegida ? "Categoria do sistema não pode ser removida" : "Excluir"}
                  onClick={() => abrirExcluir(cat)}
                  disabled={cat.protegida}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
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
                  <input
                    id="criar-nome"
                    className={s.formInput}
                    type="text"
                    placeholder="Ex: Aluguel"
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    disabled={mutating}
                    required
                    autoFocus
                  />
                </div>
                <div className={s.formGroup}>
                  <label htmlFor="criar-tipo">Tipo *</label>
                  <select
                    id="criar-tipo"
                    className={s.formInput}
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as TipoLancamento)}
                    disabled={mutating}
                  >
                    <option value="DESPESA">Despesa</option>
                    <option value="RECEITA">Receita</option>
                  </select>
                </div>
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.secondaryBtn} onClick={fecharModal} disabled={mutating}>Cancelar</button>
                <button type="submit" className={s.primaryBtn} disabled={mutating || !formNome.trim()}>
                  {mutating ? "Salvando..." : "Salvar"}
                </button>
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
                  <input
                    id="editar-nome"
                    className={s.formInput}
                    type="text"
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    disabled={mutating}
                    required
                    autoFocus
                  />
                </div>
                <div className={s.formGroup}>
                  <label htmlFor="editar-tipo">Tipo *</label>
                  <select
                    id="editar-tipo"
                    className={s.formInput}
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as TipoLancamento)}
                    disabled={mutating}
                  >
                    <option value="DESPESA">Despesa</option>
                    <option value="RECEITA">Receita</option>
                  </select>
                  <span className={s.formHint}>
                    Trocar o tipo só é possível enquanto a categoria não tiver lançamentos.
                  </span>
                </div>
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.secondaryBtn} onClick={fecharModal} disabled={mutating}>Cancelar</button>
                <button type="submit" className={s.primaryBtn} disabled={mutating || !formNome.trim()}>
                  {mutating ? "Salvando..." : "Salvar Alterações"}
                </button>
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
                Tem certeza que deseja remover <strong>{selecionada?.nome}</strong>?
              </p>
              <p className={s.confirmHint}>
                ⚠️ A remoção será rejeitada se houver lançamentos vinculados a esta categoria.
              </p>
            </div>
            <div className={s.modalFooter}>
              <button type="button" className={s.secondaryBtn} onClick={fecharModal} disabled={mutating}>Cancelar</button>
              <button type="button" className={s.dangerBtn} onClick={handleExcluir} disabled={mutating}>
                {mutating ? "Removendo..." : "Confirmar Remoção"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
