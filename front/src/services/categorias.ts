import api from "./api";

export interface CategoriaProduto {
  id: number;
  nome: string;
  quantidadeProdutos?: number;
}

export async function listarCategorias(): Promise<CategoriaProduto[]> {
  const response = await api.get<CategoriaProduto[]>("/categorias-produto");
  return response.data;
}

export async function criarCategoria(nome: string): Promise<CategoriaProduto> {
  const response = await api.post<CategoriaProduto>("/categorias-produto", { nome });
  return response.data;
}

export async function editarCategoria(id: number, nome: string): Promise<CategoriaProduto> {
  const response = await api.put<CategoriaProduto>(`/categorias-produto/${id}`, { nome });
  return response.data;
}

export async function removerCategoria(id: number): Promise<void> {
  await api.delete(`/categorias-produto/${id}`);
}
