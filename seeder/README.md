# SIGECOM Seeder

API de geração de dados de teste do SIGECOM. Escreve direto no mesmo banco da
aplicação original (`api/`), sob demanda, via HTTP.

Existe para tirar a criação de mocks de dentro da aplicação: a `api/` sobe
limpa, com um único usuário administrador, e todo o resto do volume de dados
(catálogo, vendas, financeiro, caixa) vem daqui — só quando você pedir.

## Rodando

```bash
cd seeder
./mvnw spring-boot:run
```

Sobe em `http://localhost:8081`, escutando **apenas em loopback**. Swagger em
`http://localhost:8081/swagger-ui.html`.

Pré-requisitos: o Postgres do projeto no ar e a aplicação original já tendo
subido pelo menos uma vez — é ela que cria o schema (`ddl-auto=update`). O
seeder roda com `ddl-auto=none` e nunca toca em tabela da aplicação.

A única tabela que ele cria é a sua própria (`seed_registro`, via
`CREATE TABLE IF NOT EXISTS`), onde anota o que gerou. Ela não pertence ao
domínio da aplicação: nenhuma entidade de lá a referencia, e apagá-la só faz o
seeder esquecer o que criou.

## Uso

```bash
# gera tudo, na ordem correta de dependência
curl -X POST http://localhost:8081/seed

# o que existe no banco hoje, separando dado de seed de dado real
curl http://localhost:8081/seed/status

# remove apenas o que o seeder gerou
curl -X DELETE http://localhost:8081/seed
```

Etapas individuais, se você quiser só uma parte:

| Rota | O que gera |
| --- | --- |
| `POST /seed/usuarios` | 5 usuários de teste |
| `POST /seed/categorias-produto` | 8 categorias de produto |
| `POST /seed/categorias-financeiras` | 13 categorias financeiras (inclui a `Venda`) |
| `POST /seed/produtos` | 35 produtos com estoque |
| `POST /seed/lancamentos` | despesas mensais fixas + compra semanal |
| `POST /seed/vendas` | vendas com itens, baixa de estoque e receita |
| `POST /seed/fechamentos` | fechamento de caixa dos dias encerrados |

A ordem importa: produto depende de categoria de produto, venda depende de
produto + usuário + categoria `Venda`, fechamento lê o que veio antes. Rodar
fora de ordem não quebra nada — a etapa devolve uma observação dizendo o que
falta.

## Idempotência

Rodar duas vezes seguidas não duplica nada. A resposta prova isso: na segunda
execução, `criados` volta 0 e `ignorados` fica com o total.

Cada recurso é reconhecido por uma chave natural, sem coluna nova no schema:

| Recurso | Chave |
| --- | --- |
| Usuário | e-mail |
| Categoria de produto | nome |
| Categoria financeira | par (nome, tipo) |
| Produto | nome |
| Venda | instante exato (dia + slot fixo) + vendedor |
| Lançamento | descrição (`Venda #id`, `[seed] Aluguel 2026-07`) |
| Fechamento | data (existe no máximo um por dia) |

Registro que já existe é **reaproveitado como está**, nunca sobrescrito: se
você mudou o preço de um produto ou o nome de um usuário pela aplicação, o
seeder respeita a mudança.

A composição dos dados é pseudoaleatória mas determinística — o gerador é
semeado por dia (`sigecom.seed.random-seed` + data), então a mesma data sempre
produz as mesmas vendas, independente do tamanho da janela.

Rodar amanhã acrescenta só o dia novo. Nada de arquivo temporário: o seeder não
escreve nada em disco.

## Consistência com a aplicação

Cada venda gerada reproduz o que `VendaService.confirmar()` faria: grava os
itens, dá baixa no estoque e lança a receita no financeiro com a descrição
`Venda #id`. É a mesma convenção que o `VendaFinanceiroBackfillRunner` da
aplicação procura, então ele nunca vai lançar essa receita de novo.

Os fechamentos usam as mesmas agregações do `FechamentoCaixaService`
(`saldo = receitas - despesas`, `esperado = fundo de troco + saldo`), lidas do
próprio banco — não são números inventados.

## Limpeza

`DELETE /seed` remove o que o seeder criou e **só isso**.

A fonte da verdade é o livro-caixa (`seed_registro`): entra lá apenas a linha que
o seeder realmente inseriu. Cadastro que ele apenas **reaproveitou** — uma
categoria, produto ou usuário que já existia quando ele rodou — nunca é tocado.
Essa distinção é o ponto todo: sem ela, a limpeza teria que adivinhar a origem
de um registro pelo nome, e apagaria dado que já era seu.

Em cima disso vale uma guarda de integridade: registro que passou a ser
referenciado por dado real (produto que entrou numa venda do PDV, categoria que
ganhou lançamento manual) fica onde está, e o relatório diz quantos foram
mantidos e por quê. Por isso a limpeza nunca falha por violação de chave
estrangeira.

Também é idempotente: rodar de novo devolve tudo zerado.

Verificado na prática — gerar, gerar de novo e limpar devolve o banco à contagem
exata de antes, em todas as tabelas, incluindo `item_venda`.

## Configuração

Tudo por variável de ambiente, com padrão de desenvolvimento:

| Variável | Padrão | O que é |
| --- | --- | --- |
| `SEEDER_PORT` | `8081` | porta HTTP |
| `SEEDER_BIND` | `127.0.0.1` | interface de escuta |
| `SEEDER_DB_URL` | `jdbc:postgresql://localhost:5432/sigecom` | banco alvo |
| `SEEDER_DB_USER` / `SEEDER_DB_PASS` | `postgres` / `postgres` | credenciais |
| `SEED_DIAS` | `90` | janela retroativa de vendas/lançamentos/fechamentos |
| `SEED_RANDOM` | `20260816` | semente do gerador |
| `SEED_SENHA` | `senha123` | senha dos usuários de teste |

Para mudar o volume ou a composição dos dados, edite as listas em
`SeedCatalogo.java` — não há nada aleatório na composição do catálogo.

## Usuários gerados

Todos com a senha `senha123`, prontos para login na aplicação:

- `gerente@seed.sigecom.local` — ADMIN
- `rafael@seed.sigecom.local`, `juliana@seed.sigecom.local`,
  `marcos@seed.sigecom.local`, `carla@seed.sigecom.local` — FUNCIONARIO

O `adm@adm.com` **não** vem daqui: ele é criado pela própria aplicação, no
boot, e é o único mock que sobrou lá dentro.

## Aviso

Ferramenta de desenvolvimento. Não tem autenticação, escuta só em loopback e
escreve direto no banco. Nunca suba isto em produção.
