# Supabase: o passo exato

Leia no bloco 7, quando a página já está no ar e bonita e falta o dado entrar. Leia também quando alguém disser "o formulário diz obrigado mas não tem nada no banco".

## A regra, antes de qualquer coisa

**Na camada de dado o modelo não improvisa. O bloco testado é colado.**

Não é preferência. O Supabase mudou duas vezes em 2026, e todo tutorial da internet, mais a memória
decorada de qualquer LLM, está em 2024. Pedir "cria a tabela pra mim" sem colar o bloco abaixo produz
o SQL de 2024, e o formulário falha com 401.

1. **Desde nov/2025**, projeto novo não tem mais a chave `anon`. Tem `sb_publishable_...`.
2. **Desde 30/05/2026**, tabela nova no schema `public` **não recebe mais privilégio automático** pro
   role `anon`.

A segunda pega gente cuidadosa, porque exige entender que **RLS e GRANT são dois cadeados diferentes**:

| Cadeado | O que ele decide | Quem escreve |
|---|---|---|
| **GRANT** | se o role `anon` pode encostar na tabela | `grant insert on table ... to anon` |
| **RLS + policy** | se aquela linha específica pode entrar | `create policy ... for insert` |

O Postgres confere o GRANT **primeiro** e nega antes de olhar a policy. Ou seja: dá pra ter RLS certa, policy certa, e o insert falhar mesmo assim. Os dois cadeados na medida: `insert` liberado, `select` fechado.

## Passo 1: o projeto

Pré-work, não é aula. Projeto **provisionado antes de segunda**, região **São Paulo**, porque
provisionar demora e demorar ao vivo é caro. Se o painel disser que bateu o limite de projetos, a saída
é **criar uma organização nova** e o projeto dentro dela. [CONFIRMAR no ensaio de 13/08: o limite no
free parece ser por organização e não por conta; e projeto free pausa por inatividade, e pausado ele
para de capturar sem avisar ninguém.]

## Passo 2: o SQL, colado inteiro

**SQL Editor** na barra lateral, **New query**, cola o bloco inteiro, **Run** (ou `Ctrl+Enter`). Cola
**tudo de uma vez**: não roda pedaço por pedaço, não deixa o Claude "adaptar", não traduz coluna pra
português. O `fetch` do template procura exatamente estes nomes.

```sql
create table public.leads (
  -- `identity` e NÃO `serial`: com identity o `grant insert` na tabela já cobre
  -- a geração do id. Com `serial` faltaria `grant usage` na sequence, e o erro
  -- seria "permission denied", igual ao do grant faltando.
  id            bigint generated always as identity primary key,
  -- quem carimba a hora é o banco. O relógio do visitante pode estar em 1970.
  created_at    timestamptz not null default now(),
  -- CHECK de tamanho em TODA coluna de texto: é o teto de dano do endereço de
  -- escrita que fica público no HTML. Sem isso, alguém despeja 2 MB por linha.
  name          text    not null check (char_length(name)  between 1 and 120),
  email         text    not null check (char_length(email) between 3 and 180),
  phone         text    not null check (char_length(phone) between 10 and 24),
  -- backstop que NUNCA deve disparar: quem barra o usuário é o `required` do
  -- HTML, antes de qualquer requisição. Sem `default false` de propósito:
  -- default mais check se contradizem e devolvem 400 com nome de constraint.
  consent_lgpd  boolean not null check (consent_lgpd is true),
  -- consentimento é a um texto específico, então ele vai congelado na linha: se
  -- a redação mudar dia 19, as linhas antigas precisam saber com o que a pessoa
  -- concordou. 2000 porque essa frase pode crescer numa rodada de visual.
  consent_text  text    not null check (char_length(consent_text) between 1 and 2000),
  source_url    text             check (char_length(source_url) <= 300)
);

-- cadeado 1: liga a RLS. Sem policy, nada passa.
alter table public.leads enable row level security;

-- cadeado 2: o role público perde tudo e ganha só o insert. Em projeto novo o
-- revoke não tira nada e está certo assim; em projeto antigo ele fecha o SELECT
-- que vinha aberto de fábrica.
revoke all on table public.leads from anon, authenticated;
grant insert on table public.leads to anon;

-- pode inserir, e só: sem policy de select, ninguém lê pela API pública.
create policy "anon insere e so"
  on public.leads for insert to anon
  with check (true);

-- avisa o PostgREST do schema novo, senão o 1º envio leva 400 `PGRST204` por ~30s.
notify pgrst, 'reload schema';
```

**Quando dá certo aparece `Success. No rows returned`, e isso É o resultado bom.** "No rows" assusta e
não devia: `create table` não devolve linha mesmo. Vermelho com `ERROR` aí sim é erro, e a frase de
conserto é *cola esta mensagem inteira no chat e me diz qual linha do bloco falhou*. Aviso amarelo no
`revoke` de projeto novo é `NOTICE`, revogar o que não existe não quebra nada.

## Passo 3: a URL, a chave, e por que ela ser pública está certo

Painel do projeto, engrenagem de **Project Settings**, aba **API**. [CONFIRMAR: em 2026 o painel pode ter renomeado essa aba pra "API Keys".]

| O que você copia | Como é | Vai pro HTML? |
|---|---|---|
| **Project URL** | `https://xxxxxxxxxxxx.supabase.co` | sim |
| **Publishable key** | começa com `sb_publishable_` | **sim, e está certo** |
| Secret key / `service_role` | começa com `sb_secret_`, ou vem rotulada `service_role` | **NUNCA, em lugar nenhum** |

**Confere pelo prefixo, não pelo rótulo.** Colar a `service_role` no HTML **não gera erro nenhum**: a
página funciona idêntica e o banco fica aberto pro mundo ler **e apagar** sua lista de inscritos, sem
sintoma. É vazamento de nome, e-mail e telefone de pessoa física com anúncio rodando, e se a errada já
foi publicada, **rotaciona em Project Settings antes de republicar**.

A publicável fica visível no código-fonte e é assim que tem que ser: ela não segura o banco, quem
segura é a RLS mais o grant. Com ela na mão, um estranho consegue uma coisa só, inserir uma linha em
`leads`. E o aviso que anda junto, porque circula muito conselho errado: **variável de ambiente não
esconde nada em página estática.** Env var protege segredo de servidor; no navegador o valor é embutido
no arquivo e continua público. Não existe "esconder a chave", existe **usar a chave certa**.

## Passo 4: o `fetch` literal

Já vem pronto no `index.html`, no bloco INTOCÁVEL (você só preenche `SUPABASE_URL` e `SUPABASE_KEY` no topo). Está aqui pra você conferir que não foi reescrito numa rodada de visual:

```js
const url = CONFIG.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/' + CONFIG.SUPABASE_TABLE;
const r = await fetch(url, {
  method: 'POST',
  headers: {
    'apikey':        CONFIG.SUPABASE_KEY,
    'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY,   // MESMO valor do apikey
    'Content-Type':  'application/json',
    'Prefer':        'return=minimal',
  },
  body: JSON.stringify(payload),
});
if (!r.ok) {                                  // fetch NÃO estoura erro em 401
  const corpo = (await r.text()).slice(0, 400);
  throw new Error('HTTP ' + r.status + ' · ' + corpo);
}
```

| Header | Por que ele existe |
|---|---|
| `apikey` | é como o Supabase sabe de qual projeto você está falando |
| `Authorization: Bearer <a mesma chave>` | a doc manda os dois. Os dois com valor **idêntico** funciona, só o `apikey` funciona, **dois valores diferentes dá 401 "Invalid JWT"**. A armadilha é colar snippet de tutorial e trocar a chave em só um dos dois |
| `Content-Type: application/json` | sem ele o Supabase devolve **415** e o formulário parece normal |
| `Prefer: return=minimal` | sem ele o Supabase faz um SELECT de volta, leva negativa da policy insert-only e **reverte a inserção inteira**. O dado some depois de ter entrado |

E o `if (!r.ok)`: `fetch` resolve normal em 401, 400 e 415, então `try/catch` sozinho pega falha de rede e **não** pega status HTTP. Sem ele a página diz "inscrição confirmada" com a internet desligada.

## Passo 5: o `curl` de pré-flight

Peça pro Claude rodar os dois, ele lê o status sozinho. **A escrita, que tem que passar:**

```bash
curl -i -X POST 'https://SEUPROJETO.supabase.co/rest/v1/leads' \
  -H "apikey: sb_publishable_SUACHAVE" \
  -H "Authorization: Bearer sb_publishable_SUACHAVE" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"name":"Teste Preflight","email":"teste@exemplo.com.br","phone":"5511999999999","consent_lgpd":true,"consent_text":"linha de teste do pre-flight","source_url":"https://exemplo.com.br"}'
```

Esperado: **`201` sem corpo**. `401` é o passo 2 (grant ou policy); `400` falando de coluna é nome divergente ou o cache de schema. **Agora a leitura, que tem que FALHAR, e é o teste que prova a LGPD:**

```bash
curl -i 'https://SEUPROJETO.supabase.co/rest/v1/leads?select=*' \
  -H "apikey: sb_publishable_SUACHAVE" \
  -H "Authorization: Bearer sb_publishable_SUACHAVE"
```

Com a chave pública da sua página, ler a tabela precisa dar negado. Três resultados, e quem decide é **o corpo**, não só o número:

| O que voltou | O que significa | O que fazer |
|---|---|---|
| **`401` e o corpo traz `42501`** (`permission denied for table leads`) | os dois cadeados fechados. **É o resultado certo** | nada, segue |
| **`200` e o corpo é `[]`** | a RLS segurou as linhas, mas o **grant de SELECT ficou aberto** (projeto antigo com privilégio de fábrica) | roda de novo as duas linhas de `revoke all` e `grant insert` do passo 2 e refaz este `curl` |
| **`200` e vêm os leads na tela** | **está vazando. Para tudo.** A lista de inscritos está pública | não publica e não divulga a URL. Roda o `alter table ... enable row level security` e o `revoke all` do passo 2, e refaz este `curl` até dar 401 |

[CONFIRMAR: o item 8 do ensaio de 13/08 (conta nova de Supabase) fecha se o negado vem mesmo como `401`. O `42501` no corpo é o discriminador confiável de qualquer jeito.]

**A linha que o `curl` de escrita inseriu fica no banco**, e apagar só dá pelo **Table Editor**, porque o `anon` não tem `delete`. Antes de contar inscrito pro desafio, apaga as linhas de teste por lá.

## Quando quebra

| Sintoma na tela | Causa | Verificação / frase de conserto |
|---|---|---|
| Formulário diz obrigado, banco vazio | RLS ligada sem policy, ou falta o `grant insert`. O 42501 foi engolido | **Table Editor, sempre.** A mensagem de obrigado não prova nada. Rodar o `curl` de escrita |
| `401` com `Invalid JWT` | `apikey` e `Authorization` com valores **diferentes** | os dois headers com a **mesma** chave, caractere por caractere |
| Parece erro e o dado **estava** lá | trocaram pra `Prefer: return=representation`, o que costuma acontecer quando se pede "me devolve o id do lead" | *volta o header pra `Prefer: return=minimal`, a policy insert-only não pode fazer SELECT de volta* |
| `400` com `PGRST204` nomeando uma coluna | nome divergente (copy em português, tabela em inglês) | conferir os `name=` do form contra o SQL. Não renomeia coluna: renomear quebra o `fetch` |
| `400` insistindo que a coluna nova não existe | cache de schema do PostgREST, ~30 s | esperar, ou rodar `notify pgrst, 'reload schema';` no SQL Editor |
| `415` e o form parece normal | falta `Content-Type: application/json`, ou o corpo não passou por `JSON.stringify` | conferir os quatro headers do passo 4 |
| `400` com nome de constraint aparecendo pro inscrito | a caixinha de consentimento não está `required` no HTML | o CHECK é backstop, quem barra é o `required`, antes de qualquer requisição |
| Página recarrega, form limpa, banco vazio | falta `e.preventDefault()` no submit | a URL ganha um `?` no fim e o DevTools mostra a requisição como `(canceled)` |
| Data em 1970 na linha | mandou `created_at` no corpo do `fetch` | tirar do payload. Quem carimba a hora é o `default now()` |

## O que fica pro pós-desafio, de propósito

- **Sem `UNIQUE` no e-mail nesta aula:** quem testa duas vezes com o próprio e-mail leva `409`, e ao
  vivo isso parece "quebrou". Dedup na leitura, e o teto de dano já são os `CHECK` de tamanho.
- **Não existe rate limit publicado pro Data API no free** (a doc de rate limit é só de Auth): trate
  como se não houvesse freio. Honeypot e `CHECK` são a mitigação. **CAPTCHA nativo é só de Auth.**
- **MCP do Supabase** fica fora: OAuth mais token pessoal, dez vezes ao vivo, e daria liberdade ao
  modelo justamente onde liberdade custa 401. Vira upgrade depois do desafio.

**Ressalva que não é técnica:** consentimento, política de privacidade e incidente não se decidem aqui.
A LGPD trata consentimento no art. 8º, informação ao titular no art. 9º, segurança no art. 46 e incidente
no art. 48, e vale conferir na fonte oficial. Isto é ponto de partida: valide com um advogado ou com o
Encarregado de Dados do seu negócio.
