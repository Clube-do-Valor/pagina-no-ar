# Supabase: o passo exato

Leia este arquivo no bloco 7 da aula, quando a página já está no ar e bonita e falta o dado entrar.
Também leia quando alguém disser "o formulário diz obrigado mas não tem nada no banco".

## A regra que vale antes de qualquer coisa

**Na camada de dado o modelo não improvisa. O bloco testado é colado.**

Não é preferência. O Supabase mudou duas vezes em 2026, e todo tutorial da internet, mais a memória
decorada de qualquer LLM, está na versão de 2024. Se você pedir "cria a tabela do Supabase pra mim"
sem colar o bloco abaixo, sai o SQL de 2024 e o formulário falha com 401.

As duas mudanças:

1. **Desde nov/2025**, projeto novo não tem mais a chave `anon`. Tem `sb_publishable_...`.
2. **Desde 30/05/2026**, tabela nova no schema `public` **não recebe mais privilégio automático** pro
   role `anon`.

A segunda é a que pega gente cuidadosa, porque exige entender que **RLS e GRANT são dois cadeados
diferentes**:

| Cadeado | O que ele decide | Quem escreve |
|---|---|---|
| **GRANT** | se o role `anon` pode encostar na tabela | `grant insert on table ... to anon` |
| **RLS + policy** | se aquela linha específica pode entrar | `create policy ... for insert` |

O Postgres confere o GRANT **primeiro**. Sem grant, ele nega antes de olhar a policy. Então você pode
ter a RLS certa, a policy certa, e o insert falhar mesmo assim. Os dois cadeados têm que estar abertos
na medida certa: `insert` liberado, `select` fechado.

## Passo 1: o projeto

Isso é pré-work, não é aula. O projeto tem que estar **provisionado antes de segunda**, região
**São Paulo**, porque provisionar demora e demorar ao vivo é caro.

Se o painel disser que você bateu o limite de projetos, a saída é **criar uma organização nova** e o
projeto dentro dela. [CONFIRMAR: o limite de projetos ativos no plano free parece ser por organização,
não por conta. Confirmar no ensaio de 13/08.]

[CONFIRMAR: projeto free pausa por inatividade depois de alguns dias sem uso. Confirmar quantos dias no
ensaio, porque projeto pausado é página que para de capturar sem avisar ninguém.]

## Passo 2: o SQL, colado inteiro

No painel do projeto: **SQL Editor** na barra lateral, botão **New query**, cola o bloco inteiro,
**Run** (ou `Ctrl+Enter`).

Cola **tudo de uma vez**. Não roda pedaço por pedaço, não deixa o Claude "adaptar", não troca nome de
coluna pra português. O `fetch` do template procura exatamente estes nomes.

```sql
-- ============================================================
-- Tabela de inscritos da LP. Cola inteiro, roda uma vez.
-- ============================================================

create table public.leads (
  -- `generated always as identity` e NÃO `serial`, de propósito: com identity,
  -- o `grant insert` na tabela já cobre a geração do id. Com `serial` faltaria
  -- um `grant usage` na sequence, e o erro que aparece é "permission denied",
  -- igualzinho ao do grant faltando. Uma hora de debug pelo mesmo sintoma.
  id            bigint generated always as identity primary key,

  -- quem carimba a hora é o banco. O navegador do visitante pode estar em 1970.
  created_at    timestamptz not null default now(),

  -- CHECK de tamanho em toda coluna de texto: é o teto de dano do endereço de
  -- escrita que fica público no HTML. Sem isso, alguém despeja 2 MB por linha.
  name          text    not null check (char_length(name)  between 1 and 120),
  email         text    not null check (char_length(email) between 3 and 180),
  phone         text    not null check (char_length(phone) between 10 and 24),

  -- backstop que NUNCA deve disparar. Quem barra o usuário é a caixinha
  -- `required` do HTML, com mensagem em português e antes de qualquer
  -- requisição. Se este CHECK disparar em produção, é bug, não é UX.
  -- (sem `default false` de propósito: default + check se contradizem e
  --  devolvem 400 com nome de constraint na cara do inscrito)
  consent_lgpd  boolean not null check (consent_lgpd is true),

  -- o texto do consentimento vai congelado dentro da linha: consentimento é a
  -- um texto específico. Se a redação da página mudar dia 19, as linhas antigas
  -- precisam continuar sabendo com o que a pessoa concordou.
  consent_text  text    not null check (char_length(consent_text) between 1 and 2000),

  source_url    text             check (char_length(source_url) <= 300)
);

-- cadeado 1: liga a RLS. Sem policy, nada passa.
alter table public.leads enable row level security;

-- cadeado 2: o role público perde tudo e ganha só o insert.
-- Em projeto novo o revoke não tira nada (não havia nada), e está certo assim.
-- Em projeto antigo ele é o que fecha o SELECT que vinha aberto de fábrica.
revoke all on table public.leads from anon, authenticated;
grant insert on table public.leads to anon;

-- a policy: pode inserir, e só. Não existe policy de select, então ninguém lê
-- pela API pública, nem com a chave que está no HTML.
create policy "anon insere e so"
  on public.leads
  for insert
  to anon
  with check (true);

-- avisa o PostgREST que o schema mudou. Sem isso, o primeiro envio pode levar
-- 400 com `PGRST204` dizendo que a coluna não existe, por uns 30 segundos.
notify pgrst, 'reload schema';
```

**O que aparece na tela quando dá certo:** `Success. No rows returned`. Isso **é** o resultado bom.
"No rows" assusta e não devia: `create table` não devolve linha nenhuma mesmo. Se aparecer texto em
vermelho com a palavra `ERROR`, aí sim é erro, e a frase de conserto é: *cola esta mensagem inteira no
chat e me diz qual linha do bloco falhou*.

Se o `revoke` imprimir um aviso amarelo em projeto novo, ignora. Revogar o que não existe é um
`NOTICE`, não é falha.

## Passo 3: onde ficam a URL e a chave

Painel do projeto, engrenagem de **Project Settings**, aba **API**.
[CONFIRMAR: em 2026 o painel pode ter renomeado essa aba pra "API Keys". Confirmar no ensaio.]

| O que você copia | Como é | Vai pro HTML? |
|---|---|---|
| **Project URL** | `https://xxxxxxxxxxxx.supabase.co` | sim |
| **Publishable key** | começa com `sb_publishable_` | **sim, e está certo** |
| Secret key / `service_role` | começa com `sb_secret_`, ou vem rotulada `service_role` | **NUNCA. Em lugar nenhum.** |

**Confere pelo prefixo, não pelo rótulo.** A chave que vai no arquivo começa com `sb_publishable_`.
Qualquer coisa que comece com `sb_secret_` fica fora, sem exceção e sem "só pra testar".

Colar a `service_role` no HTML **não gera erro nenhum**. A página funciona idêntica, e o banco fica
aberto pro mundo ler **e apagar** a sua lista de inscritos. Não há sintoma. Nada avisa. É vazamento de
nome, e-mail e telefone de pessoa física, ou seja incidente de LGPD com anúncio rodando. Se a errada
já foi publicada: **rotaciona em Project Settings antes de republicar**, não adianta só trocar o
arquivo.

## Passo 4: por que a chave publicável ser pública está certo

Essa é a parte que assusta e não devia, e é onde muita gente "conserta" pro lado errado.

A chave publicável fica visível no código-fonte da página, e isso é o **desenho**, não um descuido.
Ela não é o que segura o banco. Quem segura é a RLS mais o grant. Com aquela chave na mão, um
estranho consegue exatamente uma coisa: inserir uma linha na tabela `leads`. Não lê, não apaga, não
enxerga outra tabela.

E o aviso que anda junto, porque circula muito conselho errado sobre isso: **variável de ambiente não
esconde nada em página estática.** Env var protege segredo de servidor. Numa página que roda no
navegador, o valor é embutido no arquivo e continua público pra quem abre o código-fonte. Então não
existe "esconder a chave"; existe **usar a chave certa**.

## Passo 5: o `fetch` literal

Já vem pronto no `index.html`, dentro do bloco marcado INTOCÁVEL. Você só preenche `SUPABASE_URL` e
`SUPABASE_KEY` no topo do arquivo. Está aqui pra você conferir que não foi reescrito numa rodada de
visual:

```js
const r = await fetch(
  CONFIG.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/' + CONFIG.SUPABASE_TABLE,
  {
    method: 'POST',
    headers: {
      'apikey':        CONFIG.SUPABASE_KEY,
      'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY,   // MESMO valor do apikey
      'Content-Type':  'application/json',
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify(payload),
  }
);
if (!r.ok) {                                  // fetch NÃO estoura erro em 401
  const corpo = (await r.text()).slice(0, 400);
  throw new Error('HTTP ' + r.status + ' · ' + corpo);
}
```

Os quatro headers, e o que cada um resolve:

| Header | Por que ele existe |
|---|---|
| `apikey` | é como o Supabase sabe de qual projeto você está falando |
| `Authorization: Bearer <a mesma chave>` | a doc manda os dois. Os dois com valor **idêntico** funciona, só o `apikey` funciona, **dois valores diferentes dá 401 "Invalid JWT"**. A armadilha é colar snippet de tutorial e trocar a chave em só um dos dois |
| `Content-Type: application/json` | sem ele o Supabase devolve **415** e o formulário parece normal |
| `Prefer: return=minimal` | sem ele o Supabase faz um SELECT de volta, leva negativa da policy insert-only e **reverte a inserção inteira**. O dado some depois de ter entrado |

E o `if (!r.ok)`: `fetch` resolve normalmente em 401, 400 e 415. Um `try/catch` sozinho pega falha de
rede e **não** pega status HTTP. Sem essa checagem a página diz "inscrição confirmada" até com a
internet desligada.

## Passo 6: o `curl` de pré-flight

Peça pro Claude rodar os dois. Ele lê o status sozinho.

**A escrita, que tem que passar:**

```bash
curl -i -X POST 'https://SEUPROJETO.supabase.co/rest/v1/leads' \
  -H "apikey: sb_publishable_SUACHAVE" \
  -H "Authorization: Bearer sb_publishable_SUACHAVE" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"name":"Teste Preflight","email":"teste@exemplo.com.br","phone":"5511999999999","consent_lgpd":true,"consent_text":"linha de teste do pre-flight","source_url":"https://exemplo.com.br"}'
```

Esperado: **`201` sem corpo**. Se vier `401`, o problema é o passo 2 (grant ou policy). Se vier `400`
falando de coluna, é nome de coluna divergente ou o cache de schema de 30 segundos.

**A leitura, que tem que falhar. Este é o teste que prova a LGPD na tela:**

```bash
curl -i 'https://SEUPROJETO.supabase.co/rest/v1/leads?select=*' \
  -H "apikey: sb_publishable_SUACHAVE" \
  -H "Authorization: Bearer sb_publishable_SUACHAVE"
```

Com a chave que está pública na sua página, ler a tabela precisa dar negado. Três resultados possíveis,
e o que decide é **o corpo da resposta**, não só o número:

| O que voltou | O que significa | O que fazer |
|---|---|---|
| **`401` e o corpo traz `42501`** (`permission denied for table leads`) | os dois cadeados fechados. **É o resultado certo.** | nada, segue pro passo seguinte |
| **`200` e o corpo é `[]`** (lista vazia) | a RLS segurou as linhas, mas o **grant de SELECT ficou aberto**. Projeto antigo com privilégio de fábrica | roda de novo só as duas linhas de `revoke all` e `grant insert` do passo 2, e refaz este `curl` |
| **`200` e vêm os leads na tela** | **está vazando. Para tudo.** A lista de inscritos está pública | não publica, não divulga a URL. Roda o `alter table ... enable row level security` e o `revoke all` do passo 2 e refaz este `curl` até dar 401 |

[CONFIRMAR: o plano trata o negado como `401`. Dependendo da versão do PostgREST o mesmo `42501` pode
vir com outro status. O item 8 do ensaio de 13/08 (conta nova de Supabase) fecha isso. O `42501` no
corpo é o discriminador confiável em qualquer caso.]

**A linha de teste que o `curl` inseriu fica no banco.** Apagar só dá pelo **Table Editor** do painel,
porque o `anon` não tem `delete`, e isso é o dois-cadeados funcionando a seu favor uma segunda vez.
Antes de contar inscrito pro desafio, entra no Table Editor e apaga as linhas de teste.

## Quando quebra

| Sintoma na tela | Causa | Como verificar / frase de conserto |
|---|---|---|
| Formulário diz obrigado, banco vazio | RLS ligada sem policy, ou falta o `grant insert`. O 42501 foi engolido | **Table Editor, sempre.** A mensagem de obrigado não prova nada. Rodar o `curl` de escrita |
| `401` com `Invalid JWT` | `apikey` e `Authorization` com valores **diferentes** | os dois headers têm que ter a **mesma** chave, caractere por caractere |
| Parece erro e o dado **estava** lá | alguém trocou pra `Prefer: return=representation` (costuma acontecer quando se pede "me devolve o id do lead") | *volta o header pra `Prefer: return=minimal`, o insert-only não pode fazer SELECT de volta* |
| `400` com `PGRST204` nomeando uma coluna | nome de coluna divergente (copy em português, tabela em inglês) | conferir os `name=` do form contra o SQL. Não renomear coluna: renomear quebra o `fetch` |
| `400` insistindo que a coluna nova não existe | cache de schema do PostgREST, ~30 s | esperar 30 s, ou rodar `notify pgrst, 'reload schema';` no SQL Editor |
| `415` e o form parece normal | falta `Content-Type: application/json`, ou o corpo não passou por `JSON.stringify` | conferir os quatro headers do passo 5 |
| `400` com nome de constraint aparecendo pro inscrito | a caixinha de consentimento não está `required` no HTML | o CHECK é backstop. Quem barra é o `required`, antes de qualquer requisição |
| Página recarrega, form limpa, banco vazio | falta `e.preventDefault()` no submit | a URL ganha um `?` no fim e o DevTools mostra a requisição como `(canceled)` |
| Data em 1970 na linha | mandou `created_at` no corpo do `fetch` | tirar do payload. Quem carimba a hora é o `default now()` |

## O que fica pro pós-desafio, de propósito

- **Sem `UNIQUE` no e-mail nesta aula.** Quem testa duas vezes com o próprio e-mail leva `409`, que
  ao vivo parece "quebrou". Dedup se faz na leitura. O teto de dano de verdade já são os `CHECK` de
  tamanho.
- **Não existe rate limit publicado pro Data API no plano free** (a doc de rate limit é só de Auth).
  Trate como se não houvesse freio: o honeypot do template e os `CHECK` são a mitigação disponível.
- **CAPTCHA nativo do Supabase é só de Auth**, não vale pro formulário.
- **MCP do Supabase** resolveria o schema sozinho e fica fora da aula: é OAuth mais token pessoal,
  dez vezes, ao vivo, e liberdade justamente no ponto onde liberdade custa 401. Entra como upgrade
  depois do desafio.

**Ressalva que não é técnica:** o texto de consentimento, a política de privacidade e o tratamento de
um eventual incidente não se decidem aqui. A LGPD trata consentimento no art. 8º, informação ao titular
no art. 9º, segurança no art. 46 e comunicação de incidente no art. 48, e vale conferir na fonte
oficial. O que este material entrega é ponto de partida: valide a redação com um advogado ou com o
Encarregado de Dados do seu negócio antes de escalar tráfego.
