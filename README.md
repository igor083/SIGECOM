# SIGECOM

**Sistema Inteligente de Gestão Comercial** — controle de estoque, PDV, financeiro,
fechamento de caixa e relatórios para pequenos comércios.

Projeto acadêmico — Gerência de Projetos, UEPB.

## Pastas

O repositório reúne três aplicações independentes. Não há build na raiz: cada uma
sobe e é versionada por conta própria.

| Pasta | O que é | Porta |
|---|---|---|
| [`api/`](api/README.md) | API REST principal — regra de negócio, autenticação JWT, dona do schema do banco | `8080` |
| [`front/`](front/README.md) | Interface web em Next.js, consome a `api/` | `3000` |
| [`seeder/`](seeder/README.md) | API de geração de dados de teste, sob demanda | `8081` |

**Por que o seeder é separado.** A `api/` não cria dados de demonstração no boot:
sobe limpa, com um único usuário administrador. Todo o volume de dados de teste
(catálogo, vendas, financeiro, caixa) vem do `seeder/`, que roda só quando você
pede e sabe desfazer o que criou. Assim ninguém carrega mock para produção sem
querer, e o start da aplicação não depende de nada disso.

Para desenvolver e testar as telas você precisa das três; para rodar o sistema de
verdade, só de `api/` + `front/`.

## Pré-requisitos

| Ferramenta | Versão | Usado por |
|---|---|---|
| [Docker](https://www.docker.com/) | qualquer recente | banco PostgreSQL |
| [JDK](https://adoptium.net/) | 21 | `api/`, `seeder/` |
| [Node.js](https://nodejs.org/) | ≥ 20.9 (npm ≥ 9) | `front/` |

Maven não precisa ser instalado — use o wrapper `./mvnw` (ou `mvnw.cmd` no
Windows) que já vem em `api/` e `seeder/`.

## Executando

### 1. Banco de dados

```bash
docker run -d --name sigecom-db -e POSTGRES_DB=sigecom -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15

```

Nas próximas vezes, `docker start sigecom-db` já basta.

### 2. API

```bash
cd api
./mvnw spring-boot:run
```

Sobe em `http://localhost:8080`. **Rode esta etapa antes das outras**: é a `api/`
que cria as tabelas (`ddl-auto=update`).

Não há nada para configurar antes: os valores de desenvolvimento (segredo do
JWT, expiração do token) já vêm como padrão no `application.properties`. Para
trocá-los, exporte as variáveis de ambiente antes de subir — detalhes em
[`api/README.md`](api/README.md).

### 3. Front-end

```bash
cd front
npm install
cp .env.example .env.local   # obrigatório — veja abaixo
npm run dev
```

> **⚠️ O `.env.local` é obrigatório.** O front **não** sobe configurado sozinho:
> ele lê a URL da API de `NEXT_PUBLIC_API_URL`, e essa variável só existe se você
> criar o arquivo. O `.env.example` é o modelo — copie-o para `.env.local` (ele é
> ignorado pelo git, então cada pessoa cria o seu) e ajuste os valores se
> precisar:
>
> ```bash
> # front/.env.local
> NEXT_PUBLIC_API_URL=http://localhost:8080
> ```
>
> Sem esse arquivo, as telas carregam mas nenhuma chamada à API funciona.

Acesse `http://localhost:3000`.

### 4. Dados de teste (opcional)

```bash
cd seeder
./mvnw spring-boot:run
```

Com ele no ar em `http://localhost:8081`:

```bash
curl -X POST   http://localhost:8081/seed    # gera tudo
curl           http://localhost:8081/seed/status
curl -X DELETE http://localhost:8081/seed    # remove só o que ele criou
```

Rodar duas vezes não duplica nada, e a limpeza devolve o banco ao estado
anterior. Detalhes em [`seeder/README.md`](seeder/README.md).

## Primeiro acesso

A `api/` cria **um único** registro no primeiro start contra um banco vazio:

| E-mail | Senha | Perfil |
|---|---|---|
| `adm@adm.com` | `senha123` | ADMIN |

Ele existe porque o cadastro de usuário exige um ADMIN autenticado — sem ele, um
banco novo não teria como criar o primeiro login. É idempotente: trocar a senha
pela aplicação não é desfeito no próximo start.

> **Antes de usar o PDV:** cadastre a categoria financeira **`Venda`** do tipo
> *Receita*, em **Financeiro › Gerenciar categorias**. Toda venda confirmada é
> lançada no financeiro nessa categoria, e sem ela o registro de venda falha. A
> tela avisa e oferece o atalho de criação enquanto ela não existir. Se você
> rodar o seeder, ele já cria essa categoria.

Os usuários gerados pelo seeder (`*@seed.sigecom.local`, senha `senha123`)
também servem para login e são úteis para testar o perfil FUNCIONARIO.

## Portas

| Serviço | URL |
|---|---|
| Front-end | `http://localhost:3000` |
| API | `http://localhost:8080` |
| Swagger da API | `http://localhost:8080/swagger-ui/index.html` |
| Seeder | `http://localhost:8081` (só loopback) |
| Swagger do seeder | `http://localhost:8081/swagger-ui.html` |
| PostgreSQL | `localhost:5432` |

## Testes

```bash
cd api && ./mvnw test       # 288 testes; JaCoCo em target/site/jacoco após ./mvnw verify
cd front && npm run build   # também roda o type-check
cd front && npm run lint
```

Os três passam limpos.

## Avisos

- O `seeder/` é ferramenta de desenvolvimento: escuta só em loopback, não tem
  autenticação e escreve direto no banco. **Nunca suba em produção.**
- O projeto usa `ddl-auto=update` **sem migrations**. Mudança de tipo ou
  constraint em banco já populado pode exigir `ALTER TABLE` manual.
- Não comite `.env`, `.env.local`, secrets ou `node_modules`.
