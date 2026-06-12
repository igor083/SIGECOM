# sigecom-api

API REST do sistema SIGECOM, desenvolvida com Spring Boot 4 e Java 21.

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

## 2. Executar a aplicação

```bash
./mvnw spring-boot:run
```

Ou, no Windows:

```cmd
mvnw.cmd spring-boot:run
```

A API estará disponível em `http://localhost:8080`.

## 3. Documentação (Swagger)

Com a aplicação rodando, acesse:

| Interface | URL |
|---|---|
| Swagger UI | `http://localhost:8080/swagger-ui/index.html` |
| OpenAPI JSON | `http://localhost:8080/v3/api-docs` |

Para testar endpoints protegidos no Swagger UI, clique em **Authorize** e informe o token JWT obtido via `POST /auth/login` no formato `Bearer <token>`.

## Variáveis de configuração

As configurações do banco ficam em `src/main/resources/application.properties`:

| Propriedade | Valor padrão |
|---|---|
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/sigecom` |
| `spring.datasource.username` | `postgres` |
| `spring.datasource.password` | `postgres` |
| `jwt.secret` | chave Base64 (via `JWT_SECRET`) |
| `jwt.expiration-ms` | `3600000` (1 hora) |

As variáveis JWT podem ser sobrescritas criando um arquivo `.env.local` na raiz do projeto (veja `.env.local` de exemplo).

## Parar e remover o container

```bash
docker stop sigecom-db
docker rm sigecom-db
```
