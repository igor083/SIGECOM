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
| `POST /seed/usuarios` | 6 usuários de teste |
| `POST /seed/categorias-produto` | 11 categorias de produto |
| `POST /seed/categorias-financeiras` | 13 categorias financeiras (inclui a `Venda`) |
| `POST /seed/produtos` | 50 produtos com estoque |
| `POST /seed/lancamentos` | despesas mensais fixas, compra semanal e movimentos avulsos |
| `POST /seed/vendas` | vendas com itens, baixa de estoque e receita |
| `POST /seed/fechamentos` | fechamento de caixa dos dias encerrados |

A ordem importa: produto depende de categoria de produto, venda depende de
produto + usuário + categoria `Venda`, fechamento lê o que veio antes. Rodar
fora de ordem não quebra nada — a etapa devolve uma observação dizendo o que
falta.

## Usuários para login

**Senha de todos: `senha123`.**

| E-mail | Senha | Perfil | Vem de |
| --- | --- | --- | --- |
| `adm@adm.com` | `senha123` | ADMIN | a aplicação, no boot |
| `gerente@seed.sigecom.local` | `senha123` | ADMIN | seeder |
| `rafael@seed.sigecom.local` | `senha123` | FUNCIONARIO | seeder |
| `juliana@seed.sigecom.local` | `senha123` | FUNCIONARIO | seeder |
| `marcos@seed.sigecom.local` | `senha123` | FUNCIONARIO | seeder |
| `carla@seed.sigecom.local` | `senha123` | FUNCIONARIO | seeder |
| `bruno@seed.sigecom.local` | `senha123` | FUNCIONARIO | seeder |

Nenhum deles cai na tela de troca de senha no primeiro login — todos são
gravados com `senhaTemporaria=false`, de propósito, para o uso ser imediato.

O `adm@adm.com` **não** vem daqui: é criado pela própria aplicação
(`AdminInicialSeeder`), no boot, e é o único mock que sobrou lá dentro. Os
outros seis são do seeder, e são eles que assinam todo o movimento gerado —
toda venda, lançamento e fechamento sai no nome de um deles, o que deixa óbvio
em qualquer tela que aquele registro é dado de teste.

Para trocar as senhas: `SEED_SENHA` muda a dos seis do seeder,
`sigecom.admin-inicial.senha` muda a do `adm@adm.com`.

## O que é criado

Numa janela de 90 dias (o padrão), um `POST /seed` põe cerca de **1.380 linhas**
no banco:

| Quanto | O quê |
| --- | --- |
| **6** usuários | 1 ADMIN e 5 FUNCIONARIO, todos com senha `senha123` |
| **11** categorias de produto | Bebidas, Mercearia, Hortifruti, Limpeza, Higiene, Padaria, Frios e Laticínios, Doces e Snacks, Carnes e Peixes, Casa e Utilidades, Pet |
| **13** categorias financeiras | 3 de receita e 10 de despesa, incluindo a `Venda` que o `VendaService` da aplicação exige em runtime |
| **50** produtos | de R$ 2,20 (sabonete) a R$ 129,90 (cafeteira), com estoque e estoque mínimo — alguns propositalmente abaixo do mínimo, para a tela de alerta ter o que mostrar |
| **~230** vendas | com itens, forma de pagamento e desconto; ticket médio ~R$ 160, ~3 itens por venda |
| **~677** itens de venda | criados junto com a venda, com baixa no estoque do produto |
| **~315** lançamentos financeiros | uma receita por venda, mais 85 de despesa fixa mensal, compra semanal de mercadoria e movimentos avulsos |
| **~78** fechamentos de caixa | um por dia encerrado com movimento; o dia corrente fica sempre em aberto |

O relatório do `POST /seed` fecha em `473 criados`, não 1.380 — ele conta por
etapa, e duas coisas não têm etapa própria: o item de venda nasce junto com a
venda, e a receita de cada venda é lançada dentro da etapa de vendas, não na de
lançamentos.

Nada disso é escrito em tabela nova: são as tabelas da própria aplicação, com
os mesmos campos que o PDV, o financeiro e o caixa preencheriam. A única tabela
que o seeder cria é a `seed_registro`, onde ele anota o que gerou (ver
[Limpeza](#limpeza)).

O que **não** é criado: nenhum dado no futuro, nenhum fechamento do dia
corrente, e nenhum registro que já exista — ver [Idempotência](#idempotência).

## Volume e distribuição

As vendas não são distribuídas de forma uniforme pela janela: o volume diário
cresce conforme o dia se aproxima de hoje. A janela inteira tem histórico, mas
a semana corrente concentra dado o bastante para que as telas de hoje e dos
últimos 7 dias não abram vazias. Em números típicos: ~6 vendas hoje, ~38 nos
últimos 7 dias, ~77 no mês corrente, ~71 no mês passado, ~62 no retrasado.

O financeiro fecha equilibrado de propósito — receita e despesa na mesma ordem
de grandeza, com o mês virando ora positivo, ora negativo. As despesas do
`SeedCatalogo` estão dimensionadas para o volume de vendas que o
`VendaSeedService` gera; mexer num sem mexer no outro desequilibra o DRE.

Todas as 13 categorias financeiras recebem movimento, incluindo as receitas que
não vêm de venda (`Recebimento de Divida`, `Outra Receita`), geradas como
movimentos avulsos semanais.

## Idempotência

Rodar duas vezes seguidas não duplica nada. A resposta prova isso: na segunda
execução, `criados` volta 0 e `ignorados` fica com o total.

`ignorados` significa uma coisa só: **o registro já existia**. Venda que não
pôde ser montada por falta de estoque no catálogo não entra nesse contador —
ela é reportada à parte, na `observacao` da etapa. Contar os dois juntos foi o
que mascarou, por um tempo, uma quebra real de idempotência: a resposta trazia
`ignorados: 34` num banco que estava vazio, número impossível, e isso passava
por prova de que nada tinha sido duplicado.

O que sustenta a idempotência das vendas é o gerador pseudoaleatório ser
isolado por `(dia, slot)`. Um gerador por dia, compartilhado entre os slots,
não serve: o slot que já existe sai por um `continue` sem consumir sorteio
nenhum, enquanto montar uma venda consome vários — a composição de um slot
passa a depender de quantos slots antes dele já estavam no banco, e a segunda
execução sorteia outra coisa.

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
semeado por `sigecom.seed.random-seed` mais a chave do registro, então o mesmo
par (dia, slot) sempre produz exatamente a mesma venda, independente do tamanho
da janela e da ordem em que o seeder passou pelos outros slots.

A *quantidade* de vendas de um dia é a única coisa que depende de quando você
roda: ela sai do patamar do dia (hoje, semana corrente, mês passado…), então um
dia semeado hoje guarda o volume alto de hoje e não perde vendas quando
envelhece. Isso não duplica nada — o patamar só encolhe com o tempo, e venda
que já existe é reconhecida pelo instante.

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

## Aviso

Ferramenta de desenvolvimento. Não tem autenticação, escuta só em loopback e
escreve direto no banco. Nunca suba isto em produção.
