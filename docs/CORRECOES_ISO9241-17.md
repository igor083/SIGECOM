# Correções ISO 9241-17 — Formulários de cadastro do SIGECOM

Telas avaliadas: **Cadastro de Produto** (`/produtos`, modal "Novo Produto"), **Lançamento Financeiro** (`/financeiro`, formulário "Novo lançamento") e **Cadastro de Usuário** (`/usuarios`, modal "Novo Usuário").

Branch: `fix/iso9241-17`, criada a partir de `origin/feat/ihc-adpatacao-formularios`. Essa branch traz o commit `ee3fb89` (checkbox de confirmação e rádios de Perfil), que é a versão auditada e ainda não está em `master`.

Stack do front: Next.js 16 (App Router), React 19, TypeScript, CSS Modules com os tokens de `globals.css`. Nenhuma biblioteca de formulário nem schema (zod/yup). As regras de validação vêm das anotações Bean Validation dos requests da API (`LancamentoRequest`, `CadastroProdutoRequest`, `CadastroRequest`).

---

## 1. Tabela de correções

| Cláusula | Não conformidade original | Correção implementada | Arquivos alterados | Commit |
|---|---|---|---|---|
| 5.3.2 | "Novo lançamento" sem asterisco nos obrigatórios. Nenhum dos 3 formulários tinha legenda. Faltava `aria-required` | Asterisco em Tipo, Valor (R$), Data, Categoria, Forma de pagamento e Descrição. Legenda "* Campos obrigatórios" antes do primeiro campo nos 3 formulários. `required` + `aria-required="true"` em todos os obrigatórios. `role="radiogroup"` no Perfil | `components/FormLancamento.tsx`, `components/LegendaObrigatorios.tsx` (novo), `components/campoFormulario.module.css` (novo), `app/produtos/page.tsx`, `app/usuarios/page.tsx` | `550a4f8` |
| 5.3.1 | Estoque Mínimo e Quantidade em Estoque com a largura total do modal e sem limite de tamanho. Custo e Preço com larguras diferentes | Campos de comprimento fixo com o comprimento visível: Estoque Mínimo e Quantidade com `maxLength` 4 e largura de 4 dígitos, lado a lado. Custo (CMV) e Preço de Venda com `maxLength` 10 (`9999999,99`) e a mesma largura. Usa `max-width`, então em tela estreita o campo não passa da coluna | `app/produtos/page.tsx`, `app/produtos/produtos.module.css` | `d4b9c15`, `86e731b` |
| 6.4.2 / 7.3 | Erros só apareciam no envio, num alerta genérico no topo ("Todos os campos obrigatórios devem ser preenchidos."), um por vez. Os botões ficavam desabilitados sem explicar o motivo | Validação no blur, só em campo já visitado. Borda vermelha e mensagem curta abaixo do campo, que some ao corrigir. No envio, valida tudo e foca o primeiro inválido. `aria-invalid` + `aria-describedby`. Regras e hook reutilizáveis | `lib/validacao.ts` (novo), `hooks/useValidacaoFormulario.ts` (novo), `components/ErroCampo.tsx` (novo), `app/globals.css`, os 3 formulários | `80497d6` |
| 8.2 / 8.4 | Os modais de Produto e Usuário não recebiam o foco. O Tab percorria busca, filtros e tabela atrás do overlay antes de chegar ao Nome e saía do modal depois do último botão | Ao abrir, o foco vai para o Nome. Tab e Shift+Tab ficam presos ao modal, e ao fechar o foco volta ao botão que o abriu. Ao criar ou cancelar uma nova categoria, o foco volta ao select de Categoria. Nenhum `tabindex` positivo | `hooks/useFocoNoModal.ts` (novo), `app/produtos/page.tsx`, `app/usuarios/page.tsx` | `18bd33b` |
| 6.4.4 | Verificado: **já conforme** na versão auditada (ver nota) | Nenhuma alteração necessária (NC5 não se aplica). O gate do checkbox foi mantido quando o botão deixou de ser travado por campo vazio | — | — |

**Nota sobre a Etapa 1 (verificações):**

- **6.4.4.** Em `ee3fb89`, o botão "Criar Usuário" já tinha `disabled={mutating || … || !confirmouPermissoes}`, e `.primaryBtn:disabled` já aplicava `opacity: 0.6; cursor: not-allowed`. Agora o botão fica desabilitado **só** pelo checkbox (e durante o envio), e campo vazio passou a ser tratado pela validação.
- **8.2/8.4.** Nenhuma das 3 telas tinha `tabindex` positivo, `order`, `flex-direction: *-reverse` nem grid com posicionamento explícito. A ordem dos campos no DOM já era a visual. A quebra estava na gestão de foco dos modais (Produto e Usuário). O formulário de lançamento não é modal e não tinha quebra.

**Decisões tomadas com o responsável (divergências entre o pedido e o código):**

- **Descrição do lançamento.** O back exige o campo (`@NotBlank` em `LancamentoRequest`), então ele foi marcado como obrigatório em vez de continuar sem asterisco.
- **Botão "+ Nova".** Só existe no cadastro de Produto, e lá já vinha logo depois do select de Categoria. Nenhum botão novo foi criado no lançamento.
- **Botões de envio.** "Salvar Produto" e "Criar Usuário" não ficam mais desabilitados por campo vazio. Assim a submissão consegue mostrar todos os erros e focar o primeiro.

---

## 2. Trechos de código

### 5.3.2 — legenda e obrigatórios

```tsx
// components/LegendaObrigatorios.tsx
export default function LegendaObrigatorios() {
  return <p className={styles.legenda}>* Campos obrigatórios</p>;
}

// components/FormLancamento.tsx
<LegendaObrigatorios />
<label className={styles.label} htmlFor="lanc-valor">Valor (R$) *</label>
<input id="lanc-valor" … required aria-required="true" {...propsCampo("valor")} />
```

### 5.3.1 — largura dos campos

```css
/* app/produtos/produtos.module.css — largura = maxLength do campo */
.campoMonetario  { max-width: calc(10ch + 2.5rem); } /* maxLength 10: "9999999,99" */
.campoQuantidade { max-width: calc(4ch + 2.5rem); }  /* maxLength 4: "9999" */
```

```tsx
<div className={styles.row}>
  <div className={styles.formGroup}> {/* Estoque Mínimo */}
    <input id="c-estmin" className={`${styles.formInput} ${styles.campoQuantidade}`} type="text" inputMode="numeric" maxLength={4} … />
  </div>
  <div className={styles.formGroup}> {/* Quantidade em Estoque */}
    <input id="c-qtdinicial" className={`${styles.formInput} ${styles.campoQuantidade}`} type="text" inputMode="numeric" maxLength={4} … />
  </div>
</div>
```

### 6.4.2 / 7.3 — validação ao sair do campo

```ts
// hooks/useValidacaoFormulario.ts (essencial)
function mensagem(campo: C) {          // erro derivado do valor: some ao corrigir
  return visitados[campo] ? campos[campo].regra(valores[campo]) : null;
}
function propsCampo(campo: C) {
  const erro = mensagem(campo);
  return {
    onBlur: () => setVisitados((v) => (v[campo] ? v : { ...v, [campo]: true })),
    "aria-invalid": erro ? true : undefined,
    "aria-describedby": erro ? idErro(campos[campo].id) : undefined,
  };
}
function validarTudo() {               // envio: marca todos e foca o 1º inválido
  setVisitados(/* todos */);
  const primeiroInvalido = nomes.find((n) => campos[n].regra(valores[n]));
  if (primeiroInvalido) focoPendente.current = campos[primeiroInvalido].id;
  return !primeiroInvalido;
}
```

```ts
// app/produtos/page.tsx — regras declaradas na ordem da tela
const CAMPOS_CRIAR = {
  nome:  { id: "c-nome",  regra: obrigatorio("Informe o nome do produto.") },
  preco: { id: "c-preco", regra: regras(
    obrigatorio("Informe o preço de venda."),
    monetario({ negativo: "O preço não pode ser negativo.", zero: "O preço de venda deve ser maior que zero." }),
  ) },
  imagemUrl: { id: "c-imagem", regra: urlHttp("Digite um link válido, ex.: https://exemplo.com/foto.jpg") },
  // …
};
```

```css
/* app/globals.css */
:is(input, select, textarea)[aria-invalid="true"],
:is(input, select, textarea)[aria-invalid="true"]:focus { border-color: var(--color-error); }
```

Regras implementadas (`lib/validacao.ts`):

| Regra | Onde |
|---|---|
| Obrigatório vazio | Todos os obrigatórios das 3 telas |
| E-mail inválido | Usuário: E-mail ("Digite um e-mail válido, ex.: nome@empresa.com") |
| URL inválida, só se preenchida (`http://` ou `https://`, igual ao `@Pattern` do back) | Produto: Link da imagem |
| Valor monetário negativo | Produto: Custo (CMV) e Preço. Lançamento: Valor |
| Igual a zero | Lançamento: Valor. Produto: Preço de Venda |
| Não inteiro ou negativo | Produto: Estoque Mínimo e Quantidade em Estoque |
| Data inválida | Lançamento: Data |
| Senha com menos de 6 caracteres (`@Size(min = 6)` do back) | Usuário: Senha |

### 8.2 / 8.4 — foco nos modais

```ts
// hooks/useFocoNoModal.ts (essencial)
const anterior = document.activeElement as HTMLElement | null;
modal.querySelector<HTMLElement>("input:not([disabled]), select:not([disabled]), textarea:not([disabled])")?.focus();
// Tab no último → primeiro; Shift+Tab no primeiro → último
return () => { document.removeEventListener("keydown", onKeyDown); anterior?.focus(); };
```

```tsx
<div className={s.modal} ref={modalCriarRef} role="dialog" aria-modal="true" aria-labelledby="c-titulo">
```

---

## 3. Reavaliação

| # | Requisito | Antes | Depois | Evidência |
|---|---|---|---|---|
| 1 | 5.1.1 — título do formulário | Conforme | ✅ Conforme | "Novo lançamento" (`FormLancamento.tsx`), "Novo Usuário" (`usuarios/page.tsx`) mantidos |
| 2 | 5.3.6 — unidade no rótulo | Conforme | ✅ Conforme | "Valor (R$)", "Preço de Venda (R$)", "Custo (CMV) (R$)" |
| 3 | 5.3.2 — identificação de obrigatórios | Não conforme | ✅ Conforme | Asterisco + legenda nas 3 telas, `aria-required` |
| 4 | 5.3.1 — tamanho físico do campo | Não conforme | ✅ Conforme | `maxLength` 4/10 com largura correspondente (`campoQuantidade`, `campoMonetario`) |
| 5 | 6.1.3 — valores padrão | Conforme | ✅ Conforme | Estoque Mínimo `5` e Quantidade `0` (`abrirCriar`). Custo e Preço exibem `0,00` como *placeholder* (já era assim e foi mantido; um valor `0,00` real dispararia o erro de preço zero) |
| 6 | 5.3.7 — exemplos/placeholder | Conforme | ✅ Conforme | "Ex: Arroz 1kg", "https://exemplo.com/foto.jpg", "Ex.: venda do balcão" |
| 7 | 6.3.6 — botões de rádio | Conforme | ✅ Conforme | Funcionário/Administrador (`type="radio"`), agora com `role="radiogroup"` |
| 8 | 6.4.2 / 7.3 — feedback de erro | Não conforme | ✅ Conforme | Validação no blur e no envio, mensagem por campo |
| 9 | 6.4.4 — áreas indisponíveis | Conforme | ✅ Conforme | `disabled` + `opacity: 0.6` + `cursor: not-allowed` enquanto o checkbox está desmarcado |
| 10 | 8.2 / 8.4 — ordem de tabulação | Não conforme | ✅ Conforme | Foco inicial no Nome, foco preso ao modal, Shift+Tab simétrico |

**Índice de Aderência (AR = P / Y)**, com P = requisitos conformes e Y = requisitos aplicáveis avaliados:

- Antes: AR = 6 / 10 = **0,60 (60%)**
- Depois: AR = 10 / 10 = **1,00 (100%)**

> Se a auditoria original tiver contado 6.4.4 como não conforme, o "antes" fica 5/10 = 0,50. Na versão verificada (`ee3fb89`) esse item já estava conforme.

---

## 4. Estados de tela para os prints do "depois"

1. **Lançamento com asteriscos e legenda.** `/financeiro`, formulário "Novo lançamento" sem interação. Mostra "* Campos obrigatórios" abaixo do título e "Tipo *", "Valor (R$) *" etc.
2. **Campos de estoque estreitos.** `/produtos` → "+ Adicionar produto". Estoque Mínimo e Quantidade em Estoque lado a lado, estreitos, e Custo/Preço com a mesma largura. Opcional: repetir com a janela em ~375 px de largura.
3. **Campo com erro após o blur.** No modal "Novo Usuário", digitar `nome@` em E-mail e apertar Tab. Borda vermelha e "Digite um e-mail válido, ex.: nome@empresa.com".
4. **Submissão com vários erros.** No modal "Novo Produto", apagar Estoque Mínimo, deixar Nome e Preço vazios e clicar em "Salvar Produto". Todos os erros aparecem e o foco fica no Nome.
5. **"Criar Usuário" desabilitado e habilitado.** Dois prints do modal "Novo Usuário": com o checkbox desmarcado (botão esmaecido, cursor proibido) e marcado (botão normal).
6. **Foco percorrendo os campos.** Sequência de prints ou GIF com Tab no modal "Novo Usuário": Nome → E-mail → Senha → Perfil → checkbox → Cancelar → (Criar Usuário) → X → Nome.

---

## 5. Melhorias opcionais (fora das não conformidades)

| Melhoria | O que mudou | Arquivos | Commit |
|---|---|---|---|
| Vírgula decimal nos campos em R$ | Custo (CMV), Preço de Venda (novo produto) e Valor (lançamento) passam a `type="text" inputMode="decimal"` com máscara: vírgula decimal, até 2 casas, ponto do teclado numérico convertido em vírgula, "1.234,56" colado é aceito. `paraNumero` converte para `number`, e o back recebe o mesmo formato de antes. O sinal de menos não é aceito na digitação. A regra de negativo continua como salvaguarda | `lib/moeda.ts` (novo), `lib/validacao.ts`, `app/produtos/page.tsx`, `components/FormLancamento.tsx` | `db855e3` |
| Rótulo de unidade padronizado | "Custo (CMV) R$" → "Custo (CMV) (R$)" (cadastro e edição) | `app/produtos/page.tsx` | `b6e9f67` |

```ts
// lib/moeda.ts
export function mascararMoeda(texto: string): string {
  const normalizado = texto.includes(",") ? texto.replace(/\./g, "") : texto.replace(/\./g, ",");
  const [inteiro, ...resto] = normalizado.replace(/[^\d,]/g, "").split(",");
  if (resto.length === 0) return inteiro;
  return `${inteiro},${resto.join("").slice(0, 2)}`;
}
```

---

## 6. Validação executada

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ sem erros |
| `npm run lint` (`eslint src`) | ✅ sem erros/avisos |
| `npm run build` | ✅ build de produção ok (27 rotas) |
| Testes automatizados | ⚠️ O front não tem infraestrutura de testes (nem jest, vitest ou testing-library), então nenhum teste foi adicionado. A máscara e as regras de `lib/validacao.ts` foram conferidas com um script Node avulso, fora do repositório |
| Teste no navegador | ⚠️ Não executado nesta sessão: as telas exigem a API e o Postgres rodando com usuário ADMIN. Use o roteiro abaixo |

### Roteiro de teste manual

Pré-requisito: API e front rodando, login como ADMIN.

**NC1 — 5.3.2 (obrigatórios)**
1. Abra `/financeiro`. Confira "* Campos obrigatórios" abaixo de "Novo lançamento" e o asterisco em Tipo, Valor (R$), Data, Categoria, Forma de pagamento e Descrição.
2. Abra `/produtos` → "+ Adicionar produto". Confira a mesma legenda, no mesmo lugar (antes do primeiro campo) e no mesmo estilo.
3. Abra `/usuarios` → "+ Novo Usuário". Faça a mesma conferência.
4. (Opcional) No DevTools, confira `aria-required="true"` nos campos com asterisco.

**NC2 — 5.3.1 (largura)**
1. No modal "Novo Produto", confira Estoque Mínimo e Quantidade em Estoque lado a lado, estreitos. Digite `12345`: só entram 4 dígitos, e `9999` ocupa o campo inteiro.
2. Confira que Custo (CMV) (R$) e Preço de Venda (R$) têm a mesma largura e que `9999999,99` (limite de 10 caracteres) cabe inteiro.
3. Reduza a janela para ~375 px. Os campos empilham, nenhum ultrapassa o modal e não surge rolagem horizontal.

**NC3 — 6.4.2/7.3 (erros)**
1. Abra "Novo Produto". Nenhum erro aparece na abertura.
2. Com o foco no Nome vazio, aperte Tab: aparece "Informe o nome do produto." com borda vermelha. Volte, digite algo, e o erro some na hora.
3. Link da imagem: digite `exemplo.com` e aperte Tab. Aparece "Digite um link válido, ex.: https://exemplo.com/foto.jpg". Apague o texto e o erro some (campo opcional).
4. Estoque Mínimo `1.5` + Tab dá "Use um número inteiro igual ou maior que zero.". Com `-2`, mesma mensagem.
5. Preço `0` + Tab dá "O preço de venda deve ser maior que zero.".
6. Esvazie Nome, Preço e Estoque Mínimo e clique em "Salvar Produto". Os três erros aparecem juntos e o foco vai para o Nome.
7. Em `/financeiro`, clique em "Salvar" com tudo vazio. Aparecem erros em Valor, Categoria e Descrição, e o foco vai para o Valor.
8. Valor `0` + Tab dá "O valor deve ser maior que zero.". Na Data, apague o dia e aperte Tab: "Informe uma data válida.".
9. Em "Novo Usuário", E-mail `nome@` + Tab dá "Digite um e-mail válido, ex.: nome@empresa.com". Senha `123` + Tab dá "A senha deve ter no mínimo 6 caracteres.".
10. Com leitor de tela (NVDA): ao focar um campo com erro, a mensagem é lida junto com o rótulo.

**NC4 — 8.2/8.4 (tabulação)**
1. `/usuarios` → "+ Novo Usuário". O cursor já está no **Nome**.
2. Aperte Tab e confira a sequência: **Nome → E-mail → Senha → Perfil (rádio marcado; setas trocam a opção) → checkbox "Confirmo…" → Cancelar → Criar Usuário (só se o checkbox estiver marcado) → X (fechar) → Nome**. O foco não sai do modal.
3. Shift+Tab a partir do Nome percorre exatamente a ordem inversa.
4. Feche com "Cancelar". O foco volta para "+ Novo Usuário".
5. `/produtos` → "+ Adicionar produto". O cursor está no **Nome**. Sequência com Tab: **Nome → Categoria → + Nova → Custo (CMV) (R$) → [Aplicar → Ver composição do preço, quando houver custo] → Preço de Venda (R$) → Estoque Mínimo → Quantidade em Estoque → Descrição → Link da imagem → Cancelar → Salvar Produto → X → Nome**.
6. Clique em "+ Nova" e depois em "Cancelar". O foco volta para o select de Categoria, e o Tab seguinte vai para "+ Nova".
7. `/financeiro` (sem modal, ordem do DOM, depois do menu lateral): **Gerenciar categorias → período do saldo → Tipo → Valor (R$) → Data → Categoria → Forma de pagamento → Descrição → Salvar → filtros (Tipo, Categoria, De, Até, Limpar filtros) → paginação**. Shift+Tab faz o caminho inverso.

**6.4.4 — áreas indisponíveis**
1. No modal "Novo Usuário" com o checkbox desmarcado, "Criar Usuário" fica esmaecido, com cursor proibido, e não responde ao clique nem ao Enter num campo.
2. Marque o checkbox: o botão fica habilitado. Desmarque: ele volta a ficar desabilitado.

**Etapa 3 — sem regressão**
1. Os títulos "Novo lançamento" e "Novo Usuário" aparecem.
2. Os rótulos com (R$) aparecem.
3. Em "Novo Produto", Estoque Mínimo vem com `5`, Quantidade com `0`, e Custo/Preço mostram `0,00` como exemplo.
4. Os placeholders "Ex: Arroz 1kg", "https://exemplo.com/foto.jpg" e "Ex.: venda do balcão" (lançamento do tipo Receita) aparecem.
5. Os rádios Funcionário/Administrador funcionam, e o usuário é criado com o perfil escolhido.
6. Crie um produto com preço `12,50` e confira na listagem: R$ 12,50.
7. Registre um lançamento de `1.234,56` e confira na lista: R$ 1.234,56.

---

## 7. Observações fora do escopo

- **Modais de edição.** "Editar Produto" e "Editar Usuário" não foram alterados, salvo o rótulo do custo. Eles têm os mesmos campos e podem receber a mesma validação e gestão de foco, se desejado.
- **Preço de Venda zero.** Agora é barrado no front, mas o back aceita (`@DecimalMin("0.00")`). A regra no front segue o pedido da auditoria. Para valer também na API, troque para `@Positive` em `CadastroProdutoRequest`.
- **Checkbox do "Novo Usuário".** O checkbox de `ee3fb89` fica entre o corpo e o rodapé do modal, sem o padding lateral do `modalBody`, por isso o texto encosta na borda. É um ajuste visual, não uma não conformidade, e não foi alterado.
- **Erro ao carregar categorias no lançamento.** Nesse caso o rótulo "Categoria" aponta para um `id` que não existe, porque o select dá lugar ao alerta.
