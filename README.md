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

## Variáveis de configuração

As configurações do banco ficam em `src/main/resources/application.properties`:

| Propriedade | Valor padrão |
|---|---|
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/sigecom` |
| `spring.datasource.username` | `postgres` |
| `spring.datasource.password` | `postgres` |

## Parar e remover o container

```bash
docker stop sigecom-db
docker rm sigecom-db
```
