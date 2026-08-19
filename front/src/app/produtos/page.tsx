"use client";

import { useState, useEffect, useMemo, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProdutos } from "@/hooks/useProdutos";
import { mensagemDeErro } from "@/lib/apiError";
import type { Produto, FiltroEstoque } from "@/services/produtos";
import { criarCategoria } from "@/services/categorias";
import { obterParametrosFinanceiros } from "@/services/parametrosFinanceiros";
import { precoSugerido, calcularMarkup, type ParametrosFinanceiros } from "@/lib/markup";
import AppShell from "@/components/AppShell";
import styles from "./produtos.module.css";

function formatarPreco(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

function codigoProduto(id: number): string {
  return `#P${id.toString().padStart(3, "0")}`;
}

const TABS: { valor: FiltroEstoque; rotulo: string }[] = [
  { valor: "TODOS", rotulo: "Todos" },
  { valor: "NORMAL", rotulo: "Em estoque" },
  { valor: "BAIXO", rotulo: "Estoque Baixo" },
];

function getStatus(prod: Produto): { label: string; color: string } {
  if (prod.qtdEstoque === 0) return { label: "Sem estoque", color: "#dc2626" };
  if (prod.qtdEstoque <= prod.estoqueMinimo) return { label: "Estoque baixo", color: "#dc2626" };
  return { label: "Em estoque", color: "#16a34a" };
}

export default function GestaoProdutosPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Só busca depois que a sessão foi resolvida. O hook monta junto com a
  // página; sem esta trava ele dispara as chamadas antes de haver token e a
  // API devolve 401, derrubando a sessão de quem só estava abrindo a tela.
  const sessaoPronta = !authLoading && isAuthenticated;

  const {
    produtosPage, categorias, loading, mutating, erro,
    nome, setNome, categoriaId, setCategoriaId,
    filtroEstoque, setFiltroEstoque, page, setPage,
    criar, editar, excluir, ajustarEstoqueProduto,
  } = useProdutos(8, sessaoPronta);
  const [modalAberto, setModalAberto] = useState<"criar" | "editar" | "estoque" | "excluir" | null>(null);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);

  const [formNome, setFormNome] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  // SCRUM-160: link da imagem que aparece na grade do PDV
  const [formImagemUrl, setFormImagemUrl] = useState("");
  const [formPreco, setFormPreco] = useState("");
  const [formEstoqueMinimo, setFormEstoqueMinimo] = useState("");
  const [formCategoriaId, setFormCategoriaId] = useState("");
  const [formQtdEstoque, setFormQtdEstoque] = useState("");
  // SCRUM-185: quantidade inicial só existe no cadastro, a edição nunca mexe em estoque
  const [formQtdInicial, setFormQtdInicial] = useState("");
  const [modalErro, setModalErro] = useState<string | null>(null);
  const [modalSucesso, setModalSucesso] = useState<string | null>(null);
  const [formCmv, setFormCmv] = useState("");
  const [financeParams, setFinanceParams] = useState<ParametrosFinanceiros | null>(null);
  const [mostrarComposicao, setMostrarComposicao] = useState(false);
  // Criar categoria nova direto no cadastro de produto
  const [categoriasExtras, setCategoriasExtras] = useState<{ id: number; nome: string }[]>([]);
  const [criandoCat, setCriandoCat] = useState(false);
  const [novaCatNome, setNovaCatNome] = useState("");
  const [catSalvando, setCatSalvando] = useState(false);
  const [catErro, setCatErro] = useState<string | null>(null);

  // FUNCIONARIO entra, mas só consulta: ele precisa conferir preço e estoque
  // para vender. Quem cadastra, edita, ajusta estoque e exclui é o ADMIN.
  //
  // Isto aqui é só o espelho da regra: quem decide é o @PreAuthorize das
  // quatro rotas de escrita no ProdutoController. Esconder o botão melhora a
  // tela, não protege nada.
  const podeEditar = user?.perfil === "ADMIN";

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  // A listagem já vem filtrada do servidor — inclusive por nível de estoque.
  // Não filtre aqui: o filtro client-side só enxerga a página atual e some
  // com produto crítico que está na página seguinte.
  const produtos = produtosPage?.content ?? [];
  const totalPages = produtosPage?.totalPages ?? 1;

  // Categorias do backend + as criadas nesta sessao (aparecem sem recarregar a pagina)
  const categoriasTodas = useMemo(() => {
    const mapa = new Map<number, { id: number; nome: string }>();
    [...categorias, ...categoriasExtras].forEach((c) => mapa.set(c.id, c));
    return Array.from(mapa.values());
  }, [categorias, categoriasExtras]);

  async function handleCriarCategoria() {
    const nome = novaCatNome.trim();
    if (!nome) { setCatErro("Informe o nome da categoria."); return; }
    setCatSalvando(true); setCatErro(null);
    try {
      const nova = await criarCategoria(nome);
      setCategoriasExtras((prev) => [...prev, nova]);
      setFormCategoriaId(nova.id.toString());
      setCriandoCat(false); setNovaCatNome("");
    } catch (err) {
      setCatErro(mensagemDeErro(err, "Não foi possível criar a categoria."));
    } finally {
      setCatSalvando(false);
    }
  }

  const abrirCriar = () => {
    setFormNome(""); setFormDescricao(""); setFormImagemUrl(""); setFormPreco("");
    setFormEstoqueMinimo("5"); setFormCategoriaId(categorias[0]?.id.toString() ?? "");
    setFormQtdInicial("0");
    setModalErro(null); setModalSucesso(null);
    setFinanceParams(obterParametrosFinanceiros()); setFormCmv(""); setMostrarComposicao(false);
    setCriandoCat(false); setNovaCatNome(""); setCatErro(null);
    setModalAberto("criar");
  };

  const abrirEditar = (prod: Produto) => {
    setProdutoSelecionado(prod);
    setFormNome(prod.nome); setFormDescricao(prod.descricao); setFormImagemUrl(prod.imagemUrl ?? "");
    setFormPreco(prod.preco.toString()); setFormEstoqueMinimo(prod.estoqueMinimo.toString());
    setFormCategoriaId(prod.categoria.id.toString());
    setModalErro(null); setModalSucesso(null);
    setFinanceParams(obterParametrosFinanceiros()); setFormCmv(""); setMostrarComposicao(false);
    setModalAberto("editar");
  };

  const abrirEstoque = (prod: Produto) => {
    setProdutoSelecionado(prod);
    setFormQtdEstoque(prod.qtdEstoque.toString());
    setModalErro(null); setModalSucesso(null);
    setModalAberto("estoque");
  };

  const abrirExcluir = (prod: Produto) => {
    setProdutoSelecionado(prod);
    setModalErro(null); setModalSucesso(null);
    setModalAberto("excluir");
  };

  const fecharModal = () => {
    setModalAberto(null); setProdutoSelecionado(null);
    setModalErro(null); setModalSucesso(null);
  };

  async function handleCriar(e: FormEvent) {
    e.preventDefault();
    setModalErro(null); setModalSucesso(null);
    if (!formNome.trim() || !formCategoriaId || !formPreco || !formEstoqueMinimo) {
      setModalErro("Todos os campos obrigatórios devem ser preenchidos."); return;
    }
    const precoNum = parseFloat(formPreco);
    const estMinNum = parseInt(formEstoqueMinimo);
    if (isNaN(precoNum) || precoNum < 0) { setModalErro("Preço inválido."); return; }
    if (isNaN(estMinNum) || estMinNum < 0) { setModalErro("Estoque mínimo inválido."); return; }
    const qtdInicialNum = formQtdInicial.trim() === "" ? 0 : parseInt(formQtdInicial);
    if (isNaN(qtdInicialNum) || qtdInicialNum < 0) { setModalErro("Quantidade inicial inválida."); return; }
    try {
      await criar({ nome: formNome.trim(), descricao: formDescricao.trim(), imagemUrl: formImagemUrl.trim(), preco: precoNum, estoqueMinimo: estMinNum, categoriaId: parseInt(formCategoriaId), qtdEstoqueInicial: qtdInicialNum });
      setModalSucesso("Produto cadastrado com sucesso!");
      setTimeout(fecharModal, 1000);
    } catch (err) { setModalErro(mensagemDeErro(err, "Não foi possível cadastrar o produto.")); }
  }

  async function handleEditar(e: FormEvent) {
    e.preventDefault();
    setModalErro(null); setModalSucesso(null);
    if (!produtoSelecionado || !formNome.trim() || !formCategoriaId || !formPreco || !formEstoqueMinimo) {
      setModalErro("Todos os campos obrigatórios devem ser preenchidos."); return;
    }
    const precoNum = parseFloat(formPreco);
    const estMinNum = parseInt(formEstoqueMinimo);
    if (isNaN(precoNum) || precoNum < 0) { setModalErro("Preço inválido."); return; }
    if (isNaN(estMinNum) || estMinNum < 0) { setModalErro("Estoque mínimo inválido."); return; }
    try {
      await editar(produtoSelecionado.id, { nome: formNome.trim(), descricao: formDescricao.trim(), imagemUrl: formImagemUrl.trim(), preco: precoNum, estoqueMinimo: estMinNum, categoriaId: parseInt(formCategoriaId) });
      setModalSucesso("Produto atualizado com sucesso!");
      setTimeout(fecharModal, 1000);
    } catch (err) { setModalErro(mensagemDeErro(err, "Não foi possível atualizar o produto.")); }
  }

  async function handleAjustarEstoque(e: FormEvent) {
    e.preventDefault();
    setModalErro(null); setModalSucesso(null);
    if (!produtoSelecionado) return;
    const qtdNum = parseInt(formQtdEstoque);
    if (isNaN(qtdNum) || qtdNum < 0) { setModalErro("Quantidade inválida."); return; }
    try {
      await ajustarEstoqueProduto(produtoSelecionado.id, qtdNum);
      setModalSucesso("Estoque ajustado com sucesso!");
      setTimeout(fecharModal, 1000);
    } catch (err) { setModalErro(mensagemDeErro(err, "Falha ao ajustar estoque.")); }
  }

  async function handleExcluir() {
    if (!produtoSelecionado) return;
    setModalErro(null); setModalSucesso(null);
    try {
      await excluir(produtoSelecionado.id);
      setModalSucesso("Produto excluído com sucesso!");
      setTimeout(fecharModal, 1000);
    } catch (err) { setModalErro(mensagemDeErro(err, "Falha ao excluir o produto.")); }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Verificando permissões...</p>
      </div>
    );
  }

  return (
    <AppShell title={podeEditar ? "Gestão de Produtos" : "Consulta de Produtos"}>
      {erro && (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          {erro}
        </div>
      )}

      {/* Cabeçalho da seção */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Lista de Produtos</h2>

        {/* Tabs — cada uma refaz a busca no servidor e volta pra página 1 */}
        <div className={styles.tabs}>
          {TABS.map(({ valor, rotulo }) => (
            <button
              key={valor}
              className={`${styles.tab} ${filtroEstoque === valor ? styles.tabActive : ""}`}
              onClick={() => setFiltroEstoque(valor)}
              disabled={loading}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {podeEditar && (
          <button className={styles.primaryBtn} onClick={abrirCriar}>
            + Adicionar produto
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className={styles.filters}>
        <div className={styles.searchInputWrapper}>
          <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por nome..."
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
        <select
          className={styles.selectFilter}
          value={categoriaId ?? ""}
          onChange={(e) => setCategoriaId(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Todas Categorias</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.nome}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Carregando produtos...</p>
        </div>
      ) : produtos.length === 0 ? (
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIcon}>📦</div>
          <h3>Nenhum produto encontrado</h3>
          <p>
            {podeEditar
              ? "Tente ajustar os filtros ou cadastre um novo produto."
              : "Tente ajustar os filtros da busca."}
          </p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Código</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Status</th>
                  {podeEditar && <th style={{ width: "120px" }}>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {produtos.map((prod) => {
                  const status = getStatus(prod);
                  return (
                    <tr key={prod.id}>
                      <td className={styles.productName}>{prod.nome}</td>
                      <td className={styles.codigo}>{codigoProduto(prod.id)}</td>
                      <td>{prod.categoria.nome}</td>
                      <td>{formatarPreco(prod.preco)}</td>
                      <td>{prod.qtdEstoque}</td>
                      <td>
                        <span style={{ color: status.color, fontWeight: 600, fontSize: "0.82rem" }}>
                          {status.label}
                        </span>
                      </td>
                      {podeEditar && (
                      <td>
                        <div className={styles.actionsCell}>
                          <button className={`${styles.iconBtn} ${styles.iconBtnStock}`} title="Ajustar Estoque" onClick={() => abrirEstoque(prod)}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </button>
                          <button className={`${styles.iconBtn} ${styles.iconBtnEdit}`} title="Editar" onClick={() => abrirEditar(prod)}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button className={`${styles.iconBtn} ${styles.iconBtnDelete}`} title="Excluir" onClick={() => abrirExcluir(prod)}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              Página <strong>{page + 1}</strong> de <strong>{totalPages}</strong> ({produtosPage?.totalElements} itens)
            </span>
            <div className={styles.pageBtns}>
              <button className={styles.pageBtn} disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} className={`${styles.pageBtn} ${page === i ? styles.pageBtnActive : ""}`} onClick={() => setPage(i)}>{i + 1}</button>
              ))}
              <button className={styles.pageBtn} disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Próxima</button>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL: CRIAR ── */}
      {modalAberto === "criar" && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Novo Produto</h2>
              <button className={styles.closeBtn} onClick={fecharModal} disabled={mutating}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCriar}>
              <div className={styles.modalBody}>
                {modalErro && <div className={`${styles.alert} ${styles.alertError}`}>{modalErro}</div>}
                {modalSucesso && <div className={`${styles.alert} ${styles.alertSuccess}`}>{modalSucesso}</div>}
                <div className={styles.form}>
                  <div className={styles.formGroup}>
                    <label htmlFor="c-nome">Nome *</label>
                    <input id="c-nome" className={styles.formInput} type="text" placeholder="Ex: Arroz 1kg" value={formNome} onChange={(e) => setFormNome(e.target.value)} disabled={mutating} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="c-cat">Categoria *</label>
                    {!criandoCat ? (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <select id="c-cat" className={styles.formSelect} style={{ flex: 1 }} value={formCategoriaId} onChange={(e) => setFormCategoriaId(e.target.value)} disabled={mutating} required>
                          {categoriasTodas.map((cat) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                        </select>
                        <button type="button" className={styles.secondaryBtn} style={{ whiteSpace: "nowrap", padding: "8px 12px" }} onClick={() => { setCriandoCat(true); setCatErro(null); setNovaCatNome(""); }} disabled={mutating}>+ Nova</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <input className={styles.formInput} style={{ flex: 1 }} type="text" placeholder="Nome da nova categoria" value={novaCatNome} onChange={(e) => setNovaCatNome(e.target.value)} disabled={catSalvando} autoFocus onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCriarCategoria(); } }} />
                          <button type="button" className={styles.primaryBtn} style={{ padding: "8px 12px" }} onClick={handleCriarCategoria} disabled={catSalvando || !novaCatNome.trim()}>{catSalvando ? "..." : "Criar"}</button>
                          <button type="button" className={styles.secondaryBtn} style={{ padding: "8px 12px" }} onClick={() => { setCriandoCat(false); setCatErro(null); }} disabled={catSalvando}>Cancelar</button>
                        </div>
                        {catErro && <span style={{ color: "#dc2626", fontSize: "0.78rem" }}>{catErro}</span>}
                      </div>
                    )}
                  </div>
                  <div className={styles.row}>
                    <div className={styles.formGroup}>
                      <label htmlFor="c-cmv">Custo (CMV) R$</label>
                      <input id="c-cmv" className={styles.formInput} type="number" step="0.01" min="0" placeholder="0,00" value={formCmv} onChange={(e) => setFormCmv(e.target.value)} disabled={mutating} />
                    </div>
                    <div className={styles.formGroup} style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      {financeParams && parseFloat(formCmv) > 0 && (
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          Sugerido: <strong>R$ {precoSugerido(parseFloat(formCmv), financeParams).toFixed(2)}</strong>
                          <button type="button" style={{ marginLeft: "6px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "4px", padding: "2px 6px", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700 }} onClick={() => setFormPreco(precoSugerido(parseFloat(formCmv), financeParams!).toFixed(2))}>Aplicar</button>
                        </div>
                      )}
                    </div>
                  </div>
                  {financeParams && parseFloat(formCmv) > 0 && (
                    <div>
                      <button type="button" style={{ background: "none", border: "none", color: "#2563eb", textDecoration: "underline", cursor: "pointer", fontSize: "0.75rem", padding: 0 }} onClick={() => setMostrarComposicao(!mostrarComposicao)}>
                        {mostrarComposicao ? "Ocultar composição" : "Ver composição do preço"}
                      </button>
                      {mostrarComposicao && (() => {
                        const params = financeParams!;
                        const cmvNum = parseFloat(formCmv);
                        const precoP = precoSugerido(cmvNum, params);
                        const emReais = (pct: number) => formatarPreco((pct / 100) * precoP);
                        return (
                          <div style={{ marginTop: "0.5rem", padding: "0.75rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.75rem", color: "#64748b", lineHeight: 1.7 }}>
                            <div style={{ marginBottom: 4, color: "#334155", fontWeight: 600 }}>Como o preço de {formatarPreco(precoP)} se forma:</div>
                            <div>Custo do produto (CMV): <strong style={{ color: "#334155" }}>{formatarPreco(cmvNum)}</strong></div>
                            <div>Impostos ({params.impostosPercent}%): {emReais(params.impostosPercent)}</div>
                            <div>Custos fixos ({params.custosFixosPercent}%): {emReais(params.custosFixosPercent)}</div>
                            <div>Comissão ({params.comissaoPercent}%): {emReais(params.comissaoPercent)}</div>
                            <div>Maquininha ({params.taxaMaquininhaPercent}%): {emReais(params.taxaMaquininhaPercent)}</div>
                            <div>Seu lucro ({params.lucroDesejadoPercent}%): <strong style={{ color: "#16a34a" }}>{emReais(params.lucroDesejadoPercent)}</strong></div>
                            <div style={{ borderTop: "1px solid #cbd5e1", marginTop: 6, paddingTop: 4, color: "#334155", fontWeight: 600 }}>
                              Preço de venda: {formatarPreco(precoP)} &nbsp;·&nbsp; markup {calcularMarkup(params).toFixed(3)}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  <div className={styles.row}>
                    <div className={styles.formGroup}>
                      <label htmlFor="c-preco">Preço de Venda (R$) *</label>
                      <input id="c-preco" className={styles.formInput} type="number" step="0.01" min="0" placeholder="0,00" value={formPreco} onChange={(e) => setFormPreco(e.target.value)} disabled={mutating} required />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="c-estmin">Estoque Mínimo *</label>
                      <input id="c-estmin" className={styles.formInput} type="number" min="0" placeholder="5" value={formEstoqueMinimo} onChange={(e) => setFormEstoqueMinimo(e.target.value)} disabled={mutating} required />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="c-qtdinicial">Quantidade em Estoque</label>
                    <input id="c-qtdinicial" className={styles.formInput} type="number" min="0" placeholder="0" value={formQtdInicial} onChange={(e) => setFormQtdInicial(e.target.value)} disabled={mutating} />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="c-desc">Descrição</label>
                    <textarea id="c-desc" className={styles.formTextarea} placeholder="Detalhes do produto..." value={formDescricao} onChange={(e) => setFormDescricao(e.target.value)} disabled={mutating} />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="c-imagem">Link da imagem</label>
                    <input id="c-imagem" type="url" className={styles.formInput} placeholder="https://..." value={formImagemUrl} onChange={(e) => setFormImagemUrl(e.target.value)} disabled={mutating} />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryBtn} onClick={fecharModal} disabled={mutating}>Cancelar</button>
                <button type="submit" className={styles.primaryBtn} disabled={mutating || !formNome.trim() || !formPreco || !formEstoqueMinimo}>{mutating ? "Salvando..." : "Salvar Produto"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR ── */}
      {modalAberto === "editar" && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Editar Produto</h2>
              <button className={styles.closeBtn} onClick={fecharModal} disabled={mutating}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEditar}>
              <div className={styles.modalBody}>
                {modalErro && <div className={`${styles.alert} ${styles.alertError}`}>{modalErro}</div>}
                {modalSucesso && <div className={`${styles.alert} ${styles.alertSuccess}`}>{modalSucesso}</div>}
                <div className={styles.form}>
                  <div className={styles.formGroup}>
                    <label htmlFor="e-nome">Nome *</label>
                    <input id="e-nome" className={styles.formInput} type="text" value={formNome} onChange={(e) => setFormNome(e.target.value)} disabled={mutating} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="e-cat">Categoria *</label>
                    <select id="e-cat" className={styles.formSelect} value={formCategoriaId} onChange={(e) => setFormCategoriaId(e.target.value)} disabled={mutating} required>
                      {categorias.map((cat) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                    </select>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.formGroup}>
                      <label htmlFor="e-cmv">Custo (CMV) R$</label>
                      <input id="e-cmv" className={styles.formInput} type="number" step="0.01" min="0" placeholder="0,00" value={formCmv} onChange={(e) => setFormCmv(e.target.value)} disabled={mutating} />
                    </div>
                    <div className={styles.formGroup} style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      {financeParams && parseFloat(formCmv) > 0 && (
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          Sugerido: <strong>R$ {precoSugerido(parseFloat(formCmv), financeParams).toFixed(2)}</strong>
                          <button type="button" style={{ marginLeft: "6px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "4px", padding: "2px 6px", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700 }} onClick={() => setFormPreco(precoSugerido(parseFloat(formCmv), financeParams!).toFixed(2))}>Aplicar</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.formGroup}>
                      <label htmlFor="e-preco">Preço de Venda (R$) *</label>
                      <input id="e-preco" className={styles.formInput} type="number" step="0.01" min="0" value={formPreco} onChange={(e) => setFormPreco(e.target.value)} disabled={mutating} required />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="e-estmin">Estoque Mínimo *</label>
                      <input id="e-estmin" className={styles.formInput} type="number" min="0" value={formEstoqueMinimo} onChange={(e) => setFormEstoqueMinimo(e.target.value)} disabled={mutating} required />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="e-desc">Descrição</label>
                    <textarea id="e-desc" className={styles.formTextarea} value={formDescricao} onChange={(e) => setFormDescricao(e.target.value)} disabled={mutating} />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="e-imagem">Link da imagem</label>
                    <input id="e-imagem" type="url" className={styles.formInput} placeholder="https://..." value={formImagemUrl} onChange={(e) => setFormImagemUrl(e.target.value)} disabled={mutating} />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryBtn} onClick={fecharModal} disabled={mutating}>Cancelar</button>
                <button type="submit" className={styles.primaryBtn} disabled={mutating || !formNome.trim() || !formPreco || !formEstoqueMinimo}>{mutating ? "Salvando..." : "Salvar Alterações"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ESTOQUE ── */}
      {modalAberto === "estoque" && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Ajustar Estoque</h2>
              <button className={styles.closeBtn} onClick={fecharModal} disabled={mutating}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAjustarEstoque}>
              <div className={styles.modalBody}>
                {modalErro && <div className={`${styles.alert} ${styles.alertError}`}>{modalErro}</div>}
                {modalSucesso && <div className={`${styles.alert} ${styles.alertSuccess}`}>{modalSucesso}</div>}
                <div className={styles.stockAjustInfo}>
                  <div><span>Produto:</span><span>{produtoSelecionado?.nome}</span></div>
                  <div><span>Estoque Atual:</span><span>{produtoSelecionado?.qtdEstoque} unidades</span></div>
                  <div><span>Estoque Mínimo:</span><span>{produtoSelecionado?.estoqueMinimo} unidades</span></div>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="adj-qtd">Nova Quantidade *</label>
                  <input id="adj-qtd" className={styles.formInput} type="number" min="0" placeholder="Ex: 20" value={formQtdEstoque} onChange={(e) => setFormQtdEstoque(e.target.value)} disabled={mutating} required />
                  <span className={styles.inputHint}>Insira a contagem física absoluta do estoque.</span>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryBtn} onClick={fecharModal} disabled={mutating}>Cancelar</button>
                <button type="submit" className={styles.primaryBtn} disabled={mutating || !formQtdEstoque}>{mutating ? "Atualizando..." : "Confirmar Ajuste"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EXCLUIR ── */}
      {modalAberto === "excluir" && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Excluir Produto</h2>
              <button className={styles.closeBtn} onClick={fecharModal} disabled={mutating}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              {modalErro && <div className={`${styles.alert} ${styles.alertError}`}>{modalErro}</div>}
              {modalSucesso && <div className={`${styles.alert} ${styles.alertSuccess}`}>{modalSucesso}</div>}
              <p className={styles.confirmDeleteText}>Tem certeza que deseja excluir <strong>{produtoSelecionado?.nome}</strong>?</p>
              <p className={styles.confirmDeleteText} style={{ fontSize: "0.85rem", color: "#64748b" }}>Esta ação é permanente.</p>
              <div className={styles.confirmDeleteWarning}>⚠️ Se o produto possuir histórico de vendas, a exclusão será rejeitada.</div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryBtn} onClick={fecharModal} disabled={mutating}>Cancelar</button>
              <button type="button" className={styles.dangerBtn} onClick={handleExcluir} disabled={mutating}>{mutating ? "Excluindo..." : "Confirmar Exclusão"}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
