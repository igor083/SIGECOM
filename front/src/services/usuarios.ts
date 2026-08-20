import api from "./api";

export type PerfilUsuario = "ADMIN" | "FUNCIONARIO";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  criadoEm: string;
  senhaTemporaria: boolean;
}

export interface PageUsuario {
  content: Usuario[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface CadastroUsuarioRequest {
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilUsuario;
}

export interface EditUsuarioRequest {
  nome?: string;
  email?: string;
  perfil?: PerfilUsuario;
  // Sem `ativo`: a API não aceita mais desativar por aqui. A flag tem um dono
  // só, o DELETE, que é onde mora a guarda contra o admin se remover.
}

export async function listarUsuarios(params: {
  busca?: string;
  perfil?: PerfilUsuario;
  page?: number;
  size?: number;
}): Promise<PageUsuario> {
  const response = await api.get<PageUsuario>("/auth/usuarios", { params });
  return response.data;
}

export async function criarUsuario(dados: CadastroUsuarioRequest): Promise<Usuario> {
  const response = await api.post<Usuario>("/auth/cadastro", dados);
  return response.data;
}

export async function editarUsuario(id: number, dados: EditUsuarioRequest): Promise<Usuario> {
  const response = await api.put<Usuario>(`/auth/usuarios/${id}`, dados);
  return response.data;
}

export async function removerUsuario(id: number): Promise<void> {
  await api.delete(`/auth/usuarios/${id}`);
}

export async function resetarSenha(id: number, senhaNova: string): Promise<void> {
  await api.patch(`/auth/usuarios/${id}/senha`, { senhaNova });
}
