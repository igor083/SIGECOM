"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  listarUsuarios, criarUsuario, editarUsuario, removerUsuario, resetarSenha,
  type Usuario, type PageUsuario, type PerfilUsuario,
} from "@/services/usuarios";
import { mensagemDeErro } from "@/lib/apiError";
import AppShell from "@/components/AppShell";
import Paginacao from "@/components/Paginacao";
import LegendaObrigatorios from "@/components/LegendaObrigatorios";
import ErroCampo from "@/components/ErroCampo";
import { useValidacaoFormulario } from "@/hooks/useValidacaoFormulario";
import { useFocoNoModal } from "@/hooks/useFocoNoModal";
import { regras, obrigatorio, email, tamanhoMinimo } from "@/lib/validacao";
import s from "./usuarios.module.css";

const X_ICON = (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Novo usuário, na ordem da tela. Regras do CadastroRequest no back
// (@NotBlank, @Email, @Size(min = 6)). Perfil é rádio e sempre tem valor.
const CAMPOS_CRIAR = {
  nome:  { id: "c-nome",  regra: obrigatorio("Informe o nome do usuário.") },
  email: { id: "c-email", regra: regras(obrigatorio("Informe o e-mail."), email) },
  senha: { id: "c-senha", regra: regras(
    obrigatorio("Informe a senha."),
    tamanhoMinimo(6, "A senha deve ter no mínimo 6 caracteres."),
  ) },
};

export default function UsuariosPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [paginaUsuarios, setPaginaUsuarios] = useState<PageUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroPeril, setFiltroPerfil] = useState<PerfilUsuario | "">("");
  const [page, setPage] = useState(0);
  const SIZE = 10;

  // Modal
  type ModalTipo = "criar" | "editar" | "excluir" | "resetSenha" | null;
  const [modalAberto, setModalAberto] = useState<ModalTipo>(null);
  const [selecionado, setSelecionado] = useState<Usuario | null>(null);
  const [modalErro, setModalErro] = useState<string | null>(null);
  const [modalSucesso, setModalSucesso] = useState<string | null>(null);

  // Form criar
  const [formNome, setFormNome] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSenha, setFormSenha] = useState("");
  const [formPerfil, setFormPerfil] = useState<PerfilUsuario>("FUNCIONARIO");
  const [confirmouPermissoes, setConfirmouPermissoes] = useState(false);
  const validacaoCriar = useValidacaoFormulario(CAMPOS_CRIAR, {
    nome: formNome, email: formEmail, senha: formSenha,
  });
  const { mensagem, propsCampo } = validacaoCriar;
  const modalCriarRef = useFocoNoModal<HTMLDivElement>(modalAberto === "criar");

  // Form editar
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPerfil, setEditPerfil] = useState<PerfilUsuario>("FUNCIONARIO");

  // Form reset senha
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.perfil !== "ADMIN") router.replace("/login");
  }, [authLoading, isAuthenticated, user, router]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await listarUsuarios({
        busca: busca || undefined,
        perfil: filtroPeril || undefined,
        page,
        size: SIZE,
      });
      setPaginaUsuarios(data);
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível carregar os usuários."));
    } finally {
      setLoading(false);
    }
  }, [busca, filtroPeril, page]);

  useEffect(() => {
    if (!isAuthenticated || user?.perfil !== "ADMIN") return;
    /* eslint-disable react-hooks/set-state-in-effect */
    carregar();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [carregar, isAuthenticated, user]);

  function fecharModal() {
    setModalAberto(null); setSelecionado(null);
    setModalErro(null); setModalSucesso(null);
  }

  function abrirCriar() {
    setFormNome(""); setFormEmail(""); setFormSenha(""); setFormPerfil("FUNCIONARIO");
    setConfirmouPermissoes(false);
    validacaoCriar.limpar();
    setModalErro(null); setModalSucesso(null);
    setModalAberto("criar");
  }

  function abrirEditar(u: Usuario) {
    setSelecionado(u);
    setEditNome(u.nome); setEditEmail(u.email);
    setEditPerfil(u.perfil);
    setModalErro(null); setModalSucesso(null);
    setModalAberto("editar");
  }

  function abrirExcluir(u: Usuario) {
    setSelecionado(u); setModalErro(null); setModalSucesso(null);
    setModalAberto("excluir");
  }

  function abrirResetSenha(u: Usuario) {
    setSelecionado(u); setNovaSenha(""); setConfirmSenha("");
    setModalErro(null); setModalSucesso(null);
    setModalAberto("resetSenha");
  }

  async function handleCriar(e: FormEvent) {
    e.preventDefault();
    if (!validacaoCriar.validarTudo()) return;
    setMutating(true); setModalErro(null);
    try {
      await criarUsuario({ nome: formNome.trim(), email: formEmail.trim(), senha: formSenha, perfil: formPerfil });
      setModalSucesso("Usuário criado com sucesso!");
      await carregar();
      setTimeout(fecharModal, 900);
    } catch (err) {
      setModalErro(mensagemDeErro(err, "Não foi possível criar o usuário."));
    } finally { setMutating(false); }
  }

  async function handleEditar(e: FormEvent) {
    e.preventDefault();
    if (!selecionado) return;
    setMutating(true); setModalErro(null);
    try {
      await editarUsuario(selecionado.id, {
        nome: editNome.trim(), email: editEmail.trim(),
        perfil: editPerfil,
      });
      setModalSucesso("Usuário atualizado com sucesso!");
      await carregar();
      setTimeout(fecharModal, 900);
    } catch (err) {
      setModalErro(mensagemDeErro(err, "Não foi possível atualizar o usuário."));
    } finally { setMutating(false); }
  }

  async function handleExcluir() {
    if (!selecionado) return;
    setMutating(true); setModalErro(null);
    try {
      await removerUsuario(selecionado.id);
      setModalSucesso("Usuário removido com sucesso!");
      await carregar();
      setTimeout(fecharModal, 900);
    } catch (err) {
      setModalErro(mensagemDeErro(err, "Não foi possível remover o usuário."));
    } finally { setMutating(false); }
  }

  async function handleResetSenha(e: FormEvent) {
    e.preventDefault();
    if (!selecionado) return;
    if (novaSenha.length < 6) { setModalErro("A senha deve ter no mínimo 6 caracteres."); return; }
    if (novaSenha !== confirmSenha) { setModalErro("As senhas não coincidem."); return; }
    setMutating(true); setModalErro(null);
    try {
      await resetarSenha(selecionado.id, novaSenha);
      setModalSucesso("Senha redefinida com sucesso!");
      setTimeout(fecharModal, 900);
    } catch (err) {
      setModalErro(mensagemDeErro(err, "Não foi possível redefinir a senha."));
    } finally { setMutating(false); }
  }

  const usuarios = paginaUsuarios?.content ?? [];
  const totalPages = paginaUsuarios?.totalPages ?? 1;
  const totalElements = paginaUsuarios?.totalElements ?? 0;

  if (authLoading || !isAuthenticated || user?.perfil !== "ADMIN") {
    return (
      <div className={s.loadingContainer}>
        <div className={s.spinner} />
        <p>Verificando permissões...</p>
      </div>
    );
  }

  return (
    <AppShell title="Usuários">
      {erro && <div className={`${s.alert} ${s.alertError}`}>{erro}</div>}

      {/* Header */}
      <div className={s.sectionHeader}>
        <h2 className={s.sectionTitle}>Gerenciar Usuários</h2>
        <button className={s.primaryBtn} onClick={abrirCriar}>+ Novo Usuário</button>
      </div>

      {/* Filtros */}
      <div className={s.filters}>
        <div className={s.searchWrapper}>
          <svg className={s.searchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className={s.searchInput}
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPage(0); }}
          />
        </div>
        <select
          className={s.selectFilter}
          value={filtroPeril}
          onChange={(e) => { setFiltroPerfil(e.target.value as PerfilUsuario | ""); setPage(0); }}
        >
          <option value="">Todos os perfis</option>
          <option value="ADMIN">Administrador</option>
          <option value="FUNCIONARIO">Funcionário</option>
        </select>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className={s.loadingInline}>
          <div className={s.spinner} />
          <p>Carregando usuários...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className={s.emptyContainer}>
          <div className={s.emptyIcon}>👤</div>
          <h3>Nenhum usuário encontrado</h3>
          <p>Tente ajustar os filtros ou cadastre um novo usuário.</p>
        </div>
      ) : (
        <>
          <div className={s.tableWrapper}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th>Cadastrado em</th>
                  <th style={{ width: 110 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className={s.userCell}>
                        <span className={s.userName}>
                          {u.nome}
                          {u.senhaTemporaria && <span className={s.tempSenhaBadge}>senha temp.</span>}
                        </span>
                        <span className={s.userEmail}>{u.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={u.perfil === "ADMIN" ? s.badgeAdmin : s.badgeFunc}>
                        {u.perfil === "ADMIN" ? "Admin" : "Funcionário"}
                      </span>
                    </td>
                    {/* Sem coluna de status: a API só devolve usuários ativos,
                        então o valor seria sempre "Ativo". */}
                    <td className={s.dateCell}>
                      {formatarData(u.criadoEm)}
                    </td>
                    <td>
                      <div className={s.actionsCell}>
                        <button className={`${s.iconBtn} ${s.iconBtnEdit}`} title="Editar" onClick={() => abrirEditar(u)}>
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        {u.perfil === "FUNCIONARIO" && (
                          <button className={`${s.iconBtn} ${s.iconBtnReset}`} title="Redefinir Senha" onClick={() => abrirResetSenha(u)}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </button>
                        )}
                        <button
                          className={`${s.iconBtn} ${s.iconBtnDelete}`}
                          title={u.email === user?.email ? "Não é possível remover o próprio usuário" : "Excluir"}
                          disabled={u.email === user?.email}
                          onClick={() => abrirExcluir(u)}
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacao
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            rotulo="usuários"
            onPageChange={setPage}
          />
        </>
      )}

      {/* ── MODAL CRIAR ── */}
      {modalAberto === "criar" && (
        <div className={s.modalOverlay}>
          <div className={s.modal} ref={modalCriarRef} role="dialog" aria-modal="true" aria-labelledby="c-titulo">
            <div className={s.modalHeader}>
              <h2 id="c-titulo">Novo Usuário</h2>
              <button type="button" className={s.closeBtn} onClick={fecharModal} disabled={mutating} aria-label="Fechar">{X_ICON}</button>
            </div>
            <form onSubmit={handleCriar} noValidate>
              <div className={s.modalBody}>
                {modalErro && <div className={`${s.alert} ${s.alertError}`}>{modalErro}</div>}
                {modalSucesso && <div className={`${s.alert} ${s.alertSuccess}`}>{modalSucesso}</div>}
                <LegendaObrigatorios />
                <div className={s.formGrid}>
                  <div className={s.formGroupFull}>
                    <label htmlFor="c-nome">Nome *</label>
                    <input id="c-nome" className={s.formInput} type="text" placeholder="Nome completo" value={formNome} onChange={(e) => setFormNome(e.target.value)} disabled={mutating} required aria-required="true" {...propsCampo("nome")} />
                    <ErroCampo idCampo="c-nome" mensagem={mensagem("nome")} />
                  </div>
                  <div className={s.formGroupFull}>
                    <label htmlFor="c-email">E-mail *</label>
                    <input id="c-email" className={s.formInput} type="email" placeholder="email@exemplo.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} disabled={mutating} required aria-required="true" {...propsCampo("email")} />
                    <ErroCampo idCampo="c-email" mensagem={mensagem("email")} />
                  </div>
                  <div className={s.formGroup}>
                    <label htmlFor="c-senha">Senha *</label>
                    <input id="c-senha" className={s.formInput} type="password" placeholder="Mínimo 6 caracteres" value={formSenha} onChange={(e) => setFormSenha(e.target.value)} disabled={mutating} required aria-required="true" minLength={6} {...propsCampo("senha")} />
                    <ErroCampo idCampo="c-senha" mensagem={mensagem("senha")} />
                  </div>
                  <div className={s.formGroup}>
                    <label id="c-perfil-rotulo">Perfil *</label>
                    <div role="radiogroup" aria-labelledby="c-perfil-rotulo" aria-required="true" style={{ display: "flex", gap: "16px", marginTop: "8px", alignItems: "center" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.875rem" }}>
                        <input
                          type="radio"
                          name="formPerfil"
                          value="FUNCIONARIO"
                          checked={formPerfil === "FUNCIONARIO"}
                          onChange={() => setFormPerfil("FUNCIONARIO")}
                          disabled={mutating}
                          required
                        />
                        Funcionário
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.875rem" }}>
                        <input
                          type="radio"
                          name="formPerfil"
                          value="ADMIN"
                          checked={formPerfil === "ADMIN"}
                          onChange={() => setFormPerfil("ADMIN")}
                          disabled={mutating}
                          required
                        />
                        Administrador
                      </label>
                    </div>
                  </div>
                </div>
                <label className={s.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={confirmouPermissoes}
                    onChange={(e) => setConfirmouPermissoes(e.target.checked)}
                    disabled={mutating}
                  />
                  Confirmo a veracidade dos dados e a permissão de acesso deste perfil
                </label>
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.secondaryBtn} onClick={fecharModal} disabled={mutating}>Cancelar</button>
                <button type="submit" className={s.primaryBtn} disabled={mutating || !confirmouPermissoes}>
                  {mutating ? "Salvando..." : "Criar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR ── */}
      {modalAberto === "editar" && selecionado && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2>Editar Usuário</h2>
              <button className={s.closeBtn} onClick={fecharModal} disabled={mutating}>{X_ICON}</button>
            </div>
            <form onSubmit={handleEditar}>
              <div className={s.modalBody}>
                {modalErro && <div className={`${s.alert} ${s.alertError}`}>{modalErro}</div>}
                {modalSucesso && <div className={`${s.alert} ${s.alertSuccess}`}>{modalSucesso}</div>}
                <div className={s.formGrid}>
                  <div className={s.formGroupFull}>
                    <label htmlFor="e-nome">Nome *</label>
                    <input id="e-nome" className={s.formInput} type="text" value={editNome} onChange={(e) => setEditNome(e.target.value)} disabled={mutating} required />
                  </div>
                  <div className={s.formGroupFull}>
                    <label htmlFor="e-email">E-mail *</label>
                    <input id="e-email" className={s.formInput} type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} disabled={mutating} required />
                  </div>
                  <div className={s.formGroup}>
                    <label htmlFor="e-perfil">Perfil *</label>
                    <div style={{ display: "flex", gap: "16px", marginTop: "8px", alignItems: "center" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.875rem" }}>
                        <input
                          type="radio"
                          name="editPerfil"
                          value="FUNCIONARIO"
                          checked={editPerfil === "FUNCIONARIO"}
                          onChange={() => setEditPerfil("FUNCIONARIO")}
                          disabled={mutating}
                        />
                        Funcionário
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.875rem" }}>
                        <input
                          type="radio"
                          name="editPerfil"
                          value="ADMIN"
                          checked={editPerfil === "ADMIN"}
                          onChange={() => setEditPerfil("ADMIN")}
                          disabled={mutating}
                        />
                        Administrador
                      </label>
                    </div>
                  </div>
                  {/* O toggle "Conta ativa" saiu daqui: desligá-lo era uma
                      segunda forma de remover, sem passar pela guarda que
                      impede o admin de se remover — e, como removido não
                      aparece mais na lista, não haveria como desfazer.
                      Remover é só pelo botão de remover. */}
                </div>
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.secondaryBtn} onClick={fecharModal} disabled={mutating}>Cancelar</button>
                <button type="submit" className={s.primaryBtn} disabled={mutating || !editNome.trim() || !editEmail.trim()}>
                  {mutating ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL RESET SENHA ── */}
      {modalAberto === "resetSenha" && selecionado && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2>Redefinir Senha</h2>
              <button className={s.closeBtn} onClick={fecharModal} disabled={mutating}>{X_ICON}</button>
            </div>
            <form onSubmit={handleResetSenha}>
              <div className={s.modalBody}>
                {modalErro && <div className={`${s.alert} ${s.alertError}`}>{modalErro}</div>}
                {modalSucesso && <div className={`${s.alert} ${s.alertSuccess}`}>{modalSucesso}</div>}
                <p className={s.confirmText} style={{ margin: 0 }}>
                  Redefinindo senha de <strong className={s.confirmStrong}>{selecionado.nome}</strong>.
                  O usuário receberá uma senha temporária e será solicitado a alterá-la no próximo acesso.
                </p>
                <div className={s.formGroup}>
                  <label htmlFor="r-senha">Nova Senha *</label>
                  <input id="r-senha" className={s.formInput} type="password" placeholder="Mínimo 6 caracteres" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} disabled={mutating} required minLength={6} />
                </div>
                <div className={s.formGroup}>
                  <label htmlFor="r-confirm">Confirmar Senha *</label>
                  <input id="r-confirm" className={s.formInput} type="password" placeholder="Repita a senha" value={confirmSenha} onChange={(e) => setConfirmSenha(e.target.value)} disabled={mutating} required />
                </div>
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.secondaryBtn} onClick={fecharModal} disabled={mutating}>Cancelar</button>
                <button type="submit" className={s.primaryBtn} disabled={mutating || !novaSenha || !confirmSenha}>
                  {mutating ? "Redefinindo..." : "Redefinir Senha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL EXCLUIR ── */}
      {modalAberto === "excluir" && selecionado && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2>Remover Usuário</h2>
              <button className={s.closeBtn} onClick={fecharModal} disabled={mutating}>{X_ICON}</button>
            </div>
            <div className={s.modalBody}>
              {modalErro && <div className={`${s.alert} ${s.alertError}`}>{modalErro}</div>}
              {modalSucesso && <div className={`${s.alert} ${s.alertSuccess}`}>{modalSucesso}</div>}
              <p className={s.confirmText}>
                Tem certeza que deseja remover o usuário <strong>{selecionado.nome}</strong>?
              </p>
              <p className={s.confirmHint}>
                ⚠️ Ele perde o acesso ao sistema e sai desta lista. Não há como
                reativar. As vendas e lançamentos que ele registrou continuam
                no histórico, no nome dele.
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
