// =============================================================
// services/produtos.ts — Serviço de Gestão de Produtos (SIGECOM)
// =============================================================
// Encapsula todas as chamadas HTTP para o backend referente
// ao CRUD de produtos e ajuste de estoque.
// =============================================================

import api from "./api";

// ── Tipos de Dados ───────────────────────────────────────────

export interface CategoriaProduto {
  id: number;
  nome: string;
}

export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  /** SCRUM-160: link da imagem. null quando o produto não tem foto. */
  imagemUrl: string | null;
  preco: number;
  qtdEstoque: number;
  estoqueMinimo: number;
  ativo: boolean;
  categoria: CategoriaProduto;
}

export interface ProdutoRequest {
  nome: string;
  descricao: string;
  imagemUrl?: string | null;
  preco: number;
  estoqueMinimo: number;
  categoriaId: number;
}

/** Estrutura de paginação compatível com Page do Spring Boot */
export interface PageProduto {
  content: Produto[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

// ── Métodos de Serviço ────────────────────────────────────────

/**
 * Consulta e lista os produtos, com suporte a filtros e paginação.
 */
export async function listarProdutos(params: {
  nome?: string;
  categoriaId?: number;
  page?: number;
  size?: number;
}): Promise<PageProduto> {
  const response = await api.get<PageProduto>("/produtos", { params });
  return response.data;
}

/**
 * Cadastra um novo produto (apenas ADMIN).
 */
export async function criarProduto(dados: ProdutoRequest): Promise<Produto> {
  const response = await api.post<Produto>("/produtos", dados);
  return response.data;
}

/**
 * Edita os dados de um produto existente (apenas ADMIN).
 */
export async function editarProduto(id: number, dados: ProdutoRequest): Promise<Produto> {
  const response = await api.put<Produto>(`/produtos/${id}`, dados);
  return response.data;
}

/**
 * Exclui um produto (apenas ADMIN).
 * Não deve excluir produto com movimentação de estoque ativa (ex. vendas associadas).
 */
export async function excluirProduto(id: number): Promise<void> {
  await api.delete(`/produtos/${id}`);
}

/**
 * Ajusta a quantidade em estoque de um produto (apenas ADMIN).
 */
export async function ajustarEstoque(id: number, quantidade: number): Promise<Produto> {
  const response = await api.post<Produto>(`/produtos/${id}/ajustar-estoque`, {
    quantidade,
  });
  return response.data;
}

/**
 * Lista todas as categorias de produtos disponíveis.
 */
export async function listarCategorias(): Promise<CategoriaProduto[]> {
  const response = await api.get<CategoriaProduto[]>("/categorias-produto");
  return response.data;
}

/**
 * Lista produtos de uma categoria específica.
 */
export async function listarProdutosPorTipo(categoriaId: number): Promise<Produto[]> {
  const response = await api.get<Produto[]>(`/produtos/por-tipo/${categoriaId}`);
  return response.data;
}
