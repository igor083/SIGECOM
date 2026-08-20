# SIGECOM — Front-end

Front-end do **Sistema Inteligente de Gestão Comercial** (SIGECOM).  
Projeto acadêmico — Gerência de Projetos, UEPB.

## Stack

- [Next.js 16.2.9](https://nextjs.org/) (App Router) + TypeScript
- [React 19.2.4](https://react.dev/)
- [Axios](https://axios-http.com/) para chamadas à API
- [Recharts](https://recharts.org/) para gráficos no dashboard
- CSS Modules para estilos escopados

## Pré-requisitos

- **Node.js** ≥ 20.9 — exigido pelo Next 16 (`engines: node >=20.9.0`); no 18 o
  `npm install` falha
- **npm** ≥ 9
- **API** rodando em `http://localhost:8080` (ver `../api/README.md`)

## Instalação e execução

```bash
# 1. Instale as dependências
npm install

# 2. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local se a API estiver em outra URL

# 3. Rode o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com hot-reload |
| `npm run build` | Build de produção |
| `npm run start` | Inicia o servidor de produção (requer build) |
| `npm run lint` | Executa o ESLint |

## Estrutura de pastas

```
src/
├── app/                         ← Páginas (App Router)
│   ├── layout.tsx               ← Layout raiz com Providers
│   ├── page.tsx                 ← Redireciona para /login
│   ├── login/                   ← Rota /login
│   ├── cadastro/                ← Rota /cadastro (registro de usuários)
│   ├── produtos/                ← Rota /produtos (listagem, cadastro, edição)
│   ├── dashboard/
│   │   ├── admin/               ← Dashboard do administrador
│   │   └── funcionario/         ← Dashboard do funcionário
│   └── configuracoes/
│       ├── page.tsx             ← Configurações gerais
│       └── financeiro/          ← Parâmetros financeiros (markup)
├── components/
│   └── Sidebar.tsx              ← Menu lateral de navegação
├── hooks/
│   ├── useAuth.tsx              ← Estado de autenticação, login/logout
│   └── useProdutos.ts           ← Listagem e operações de produtos
└── services/                    ← Camada de acesso à API
    ├── api.ts                   ← Instância Axios com interceptors JWT
    ├── auth.ts                  ← Login e cadastro de usuários
    ├── produtos.ts              ← CRUD de produtos
    └── parametrosFinanceiros.ts ← Leitura e atualização de markup
```

## Variáveis de ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL base da API Spring Boot | `http://localhost:8080` |

## Convenções

- **UI em português** — os usuários são lojistas com baixa familiaridade tecnológica
- Componentes **não** chamam a API diretamente — tudo via `services/`
- Lógica reutilizável fica em `hooks/`
- Nunca commitar `.env.local`, secrets ou `node_modules`
