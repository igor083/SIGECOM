# SIGECOM — Front-end

Front-end do **Sistema Inteligente de Gestão Comercial** (SIGECOM).  
Projeto acadêmico — Gerência de Projetos, UEPB.

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- [Axios](https://axios-http.com/) para chamadas à API
- CSS Modules para estilos escopados

## Pré-requisitos

- **Node.js** ≥ 18
- **npm** ≥ 9
- **API** rodando em `http://localhost:8080` (ver `../sigecom-api/`)

## Instalação

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

## Estrutura de pastas

```
src/
├── app/            ← Páginas (App Router)
│   ├── layout.tsx  ← Layout raiz com Providers
│   ├── page.tsx    ← Home (placeholder)
│   └── login/      ← Rota /login (placeholder para US-004)
├── components/     ← Componentes reutilizáveis (a criar)
├── hooks/          ← Hooks customizados
│   └── useAuth.ts  ← Estado de autenticação, login/logout
└── services/       ← Camada de serviços (API)
    ├── api.ts      ← Instância Axios com interceptors
    └── auth.ts     ← Funções de login e cadastro
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
