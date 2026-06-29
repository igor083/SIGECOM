// =============================================================
// services/produtos.ts — Serviço de Gestão de Produtos (SIGECOM)
// =============================================================
// Encapsula todas as chamadas HTTP para o backend referente
// ao CRUD de produtos e ajuste de estoque.
//
// Para fins de teste e desenvolvimento paralelo (Sprint 2),
// possui um simulador local (localStorage) ativado quando
// NEXT_PUBLIC_MOCK_API = true.
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
  preco: number;
  qtdEstoque: number;
  estoqueMinimo: number;
  ativo: boolean;
  categoria: CategoriaProduto;
}

export interface ProdutoRequest {
  nome: string;
  descricao: string;
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

// ── Verificação de Mock ───────────────────────────────────────

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_API === "true";

// ── Dados Iniciais de Simulação (Mock) ─────────────────────────

const MOCK_CATEGORIAS: CategoriaProduto[] = [
  { id: 1, nome: "Alimentos" },
  { id: 2, nome: "Bebidas" },
  { id: 3, nome: "Limpeza" },
  { id: 4, nome: "Higiene" },
  { id: 5, nome: "Outros" },
];

const MOCK_PRODUTOS_INICIAIS: Produto[] = [
  {
    id: 1,
    nome: "Arroz Integral 1kg",
    descricao: "Arroz integral tipo 1, rico em fibras",
    preco: 7.5,
    qtdEstoque: 15,
    estoqueMinimo: 10,
    ativo: true,
    categoria: { id: 1, nome: "Alimentos" },
  },
  {
    id: 2,
    nome: "Feijão Preto 1kg",
    descricao: "Feijão preto carioca selecionado",
    preco: 8.9,
    qtdEstoque: 5,
    estoqueMinimo: 10,
    ativo: true,
    categoria: { id: 1, nome: "Alimentos" },
  },
  {
    id: 3,
    nome: "Refrigerante Cola 2L",
    descricao: "Refrigerante de cola garrafa pet de 2 litros",
    preco: 9.0,
    qtdEstoque: 10,
    estoqueMinimo: 10,
    ativo: true,
    categoria: { id: 2, nome: "Bebidas" },
  },
  {
    id: 4,
    nome: "Sabão em Pó 1kg",
    descricao: "Sabão em pó para lavagem de roupas",
    preco: 14.9,
    qtdEstoque: 2,
    estoqueMinimo: 5,
    ativo: true,
    categoria: { id: 3, nome: "Limpeza" },
  },
  {
    id: 5,
    nome: "Detergente Neutro",
    descricao: "Detergente líquido lava-louças neutro 500ml",
    preco: 2.5,
    qtdEstoque: 25,
    estoqueMinimo: 15,
    ativo: true,
    categoria: { id: 3, nome: "Limpeza" },
  },
  {
    id: 6,
    nome: "Creme Dental",
    descricao: "Creme dental de menta com flúor e proteção total",
    preco: 4.2,
    qtdEstoque: 0,
    estoqueMinimo: 8,
    ativo: true,
    categoria: { id: 4, nome: "Higiene" },
  },
  {
    id: 7,
    nome: "Sabonete Barra",
    descricao: "Sabonete suave em barra com creme hidratante",
    preco: 1.8,
    qtdEstoque: 40,
    estoqueMinimo: 20,
    ativo: true,
    categoria: { id: 4, nome: "Higiene" },
  },
  {
    id: 8,
    nome: "Caderno 10 Matérias",
    descricao: "Caderno espiral universitário capa dura",
    preco: 19.9,
    qtdEstoque: 8,
    estoqueMinimo: 10,
    ativo: true,
    categoria: { id: 5, nome: "Outros" },
  },
  {
    id: 9,
    nome: "Caneta Azul",
    descricao: "Caneta esferográfica azul ponta média",
    preco: 1.2,
    qtdEstoque: 50,
    estoqueMinimo: 30,
    ativo: true,
    categoria: { id: 5, nome: "Outros" },
  },
  {
    id: 10,
    nome: "Lápis Preto HB",
    descricao: "Lápis de grafite nº 2 preto para escrita",
    preco: 0.8,
    qtdEstoque: 12,
    estoqueMinimo: 15,
    ativo: true,
    categoria: { id: 5, nome: "Outros" },
  },
  {
    id: 11,
    nome: "Óleo de Soja 900ml",
    descricao: "Óleo refinado de soja de alta qualidade",
    preco: 6.8,
    qtdEstoque: 30,
    estoqueMinimo: 20,
    ativo: true,
    categoria: { id: 1, nome: "Alimentos" },
  },
];

// ── Helpers do Mock ──────────────────────────────────────────

function getMockData(): { produtos: Produto[]; categorias: CategoriaProduto[] } {
  if (typeof window === "undefined") {
    return { produtos: MOCK_PRODUTOS_INICIAIS, categorias: MOCK_CATEGORIAS };
  }

  let produtosStr = localStorage.getItem("sigecom_mock_produtos");
  let categoriasStr = localStorage.getItem("sigecom_mock_categorias");

  if (!categoriasStr) {
    localStorage.setItem("sigecom_mock_categorias", JSON.stringify(MOCK_CATEGORIAS));
    categoriasStr = JSON.stringify(MOCK_CATEGORIAS);
  }

  if (!produtosStr) {
    localStorage.setItem("sigecom_mock_produtos", JSON.stringify(MOCK_PRODUTOS_INICIAIS));
    produtosStr = JSON.stringify(MOCK_PRODUTOS_INICIAIS);
  }

  return {
    produtos: JSON.parse(produtosStr),
    categorias: JSON.parse(categoriasStr),
  };
}

function saveMockProdutos(produtos: Produto[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("sigecom_mock_produtos", JSON.stringify(produtos));
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  if (IS_MOCK) {
    await delay(400); // simula rede
    const { produtos } = getMockData();

    // Filtra apenas produtos ativos (ou todos)
    let filtrados = produtos;

    if (params.nome) {
      const search = params.nome.toLowerCase().trim();
      filtrados = filtrados.filter((p) => p.nome.toLowerCase().includes(search));
    }

    if (params.categoriaId) {
      const catId = Number(params.categoriaId);
      filtrados = filtrados.filter((p) => p.categoria.id === catId);
    }

    const page = params.page ?? 0;
    const size = params.size ?? 10;
    const totalElements = filtrados.length;
    const totalPages = Math.ceil(totalElements / size);
    const paginados = filtrados.slice(page * size, (page + 1) * size);

    return {
      content: paginados,
      totalPages: totalPages === 0 ? 1 : totalPages,
      totalElements,
      size,
      number: page,
    };
  }

  const response = await api.get<PageProduto>("/produtos", { params });
  return response.data;
}

/**
 * Cadastra um novo produto (apenas ADMIN).
 */
export async function criarProduto(dados: ProdutoRequest): Promise<Produto> {
  if (IS_MOCK) {
    await delay(300);
    const { produtos, categorias } = getMockData();

    const categoria = categorias.find((c) => c.id === Number(dados.categoriaId));
    if (!categoria) {
      throw {
        response: {
          status: 400,
          data: { usuarioMensagem: "Categoria inválida ou não encontrada." },
        },
      };
    }

    if (!dados.nome.trim()) {
      throw {
        response: {
          status: 400,
          data: { usuarioMensagem: "O nome do produto é obrigatório." },
        },
      };
    }

    if (dados.preco < 0) {
      throw {
        response: {
          status: 400,
          data: { usuarioMensagem: "O preço não pode ser negativo." },
        },
      };
    }

    const novo: Produto = {
      id: produtos.length > 0 ? Math.max(...produtos.map((p) => p.id)) + 1 : 1,
      nome: dados.nome.trim(),
      descricao: dados.descricao.trim(),
      preco: Number(dados.preco),
      qtdEstoque: 0, // todo produto começa com estoque 0 no cadastro
      estoqueMinimo: Number(dados.estoqueMinimo),
      ativo: true,
      categoria,
    };

    produtos.unshift(novo); // adiciona no início
    saveMockProdutos(produtos);
    return novo;
  }

  const response = await api.post<Produto>("/produtos", dados);
  return response.data;
}

/**
 * Edita os dados de um produto existente (apenas ADMIN).
 */
export async function editarProduto(id: number, dados: ProdutoRequest): Promise<Produto> {
  if (IS_MOCK) {
    await delay(300);
    const { produtos, categorias } = getMockData();

    const index = produtos.findIndex((p) => p.id === id);
    if (index === -1) {
      throw {
        response: {
          status: 404,
          data: { usuarioMensagem: "Produto não encontrado." },
        },
      };
    }

    const categoria = categorias.find((c) => c.id === Number(dados.categoriaId));
    if (!categoria) {
      throw {
        response: {
          status: 400,
          data: { usuarioMensagem: "Categoria inválida ou não encontrada." },
        },
      };
    }

    if (!dados.nome.trim()) {
      throw {
        response: {
          status: 400,
          data: { usuarioMensagem: "O nome do produto é obrigatório." },
        },
      };
    }

    if (dados.preco < 0) {
      throw {
        response: {
          status: 400,
          data: { usuarioMensagem: "O preço não pode ser negativo." },
        },
      };
    }

    const atualizado: Produto = {
      ...produtos[index],
      nome: dados.nome.trim(),
      descricao: dados.descricao.trim(),
      preco: Number(dados.preco),
      estoqueMinimo: Number(dados.estoqueMinimo),
      categoria,
    };

    produtos[index] = atualizado;
    saveMockProdutos(produtos);
    return atualizado;
  }

  const response = await api.put<Produto>(`/produtos/${id}`, dados);
  return response.data;
}

/**
 * Exclui um produto (apenas ADMIN).
 * Não deve excluir produto com movimentação de estoque ativa (ex. vendas associadas).
 */
export async function excluirProduto(id: number): Promise<void> {
  if (IS_MOCK) {
    await delay(300);
    const { produtos } = getMockData();

    const produto = produtos.find((p) => p.id === id);
    if (!produto) {
      throw {
        response: {
          status: 404,
          data: { usuarioMensagem: "Produto não encontrado." },
        },
      };
    }

    // Regra de negócio fictícia para o mock:
    // Produtos de ID par ou com estoque maior que 10 não podem ser excluídos para simular vendas/movimentação.
    // Isso nos permite testar o fluxo de erro na interface.
    if (id % 2 === 0) {
      throw {
        response: {
          status: 409,
          data: {
            usuarioMensagem: `Não é possível excluir o produto "${produto.nome}" porque ele possui vendas ou movimentações de estoque registradas no sistema.`,
          },
        },
      };
    }

    const filtrados = produtos.filter((p) => p.id !== id);
    saveMockProdutos(filtrados);
    return;
  }

  await api.delete(`/produtos/${id}`);
}

/**
 * Ajusta a quantidade em estoque de um produto (apenas ADMIN).
 */
export async function ajustarEstoque(id: number, quantidade: number): Promise<Produto> {
  if (IS_MOCK) {
    await delay(300);
    const { produtos } = getMockData();

    const index = produtos.findIndex((p) => p.id === id);
    if (index === -1) {
      throw {
        response: {
          status: 404,
          data: { usuarioMensagem: "Produto não encontrado." },
        },
      };
    }

    if (quantidade < 0) {
      throw {
        response: {
          status: 400,
          data: { usuarioMensagem: "A quantidade em estoque não pode ser negativa." },
        },
      };
    }

    produtos[index].qtdEstoque = Math.floor(quantidade);
    saveMockProdutos(produtos);
    return produtos[index];
  }

  const response = await api.post<Produto>(`/produtos/${id}/ajustar-estoque`, {
    quantidade,
  });
  return response.data;
}

/**
 * Lista todas as categorias de produtos disponíveis.
 */
export async function listarCategorias(): Promise<CategoriaProduto[]> {
  if (IS_MOCK) {
    await delay(200);
    const { categorias } = getMockData();
    return categorias;
  }

  const response = await api.get<CategoriaProduto[]>("/categorias-produto");
  return response.data;
}

/**
 * Lista produtos de uma categoria específica.
 */
export async function listarProdutosPorTipo(categoriaId: number): Promise<Produto[]> {
  if (IS_MOCK) {
    await delay(200);
    const { produtos } = getMockData();
    return produtos.filter((p) => p.categoria.id === categoriaId && p.ativo);
  }

  const response = await api.get<Produto[]>(`/produtos/por-tipo/${categoriaId}`);
  return response.data;
}
