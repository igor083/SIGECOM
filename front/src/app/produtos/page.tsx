// =============================================================
// app/produtos/page.tsx — Gestão de Produtos (Sprint 2)
// =============================================================
// Tela restrita a ADMIN (D-2).
// Exibe listagem paginada, filtros, cadastro, edição, exclusão
// e ajuste de estoque em modais na mesma página.
// Isolamento completo de camadas (D-5) via useProdutos hook.
// =============================================================

"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useProdutos } from "@/hooks/useProdutos";
import { mensagemDeErro } from "@/lib/apiError";
import type { Produto } from "@/services/produtos";
import styles from "./produtos.module.css";

// Formata preço para o padrão brasileiro
function formatarPreco(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export default function GestaoProdutosPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  
  // Custom hook (D-5) gerenciador de estado e operações dos produtos
  const {
    produtosPage,
    categorias,
    loading,
    mutating,
    erro,
    nome,
    setNome,
    categoriaId,
    setCategoriaId,
    page,
    setPage,
    criar,
    editar,
    excluir,
    ajustarEstoqueProduto,
  } = useProdutos(8); // Exibe 8 itens por página

  // ── Controle dos Modais ──────────────────────────────────────
  const [modalAberto, setModalAberto] = useState<"criar" | "editar" | "estoque" | "excluir" | null>(null);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);

  // ── Formulários Locais ────────────────────────────────────────
  const [formNome, setFormNome] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formPreco, setFormPreco] = useState("");
  const [formEstoqueMinimo, setFormEstoqueMinimo] = useState("");
  const [formCategoriaId, setFormCategoriaId] = useState("");
  
  // Ajuste de Estoque
  const [formQtdEstoque, setFormQtdEstoque] = useState("");

  // Mensagem local de erro/sucesso nos modais
  const [modalErro, setModalErro] = useState<string | null>(null);
  const [modalSucesso, setModalSucesso] = useState<string | null>(null);

  // Guarda de rota (D-2): apenas ADMIN acessa.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.perfil !== "ADMIN") {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Preenche dados para Edição
  const abrirEditar = (prod: Produto) => {
    setProdutoSelecionado(prod);
    setFormNome(prod.nome);
    setFormDescricao(prod.descricao);
    setFormPreco(prod.preco.toString());
    setFormEstoqueMinimo(prod.estoqueMinimo.toString());
    setFormCategoriaId(prod.categoria.id.toString());
    setModalErro(null);
    setModalSucesso(null);
    setModalAberto("editar");
  };

  // Preenche dados para Ajuste de Estoque
  const abrirEstoque = (prod: Produto) => {
    setProdutoSelecionado(prod);
    setFormQtdEstoque(prod.qtdEstoque.toString());
    setModalErro(null);
    setModalSucesso(null);
    setModalAberto("estoque");
  };

  // Preenche dados para Exclusão
  const abrirExcluir = (prod: Produto) => {
    setProdutoSelecionado(prod);
    setModalErro(null);
    setModalSucesso(null);
    setModalAberto("excluir");
  };

  // Reseta formulários de cadastro
  const abrirCriar = () => {
    setFormNome("");
    setFormDescricao("");
    setFormPreco("");
    setFormEstoqueMinimo("5"); // default sugerido
    setFormCategoriaId(categorias[0]?.id.toString() || "");
    setModalErro(null);
    setModalSucesso(null);
    setModalAberto("criar");
  };

  const fecharModal = () => {
    setModalAberto(null);
    setProdutoSelecionado(null);
    setModalErro(null);
    setModalSucesso(null);
  };

  // ── Handlers das Operações ────────────────────────────────────

  async function handleCriar(e: FormEvent) {
    e.preventDefault();
    setModalErro(null);
    setModalSucesso(null);

    if (!formNome.trim() || !formCategoriaId || !formPreco || !formEstoqueMinimo) {
      setModalErro("Todos os campos obrigatórios devem ser preenchidos.");
      return;
    }

    const precoNum = parseFloat(formPreco);
    const estMinNum = parseInt(formEstoqueMinimo);

    if (isNaN(precoNum) || precoNum < 0) {
      setModalErro("Preço inválido (não pode ser menor que zero).");
      return;
    }

    if (isNaN(estMinNum) || estMinNum < 0) {
      setModalErro("Estoque mínimo inválido.");
      return;
    }

    try {
      await criar({
        nome: formNome.trim(),
        descricao: formDescricao.trim(),
        preco: precoNum,
        estoqueMinimo: estMinNum,
        categoriaId: parseInt(formCategoriaId),
      });
      setModalSucesso("Produto cadastrado com sucesso!");
      setTimeout(fecharModal, 1000);
    } catch (err) {
      setModalErro(mensagemDeErro(err, "Não foi possível cadastrar o produto."));
    }
  }

  async function handleEditar(e: FormEvent) {
    e.preventDefault();
    setModalErro(null);
    setModalSucesso(null);

    if (!produtoSelecionado) return;

    if (!formNome.trim() || !formCategoriaId || !formPreco || !formEstoqueMinimo) {
      setModalErro("Todos os campos obrigatórios devem ser preenchidos.");
      return;
    }

    const precoNum = parseFloat(formPreco);
    const estMinNum = parseInt(formEstoqueMinimo);

    if (isNaN(precoNum) || precoNum < 0) {
      setModalErro("Preço inválido (não pode ser menor que zero).");
      return;
    }

    if (isNaN(estMinNum) || estMinNum < 0) {
      setModalErro("Estoque mínimo inválido.");
      return;
    }

    try {
      await editar(produtoSelecionado.id, {
        nome: formNome.trim(),
        descricao: formDescricao.trim(),
        preco: precoNum,
        estoqueMinimo: estMinNum,
        categoriaId: parseInt(formCategoriaId),
      });
      setModalSucesso("Produto atualizado com sucesso!");
      setTimeout(fecharModal, 1000);
    } catch (err) {
      setModalErro(mensagemDeErro(err, "Não foi possível atualizar o produto."));
    }
  }

  async function handleAjustarEstoque(e: FormEvent) {
    e.preventDefault();
    setModalErro(null);
    setModalSucesso(null);

    if (!produtoSelecionado) return;

    const qtdNum = parseInt(formQtdEstoque);
    if (isNaN(qtdNum) || qtdNum < 0) {
      setModalErro("Quantidade inválida (não pode ser negativa).");
      return;
    }

    try {
      await ajustarEstoqueProduto(produtoSelecionado.id, qtdNum);
      setModalSucesso("Estoque adjusted com sucesso!");
      setTimeout(fecharModal, 1000);
    } catch (err) {
      setModalErro(mensagemDeErro(err, "Falha ao ajustar estoque."));
    }
  }

  async function handleExcluir() {
    if (!produtoSelecionado) return;

    setModalErro(null);
    setModalSucesso(null);
    try {
      await excluir(produtoSelecionado.id);
      setModalSucesso("Produto excluído com sucesso!");
      setTimeout(fecharModal, 1000);
    } catch (err) {
      // D-5: Erros específicos mapeados via lib/apiError
      setModalErro(mensagemDeErro(err, "Falha ao excluir o produto."));
    }
  }

  // ── Renderização dos Indicadores de Estoque ───────────────────
  const renderEstoqueBadge = (qtd: number, min: number) => {
    if (qtd < min) {
      return (
        <span className={`${styles.stockBadge} ${styles.stockCritical}`}>
          <span className={styles.stockDot} />
          Crítico ({qtd})
        </span>
      );
    } else if (qtd === min) {
      return (
        <span className={`${styles.stockBadge} ${styles.stockWarning}`}>
          <span className={styles.stockDot} />
          Atenção ({qtd})
        </span>
      );
    } else {
      return (
        <span className={`${styles.stockBadge} ${styles.stockOk}`}>
          <span className={styles.stockDot} />
          Normal ({qtd})
        </span>
      );
    }
  };

  // Se estiver carregando autenticação ou se não for ADMIN, não renderiza a página.
  if (authLoading || !isAuthenticated || user?.perfil !== "ADMIN") {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Verificando permissões de acesso...</p>
      </div>
    );
  }

  const produtos = produtosPage?.content || [];
  const totalPages = produtosPage?.totalPages || 1;

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Gestão de Produtos</h1>
          <p>Cadastre, edite e monitore os níveis de estoque do catálogo</p>
        </div>
        <div className={styles.userControl}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.email}</span>
            <span className={styles.userBadge}>Administrador</span>
          </div>
          <Link href="/" className={styles.logoutBtn} style={{ textDecoration: 'none' }}>
            Início
          </Link>
          <button className={styles.logoutBtn} onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      {/* Exibição Geral de Erros */}
      {erro && (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {erro}
        </div>
      )}

      {/* Barra de Ações (Filtros e Novo Produto) */}
      <div className={styles.actionsBar}>
        <div className={styles.filters}>
          <div className={styles.searchInputWrapper}>
            <svg
              className={styles.searchIcon}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Buscar por nome do produto..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <select
            className={styles.selectFilter}
            value={categoriaId || ""}
            onChange={(e) => setCategoriaId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Todas Categorias</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
        </div>

        <button className={styles.primaryBtn} onClick={abrirCriar}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo Produto
        </button>
      </div>

      {/* Listagem em Tabela */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Carregando produtos...</p>
        </div>
      ) : produtos.length === 0 ? (
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIcon}>📦</div>
          <h3>Nenhum produto encontrado</h3>
          <p>Tente ajustar os termos de busca ou cadastre um novo produto.</p>
          {(nome || categoriaId) && (
            <button
              className={styles.secondaryBtn}
              onClick={() => {
                setNome("");
                setCategoriaId(undefined);
              }}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th style={{ width: "120px" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      <div className={styles.productName}>{prod.nome}</div>
                      <div className={styles.productDesc} title={prod.descricao}>
                        {prod.descricao || "Sem descrição"}
                      </div>
                    </td>
                    <td>
                      <span className={styles.categoryBadge}>{prod.categoria.nome}</span>
                    </td>
                    <td>
                      <span className={styles.price}>{formatarPreco(prod.preco)}</span>
                    </td>
                    <td>
                      {renderEstoqueBadge(prod.qtdEstoque, prod.estoqueMinimo)}
                      <span className={styles.stockMin}>Mínimo: {prod.estoqueMinimo}</span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        {/* Ajustar Estoque */}
                        <button
                          className={`${styles.iconBtn} ${styles.iconBtnStock}`}
                          title="Ajustar Estoque"
                          onClick={() => abrirEstoque(prod)}
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </button>

                        {/* Editar */}
                        <button
                          className={`${styles.iconBtn} ${styles.iconBtnEdit}`}
                          title="Editar Produto"
                          onClick={() => abrirEditar(prod)}
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>

                        {/* Excluir */}
                        <button
                          className={`${styles.iconBtn} ${styles.iconBtnDelete}`}
                          title="Excluir Produto"
                          onClick={() => abrirExcluir(prod)}
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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

          {/* Paginação */}
          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              Página <strong>{page + 1}</strong> de <strong>{totalPages}</strong> ({produtosPage?.totalElements} itens no total)
            </span>
            <div className={styles.pageBtns}>
              <button
                className={styles.pageBtn}
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`${styles.pageBtn} ${page === i ? styles.pageBtnActive : ""}`}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className={styles.pageBtn}
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                Próxima
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL: CADASTRAR PRODUTO (US-012) ───────────────────────── */}
      {modalAberto === "criar" && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Novo Produto</h2>
              <button className={styles.closeBtn} onClick={fecharModal} disabled={mutating}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCriar}>
              <div className={styles.modalBody}>
                {modalErro && <div className={`${styles.alert} ${styles.alertError}`}>{modalErro}</div>}
                {modalSucesso && <div className={`${styles.alert} ${styles.alertSuccess}`}>{modalSucesso}</div>}

                <div className={styles.form}>
                  <div className={styles.formGroup}>
                    <label htmlFor="create-nome">Nome *</label>
                    <input
                      id="create-nome"
                      className={styles.formInput}
                      type="text"
                      placeholder="Ex: Arroz Integral 1kg"
                      value={formNome}
                      onChange={(e) => setFormNome(e.target.value)}
                      disabled={mutating}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="create-categoria">Categoria *</label>
                    <select
                      id="create-categoria"
                      className={styles.formSelect}
                      value={formCategoriaId}
                      onChange={(e) => setFormCategoriaId(e.target.value)}
                      disabled={mutating}
                      required
                    >
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.formGroup}>
                      <label htmlFor="create-preco">Preço (R$) *</label>
                      <input
                        id="create-preco"
                        className={styles.formInput}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={formPreco}
                        onChange={(e) => setFormPreco(e.target.value)}
                        disabled={mutating}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="create-estoquemin">Estoque Mínimo *</label>
                      <input
                        id="create-estoquemin"
                        className={styles.formInput}
                        type="number"
                        min="0"
                        placeholder="5"
                        value={formEstoqueMinimo}
                        onChange={(e) => setFormEstoqueMinimo(e.target.value)}
                        disabled={mutating}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="create-descricao">Descrição</label>
                    <textarea
                      id="create-descricao"
                      className={styles.formTextarea}
                      placeholder="Detalhes adicionais do produto..."
                      value={formDescricao}
                      onChange={(e) => setFormDescricao(e.target.value)}
                      disabled={mutating}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={fecharModal}
                  disabled={mutating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={mutating || !formNome.trim() || !formPreco || !formEstoqueMinimo}
                >
                  {mutating ? "Salvando..." : "Salvar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR PRODUTO (US-013) ─────────────────────────── */}
      {modalAberto === "editar" && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Editar Produto</h2>
              <button className={styles.closeBtn} onClick={fecharModal} disabled={mutating}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleEditar}>
              <div className={styles.modalBody}>
                {modalErro && <div className={`${styles.alert} ${styles.alertError}`}>{modalErro}</div>}
                {modalSucesso && <div className={`${styles.alert} ${styles.alertSuccess}`}>{modalSucesso}</div>}

                <div className={styles.form}>
                  <div className={styles.formGroup}>
                    <label htmlFor="edit-nome">Nome *</label>
                    <input
                      id="edit-nome"
                      className={styles.formInput}
                      type="text"
                      value={formNome}
                      onChange={(e) => setFormNome(e.target.value)}
                      disabled={mutating}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="edit-categoria">Categoria *</label>
                    <select
                      id="edit-categoria"
                      className={styles.formSelect}
                      value={formCategoriaId}
                      onChange={(e) => setFormCategoriaId(e.target.value)}
                      disabled={mutating}
                      required
                    >
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.formGroup}>
                      <label htmlFor="edit-preco">Preço (R$) *</label>
                      <input
                        id="edit-preco"
                        className={styles.formInput}
                        type="number"
                        step="0.01"
                        min="0"
                        value={formPreco}
                        onChange={(e) => setFormPreco(e.target.value)}
                        disabled={mutating}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="edit-estoquemin">Estoque Mínimo *</label>
                      <input
                        id="edit-estoquemin"
                        className={styles.formInput}
                        type="number"
                        min="0"
                        value={formEstoqueMinimo}
                        onChange={(e) => setFormEstoqueMinimo(e.target.value)}
                        disabled={mutating}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="edit-descricao">Descrição</label>
                    <textarea
                      id="edit-descricao"
                      className={styles.formTextarea}
                      value={formDescricao}
                      onChange={(e) => setFormDescricao(e.target.value)}
                      disabled={mutating}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={fecharModal}
                  disabled={mutating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={mutating || !formNome.trim() || !formPreco || !formEstoqueMinimo}
                >
                  {mutating ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: AJUSTAR ESTOQUE (US-017) ─────────────────────────── */}
      {modalAberto === "estoque" && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Ajustar Estoque</h2>
              <button className={styles.closeBtn} onClick={fecharModal} disabled={mutating}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAjustarEstoque}>
              <div className={styles.modalBody}>
                {modalErro && <div className={`${styles.alert} ${styles.alertError}`}>{modalErro}</div>}
                {modalSucesso && <div className={`${styles.alert} ${styles.alertSuccess}`}>{modalSucesso}</div>}

                <div className={styles.stockAjustInfo}>
                  <div>
                    <span>Produto:</span>
                    <span>{produtoSelecionado?.nome}</span>
                  </div>
                  <div>
                    <span>Estoque Atual:</span>
                    <span>{produtoSelecionado?.qtdEstoque} unidades</span>
                  </div>
                  <div>
                    <span>Estoque Mínimo:</span>
                    <span>{produtoSelecionado?.estoqueMinimo} unidades</span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="adjust-qtd">Nova Quantidade em Estoque *</label>
                  <input
                    id="adjust-qtd"
                    className={styles.formInput}
                    type="number"
                    min="0"
                    placeholder="Ex: 20"
                    value={formQtdEstoque}
                    onChange={(e) => setFormQtdEstoque(e.target.value)}
                    disabled={mutating}
                    required
                  />
                  <span className={styles.inputHint}>
                    Insira a contagem física absoluta atualizada do produto no estoque.
                  </span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={fecharModal}
                  disabled={mutating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={mutating || !formQtdEstoque}
                >
                  {mutating ? "Atualizando..." : "Confirmar Ajuste"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRMAR EXCLUSÃO (US-013) ──────────────────────── */}
      {modalAberto === "excluir" && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Excluir Produto</h2>
              <button className={styles.closeBtn} onClick={fecharModal} disabled={mutating}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {modalErro && <div className={`${styles.alert} ${styles.alertError}`}>{modalErro}</div>}
              {modalSucesso && <div className={`${styles.alert} ${styles.alertSuccess}`}>{modalSucesso}</div>}

              <p className={styles.confirmDeleteText}>
                Tem certeza que deseja excluir o produto <strong>{produtoSelecionado?.nome}</strong>?
              </p>
              <p className={styles.confirmDeleteText} style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Esta ação é permanente e removerá o produto do catálogo de vendas.
              </p>
              
              <div className={styles.confirmDeleteWarning}>
                ⚠️ <strong>Atenção:</strong> Se o produto possuir histórico de movimentação ou vendas registradas, a exclusão será rejeitada pelo servidor.
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={fecharModal}
                disabled={mutating}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={handleExcluir}
                disabled={mutating}
              >
                {mutating ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
