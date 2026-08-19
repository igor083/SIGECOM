import api from "./api";

export interface CategoriaProduto {
  id: number;
  nome: string;
}

export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  // SCRUM-160: null quando o produto não tem foto
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

// SCRUM-185: o nome tem que ser qtdEstoqueInicial, igual ao back, senão o valor é ignorado
export interface CadastroProdutoRequest extends ProdutoRequest {
  qtdEstoqueInicial: number;
}

// mesmo formato do Page do Spring Boot
export interface PageProduto {
  content: Produto[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

// BAIXO = qtdEstoque <= estoqueMinimo; NORMAL = o resto
export type FiltroEstoque = "TODOS" | "BAIXO" | "NORMAL";

// o filtro de estoque vai pro servidor: no cliente esconderia produto crítico da página seguinte
export async function listarProdutos(params: {
  nome?: string;
  categoriaId?: number;
  estoque?: FiltroEstoque;
  page?: number;
  size?: number;
}): Promise<PageProduto> {
  const response = await api.get<PageProduto>("/produtos", { params });
  return response.data;
}

export async function criarProduto(dados: CadastroProdutoRequest): Promise<Produto> {
  const response = await api.post<Produto>("/produtos", dados);
  return response.data;
}

export async function editarProduto(id: number, dados: ProdutoRequest): Promise<Produto> {
  const response = await api.put<Produto>(`/produtos/${id}`, dados);
  return response.data;
}

export async function excluirProduto(id: number): Promise<void> {
  await api.delete(`/produtos/${id}`);
}

export async function ajustarEstoque(id: number, quantidade: number): Promise<Produto> {
  const response = await api.post<Produto>(`/produtos/${id}/ajustar-estoque`, {
    quantidade,
  });
  return response.data;
}

export async function listarCategorias(): Promise<CategoriaProduto[]> {
  const response = await api.get<CategoriaProduto[]>("/categorias-produto");
  return response.data;
}

export async function listarProdutosPorTipo(categoriaId: number): Promise<Produto[]> {
  const response = await api.get<Produto[]>(`/produtos/por-tipo/${categoriaId}`);
  return response.data;
}

// liberado pra FUNCIONARIO também, porque alimenta o alerta do painel dele
export async function listarEstoqueBaixo(params: {
  page?: number;
  size?: number;
} = {}): Promise<PageProduto> {
  const response = await api.get<PageProduto>("/produtos/estoque-baixo", { params });
  return response.data;
}
