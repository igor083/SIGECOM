# sigecom-api

API REST do sistema SIGECOM, desenvolvida com Spring Boot 4.0.6 e Java 21.

## Pré-requisitos

- [Docker](https://www.docker.com/) instalado e em execução
- [Java 21](https://adoptium.net/) (JDK)
- [Maven](https://maven.apache.org/) (ou use o wrapper `./mvnw`)

## 1. Subir o banco de dados PostgreSQL

Execute o container do PostgreSQL com as credenciais esperadas pela aplicação:

```bash
docker run -d \
  --name sigecom-db \
  -e POSTGRES_DB=sigecom \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15
```

Aguarde alguns segundos até o container estar pronto.

## 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz da pasta `api/` baseado no `.env.local`:

```bash
cp .env.local .env
```

| Variável | Descrição | Padrão |
|---|---|---|
| `JWT_SECRET` | Chave Base64 (≥ 256 bits) para assinar tokens JWT | valor de exemplo (dev only) |
| `JWT_EXPIRATION_MS` | Validade do token em milissegundos | `3600000` (1 hora) |
| `REQUIRE_ADMIN_CADASTRO` | `true` exige perfil ADMIN para cadastrar usuários | `true` |

> **Nunca** comite a chave JWT de produção no repositório.

## 3. Executar a aplicação

```bash
./mvnw spring-boot:run
```

Ou, no Windows:

```cmd
mvnw.cmd spring-boot:run
```

A API estará disponível em `http://localhost:8080`.

### Primeiro acesso

No primeiro start contra um banco vazio, a aplicação cria **um único** registro: o
administrador inicial.

| E-mail | Senha | Perfil |
|---|---|---|
| `adm@adm.com` | `senha123` | ADMIN |

Ele existe porque o cadastro de usuário exige um ADMIN autenticado — sem ele, um
banco novo não teria como criar o primeiro login. É idempotente: se o usuário já
existe, nada acontece (trocar a senha pela aplicação não é desfeito no próximo
start). Para mudar os valores, use `sigecom.admin-inicial.email` / `.senha` /
`.nome`.

O outro job de boot é o `VendaFinanceiroBackfillRunner`, que cria a receita
retroativa das vendas registradas antes da integração venda→financeiro. Também é
idempotente (só cria o que ainda não existe, pela convenção de descrição
`Venda #id`), então vira no-op depois que as vendas antigas são cobertas.

Fora esses dois, **a aplicação não cria nenhum dado de demonstração no boot**.
Duas consequências práticas:

- **A categoria financeira `Venda` (RECEITA) é pré-requisito de operação.** Toda
  venda confirmada no PDV é lançada no financeiro nessa categoria, e sem ela o
  registro de venda falha. Cadastre-a em **Financeiro › Gerenciar categorias**; a
  tela avisa e oferece o atalho enquanto ela não existir.
- **Dados de teste (catálogo, vendas, financeiro, caixa) vêm da API seeder**, em
  [`../seeder`](../seeder/README.md), que roda sob demanda e fora do boot.

## 4. Documentação (Swagger)

Com a aplicação rodando, acesse:

| Interface | URL |
|---|---|
| Swagger UI | `http://localhost:8080/swagger-ui/index.html` |
| OpenAPI JSON | `http://localhost:8080/v3/api-docs` |

Para testar endpoints protegidos, clique em **Authorize** e informe o token JWT obtido via `POST /auth/login` no formato `Bearer <token>`.

### Exemplos de payload

**Login:**
```json
{
  "email": "usuario@email.com",
  "senha": "senha123"
}
```

**Cadastro de funcionário (requer ADMIN):**
```json
{
  "nome": "Nome Completo",
  "email": "funcionario@email.com",
  "senha": "senha123",
  "perfil": "FUNCIONARIO"
}
```

## 5. Rodar os testes

```bash
./mvnw test
```

O projeto usa **JaCoCo** para cobertura. Um relatório HTML é gerado em `target/site/jacoco/` após `./mvnw verify`. A cobertura mínima exigida é **80 %** nas classes `EstoqueService`, `AuthService` e `Produto`.

## Variáveis de configuração (application.properties)

| Propriedade | Valor padrão |
|---|---|
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/sigecom` |
| `spring.datasource.username` | `postgres` |
| `spring.datasource.password` | `postgres` |
| `spring.jpa.hibernate.ddl-auto` | `update` |
| `jwt.secret` | resolvido via `JWT_SECRET` |
| `jwt.expiration-ms` | resolvido via `JWT_EXPIRATION_MS` |
| `sigecom.admin-inicial.email` | `adm@adm.com` |
| `sigecom.admin-inicial.senha` | `senha123` |
| `sigecom.admin-inicial.nome` | `Administrador` |

## Parar e remover o container

```bash
docker stop sigecom-db
docker rm sigecom-db
```
