# Quando quebra

Leia este arquivo no momento em que alguma coisa não funcionou: o formulário não gravou, a página
publicada está estranha, ou o Claude precisa de um diagnóstico pra consertar. Não precisa ler antes.

## Primeiro: não saiu de primeira, e está tudo certo

**O envio não sai na primeira tentativa.** Nos vídeos que serviram de pesquisa pra esta aula, isso
aconteceu em **100% das ocorrências filmadas**: a pessoa preenche o formulário, vai olhar o destino,
não chegou nada. Na segunda tentativa chega. É por isso que o bloco do dado anuncia a falha antes de
ela acontecer.

Ou seja: isso é etapa, não é vergonha, e não é sinal de que você fez alguma coisa errada. Quem trava
aqui trava por achar que é o único, e não é. Todo mundo passa por isso.

## O gesto único: a página já te entrega o diagnóstico

O template não engole erro. Quando o envio falha, aparece na tela uma caixa vermelha com uma linha
neste formato:

```text
HTTP 401 · {"code":"42501","message":"permission denied for table leads"}
```

Esse número é o diagnóstico inteiro. O gesto é sempre o mesmo: **copiar a linha inteira e colar no
chat do Claude**, assim:

```text
Enviei o formulário e apareceu isto na tela:
HTTP 401 · {"code":"42501","message":"permission denied for table leads"}
Diagnostica pelo status e me diz o que fazer. Não reescreve o formulário inteiro.
```

A frase final não é frescura: sem ela, o modelo tende a reescrever o `<form>` pra "melhorar", e aí
você troca um erro conhecido por três desconhecidos.

---

## Família 1 · o lado do Supabase (o HTML está intacto)

Estas acontecem com o template **sem nenhuma alteração**. Não procure bug no seu HTML: o que falta
está do lado do banco.

| Sintoma na tela | Status | Causa | Como detectar |
|---|---|---|---|
| Erro com o código `42501`, fala em `permission denied for table` | 401 ou 403 | **falta o `grant insert`.** Desde 30/05/2026, tabela nova no schema `public` não dá mais privilégio automático pro role `anon` | o corpo do erro traz `42501` e o nome da tabela |
| Erro com `42501` falando em `row-level security` | 401 ou 403 | RLS ligado **sem policy de insert**. Tabela criada pelo Table Editor já nasce com RLS ligado | o corpo cita `row-level security policy` |
| `Invalid JWT` ou `invalid claim` | 401 | o `Authorization: Bearer` está com valor **diferente** do `apikey`. Clássico de colar snippet de tutorial e trocar a chave só num dos dois | compare os dois headers no `index.html`: têm que ser o mesmo texto |
| Falha **só** quando você quer o `id` de volta | 401 ou 403 | `Prefer: return=representation` faz um SELECT implícito, que é negado, e isso **reverte a inserção inteira**. O dado entra e some | o insert simples funciona, o "com retorno" não |
| `PGRST204`, e a mensagem **nomeia** uma coluna | 400 | nome de coluna errado. Quase sempre copy em português com tabela em inglês (`nome` contra `name`) | a própria mensagem diz qual coluna ele não achou |
| `PGRST204` insistindo numa coluna que **você acabou de criar** | 400 | cache de schema do PostgREST, ~30 segundos | espere 30s e tente de novo antes de mexer em qualquer coisa |

RLS e GRANT são **dois cadeados diferentes**: a policy autoriza a linha, o grant autoriza o role a
tocar na tabela. Sem grant, o Postgres nega antes de olhar a policy. Por isso os dois primeiros casos
parecem idênticos e têm conserto diferente.

### As frases de conserto

Falta grant (é o mais comum em projeto criado em 2026):

```text
Deu 42501 no insert. Abre o SQL Editor do Supabase e me dá o SQL de grant pra tabela leads,
pro role anon, só de INSERT. Eu colo e rodo.
```

O SQL, se quiser colar direto (roda inteiro, de uma vez, no SQL Editor):

```sql
revoke all on table public.leads from anon;
grant insert on table public.leads to anon;
```

RLS sem policy:

```sql
alter table public.leads enable row level security;

create policy "inscricao publica insere"
  on public.leads
  for insert
  to anon
  with check (true);
```

Os dois headers diferentes:

```text
Deu 401 Invalid JWT. Confere no index.html se o header apikey e o Authorization: Bearer
estão com exatamente o mesmo valor da chave publicável. Corrige só isso.
```

O SELECT implícito que reverte:

```text
Só falha quando pede o registro de volta. Põe Prefer: return=minimal no fetch e tira
qualquer leitura depois do insert.
```

Coluna com nome errado:

```text
Deu PGRST204 dizendo que a coluna X não existe. Os nomes das colunas da tabela são estes:
[cola aqui os nomes que aparecem no Table Editor]. Ajusta o payload do fetch pra bater
com eles, sem mudar mais nada.
```

---

## Família 2 · o formulário foi reescrito por uma rodada de visual

Estas **não deveriam existir**, porque o template já vem com todas as proteções. Elas voltam quando um
passe de design reescreve o HTML: a doc do impeccable diz, com essas palavras, que o build recompromete
`inputs` e `buttons` no vocabulário da direção escolhida. Ou seja, pedir "deixa essa seção mais bonita"
pode levar embora o motor do formulário.

Se você caiu numa destas, o suspeito é o bloco de refinamento visual, não o Supabase.

| Sintoma na tela | Status | Causa | Como detectar |
|---|---|---|---|
| A página **recarrega**, o formulário esvazia, o banco fica vazio | sem status | sumiu o `e.preventDefault()`. O navegador faz a navegação padrão e **aborta o `fetch` no meio do voo** | a URL ganha um `?` no fim; no DevTools a requisição aparece como `(canceled)` |
| Diz "inscrição confirmada" **sempre**, inclusive com a internet desligada | 200 falso | sumiu o `if (!r.ok)`. O `fetch` não estoura erro em 401, 400 nem 415: ele resolve normalmente | desligue o wi-fi e envie. Se disser confirmado, é isto |
| O botão **não faz nada**, zero requisição no DevTools | sem status | botão ficou fora do `<form>`, virou `type="button"`, ou o script virou `type="module"` e matou o handler | aba Network vazia depois do clique |
| Chegam 2 ou 3 linhas iguais do mesmo lead | sem status | sumiu o `btn.disabled` no submit, e o duplo clique passou duas vezes | Table Editor com linhas repetidas e horário quase idêntico |
| Datas em **1970**, ou hora que não bate | sem status | alguém passou a mandar `created_at` no corpo, e isso sobrescreve o `default now()` do banco. O relógio que vale passa a ser o do visitante | coluna de data com 1970 ou fuso estranho |
| Erro 400 com nome de constraint do Postgres ao desmarcar o consentimento | 400 | sumiu o `required` da caixinha. O `CHECK` do banco virou validação de formulário, que não é o papel dele | desmarque a caixinha: tem que dar mensagem em português **sem nenhuma requisição** na aba Network |
| Erro 415 e o formulário parece normal | 415 | sumiu o `Content-Type: application/json`, ou o corpo parou de ser `JSON.stringify` | o corpo do erro fala em media type |

### A frase de conserto, que é uma só

```text
Uma rodada de visual levou embora parte do motor do formulário. Restaura, sem mexer no
design: o e.preventDefault() no submit, o if (!r.ok) com o status na tela, o header
Content-Type: application/json, o Prefer: return=minimal, o btn.disabled durante o envio,
o required da caixinha de consentimento, e os atributos name= originais dos campos.
Não manda created_at no corpo.
```

### A prevenção, que custa uma linha

Toda vez que pedir mudança visual na seção do formulário, mande junto:

```text
Mantém os name= e os id= do formulário e todo o bloco marcado INTOCÁVEL exatamente como está.
```

---

## Família 3 · o deploy

| Sintoma | Status | Causa | Como detectar |
|---|---|---|---|
| A página no ar tem um `<script>` apontando pra `http://localhost:8400` | sem status, e **sem erro visível** | subiu com o inject do `live` mode dentro do arquivo | `grep -n 8400 index.html` antes de publicar. É item obrigatório do checklist |
| Subiu de novo e a URL de sempre continua com o conteúdo velho | sem status | rodou `vercel` **sem `--prod` depois da primeira vez**, e ganhou um preview. Só o primeiro deploy do projeto é produção por padrão | a URL de produção é a do primeiro deploy; `vercel --prod` é o que reatribui |
| Divulgou a URL e ela abre página de terceiro | sem status | subdomínio `.vercel.app` é first-come-first-served. A Vercel resolveu a colisão com sufixo, **calada** | **copie a URL do resultado do comando**, nunca digite de memória |
| A URL final ficou diferente da que você escolheu | sem status | nome com mais de 63 caracteres é truncado, e nome parecido com domínio (`www-clinica-com`) é reescrito pela proteção anti-phishing | compare o nome que você pediu com a URL que o comando imprimiu |
| A raiz dá **404**, mas o caminho completo funciona | 404 | não existe `index.html` na raiz da pasta enviada | abra a URL pura, sem nada depois da barra |
| A Vercel pergunta "Root (/)" durante o envio | sem status | ela **não achou** um `index.html`. A pergunta já é o diagnóstico | só aparece na lane do Drop |
| A URL mostra código cru ou baixa um arquivo | sem status | o arquivo virou `index.html.txt` (Windows escondendo extensão). Só na lane de fallback | dois cliques no arquivo local: abre renderizado? |
| Corrigiu a data, subiu de novo, e o anúncio segue na versão velha | sem status | **só na lane do Drop**: cada drop cria projeto novo, então existem duas páginas vivas | abra a URL **que está no anúncio** e conte os projetos no dashboard |

### As frases de conserto

Inject do `live` mode:

```text
Roda grep -n 8400 no index.html. Se achar alguma coisa, remove o inject do live mode do
arquivo e roda o grep de novo pra provar que voltou vazio. Depois publica com vercel --prod.
```

[CONFIRMAR: o comando exato do impeccable que remove o inject, e se ele deixa resto pra trás. É o item 5 do roteiro do ensaio de 13/08.]

Publicou e não mudou:

```text
Publica em produção com vercel --prod e me mostra a URL que saiu no resultado do comando.
```

404 na raiz:

```text
Deu 404 na raiz da URL. Confere se o arquivo se chama exatamente index.html e se ele está
na raiz da pasta que subiu. Corrige e publica de novo com vercel --prod.
```

Lane do Drop com projeto duplicado:

```text
Tenho mais de um projeto no Vercel com versões diferentes da mesma página. Me diz qual é o
que está na URL do anúncio, e como apagar os outros no dashboard.
```

---

## A que não é calada, e é a mais grave

Colar a chave **`service_role`** (ou qualquer uma rotulada `secret`) no lugar da publicável **não gera
erro nenhum**. A página funciona idêntica, e o banco fica aberto pro mundo pra ler **e apagar** a sua
lista de inscritos. Não existe sintoma. Nada avisa.

Isso é nome, e-mail e telefone de pessoa física exposto, com anúncio rodando: é incidente de LGPD, não
é bug de front. A verificação leva 10 segundos e é obrigatória antes de divulgar:

1. abra a página publicada e dê `Ctrl+U` pra ver o código-fonte;
2. ache a chave;
3. confirme que o rótulo de onde ela saiu no painel do Supabase era **publishable** (ou `anon`), nunca
   `service_role` nem `secret`.

Se a errada já foi publicada: **rotacione em Project Settings → API antes de republicar**. Trocar só no
arquivo não resolve, porque a chave antiga continua valendo.

### A prova de que a chave publicável pode ficar no HTML

Pedir isto ao Claude, com a chave que está pública na sua página:

```text
Roda um curl de LEITURA na minha tabela leads usando a chave publicável e me mostra o
status e o corpo.
```

Leitura do resultado:

- erro com `42501`: os dois cadeados estão fechados. É o certo.
- `200` com `[]`: a RLS segura, mas o grant de SELECT ficou aberto. Rode `revoke all` e o `grant insert`
  de novo.
- `200` com a lista de leads: **está vazando. Para tudo** e conserte antes de qualquer divulgação.

[CONFIRMAR: se o status exato da negação é 401 ou 403 em cada operação. As duas leituras de pesquisa divergiram, e o código `42501` é o que é estável. Fica pro item 8 do ensaio de 13/08.]

---

## O que a pesquisa não conseguiu confirmar, e não vira fato aqui

- [CONFIRMAR: não existe rate limit publicado pro Data API do Supabase no plano free. A doc de rate limit é a de Auth, que não se aplica. Trate como se não houvesse freio: o endpoint de escrita é público e qualquer pessoa pode despejar linha.]
- [CONFIRMAR: o `pg_net` do Database Webhook aparentemente não tem retry. Se o destino errar, a linha entra no banco e ninguém é avisado. Tem que olhar o log do hook.]
- [CONFIRMAR: o limite de projetos ativos no free do Supabase parece ser por organização, e não por conta. Se travar na criação, a saída é criar organização nova.]
- [CONFIRMAR: mandar `apikey` e `Authorization` com o mesmo valor é o que a doc mostra e é o que o template faz. Que **só** o `apikey` também funcione é reconciliação de duas leituras, e quem decide é o pré-flight do ensaio.]
