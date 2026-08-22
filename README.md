# SIGECOM

Sistema Inteligente de Gestão Comercial. Controle de estoque, PDV, financeiro,
fechamento de caixa e relatórios para pequenos comércios.

Projeto acadêmico de Gerência de Projetos, UEPB.

## Estrutura

O repositório reúne três aplicações independentes. Cada uma sobe por conta
própria, não há build na raiz.

| Pasta | O que é | Porta |
|---|---|---|
| [`api/`](api/README.md) | API REST principal. Regra de negócio, autenticação JWT, dona do schema do banco | `8080` |
| [`front/`](front/README.md) | Interface web em Next.js, consome a `api/` | `3000` |
| [`seeder/`](seeder/README.md) | API de geração de dados de teste, sob demanda | `8081` |

A `api/` sobe limpa, com um único usuário administrador. Os dados de teste
vêm do `seeder/`, que roda só quando você pede e sabe desfazer o que criou.

Para rodar o sistema você precisa de `api/` e `front/`. O `seeder/` é opcional.

## Pré-requisitos

- [PostgreSQL 15](https://www.postgresql.org/download/) ou
  [Docker](https://www.docker.com/) instalado e em execução
- [Java 21](https://adoptium.net/) (JDK)
- [Node.js 20.9](https://nodejs.org/) ou superior, com npm 9 ou superior
- [Maven](https://maven.apache.org/) (ou use o wrapper `./mvnw`)

## 1. Criar o banco de dados PostgreSQL

A aplicação espera um PostgreSQL em `localhost:5432`, banco `sigecom`,
usuário e senha `postgres`.

Use o PostgreSQL instalado na máquina ou um container Docker. Os dois
entregam a mesma coisa.

### PostgreSQL instalado na máquina

Instale o PostgreSQL 15 ou superior. No Windows, use `postgres` como senha do
superusuário quando o instalador pedir.

Crie a base de dados:

```bash
psql -U postgres -c "CREATE DATABASE sigecom;"
```

Pelo pgAdmin: botão direito em Databases, Create, Database, nome `sigecom`.

Confira que ela existe:

```bash
psql -U postgres -l
```

### PostgreSQL em container Docker

Execute o container com as credenciais esperadas pela aplicação:

```bash
docker run -d --name sigecom-db -e POSTGRES_DB=sigecom -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15

```

Aguarde alguns segundos até o container estar pronto. Nas próximas vezes,
`docker start sigecom-db` já basta.

O container e o PostgreSQL instalado disputam a porta 5432. Use um dos dois.

## 2. Ajustar as credenciais do banco

Este passo só é necessário se o usuário ou a senha do seu PostgreSQL não forem
`postgres`. São dois arquivos porque a API e o seeder conectam separadamente.

Em `api/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/sigecom
spring.datasource.username=postgres
spring.datasource.password=postgres
```

Em `seeder/src/main/resources/application.properties`:

```properties
spring.datasource.url=${SEEDER_DB_URL:jdbc:postgresql://localhost:5432/sigecom}
spring.datasource.username=${SEEDER_DB_USER:postgres}
spring.datasource.password=${SEEDER_DB_PASS:postgres}
```

Nada mais precisa ser alterado nesses arquivos.

## 3. Executar a API

Execute antes das outras aplicações. É a `api/` que cria as tabelas.

```bash
cd api
./mvnw spring-boot:run
```

Ou, no Windows:

```cmd
cd api
mvnw.cmd spring-boot:run
```

A API estará disponível em `http://localhost:8080`.

## 4. Executar o front-end

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

## 5. Gerar dados de teste (opcional)

```bash
cd seeder
./mvnw spring-boot:run
```

Com o seeder no ar em `http://localhost:8081`:

```bash
curl -X POST   http://localhost:8081/seed
curl           http://localhost:8081/seed/status
curl -X DELETE http://localhost:8081/seed
```

Rodar duas vezes não duplica nada. A remoção apaga só o que ele criou.

## Primeiro acesso

A `api/` cria um único registro no primeiro start contra um banco vazio:

| E-mail | Senha | Perfil |
|---|---|---|
| `adm@adm.com` | `senha123` | ADMIN |

Ele existe porque o cadastro de usuário exige um ADMIN autenticado.

Antes de usar o PDV, cadastre a categoria financeira `Venda` do tipo Receita
em Financeiro, Gerenciar categorias. Toda venda confirmada é lançada nessa
categoria e sem ela o registro de venda falha. O seeder já cria essa categoria.

Os usuários gerados pelo seeder (`*@seed.sigecom.local`, senha `senha123`)
também servem para login e testam o perfil FUNCIONARIO.

## Portas

| Serviço | URL |
|---|---|
| Front-end | `http://localhost:3000` |
| API | `http://localhost:8080` |
| Swagger da API | `http://localhost:8080/swagger-ui/index.html` |
| Seeder | `http://localhost:8081` |
| Swagger do seeder | `http://localhost:8081/swagger-ui.html` |
| PostgreSQL | `localhost:5432` |

## Executar os testes

```bash
cd api && ./mvnw test
cd front && npm run build
cd front && npm run lint
```

Os testes da `api/` usam H2 em memória e rodam com o PostgreSQL desligado.
São 288 testes. O relatório do JaCoCo fica em `target/site/jacoco` após
`./mvnw verify`.

## Remover o banco de dados

```bash
dropdb -U postgres sigecom
```

Ou, se você usou o container:

```bash
docker stop sigecom-db
docker rm sigecom-db
```

## Avisos

- O `seeder/` escuta só em loopback e não tem autenticação. Não suba em produção.
- O projeto usa `ddl-auto=update` sem migrations. Mudança de tipo ou constraint
  em banco já populado pode exigir `ALTER TABLE` manual.
- Não comite `.env`, `.env.local`, secrets ou `node_modules`.
