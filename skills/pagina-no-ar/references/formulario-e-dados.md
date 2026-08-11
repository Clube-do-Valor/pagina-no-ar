# Formulário e dados

Leia este arquivo em dois momentos: quando montar a ficha de insumos e o Portão 1 (decidir **quais campos** a página pede), e no bloco do dado, quando for criar a tabela e conferir o que a linha gravada precisa ter. Aqui está o modelo de dado, o payload, o texto de consentimento e a seção de privacidade. O SQL de `grant`, RLS e policy não é assunto deste arquivo: eles vêm no bloco colado do passo do Supabase.

---

## A regra que decide os campos, sem chute

**Campo extra só entra se a página DEVOLVER alguma coisa por ele.** É isso, e resolve a discussão inteira.

Formulário de inscrição não é cadastro. Cada campo a mais é uma pessoa a menos terminando, e a pergunta que autoriza o campo é sempre a mesma: *o que a pessoa recebe de volta por ter respondido isso?* Se a resposta for "nada, é pro meu CRM", o campo não entra. Se a resposta for "é o que decide o que eu mando pra ela", o campo entra e a página diz isso na tela.

A regra irmã, e ela é do mesmo par: **o botão nomeia o que entrega, em vez de dizer "enviar".** "Enviar" descreve o que o navegador faz. O botão tem que descrever o que a pessoa ganha. `Confirmar minha inscrição`, `Quero o link da sala`, `Guardar meu lugar`. Se o botão só consegue dizer "enviar", é sinal de que a página está pedindo sem devolver.

| Campo que alguém vai querer | O que a página devolveria por ele | Veredito |
|---|---|---|
| Nome | trata a pessoa pelo nome no WhatsApp e no lembrete | **entra** |
| E-mail | é por onde o acesso chega, e é a base que sobrevive a tudo | **entra** |
| WhatsApp | é por onde a jornada continua, e a página diz isso | **entra se a jornada continua no WhatsApp** (ver abaixo) |
| Consentimento | não é dado, é a prova de que o resto pode ser usado | **entra, obrigatório** |
| Empresa, cargo | nada. É pro seu CRM, não pra ela | fica fora |
| Faturamento, número de funcionários | nada nesta página. Isso é pergunta de diagnóstico, e diagnóstico devolve resultado | fica fora |
| "Como você me conheceu?" | nada. É relatório seu | fica fora |
| CPF, data de nascimento, endereço | nada, e é dado pessoal que você passa a ter que guardar e proteger sem precisar dele | **fica fora, e não é negociável** |

Guardar dado que não serve pra finalidade declarada é o oposto do princípio de necessidade da LGPD, e é passivo: você responde por ele mesmo sem usar. [CONFIRMAR: artigo e inciso do princípio da necessidade/minimização na LGPD, conferir no texto oficial antes de citar número].

**Onde o campo extra é legítimo:** quando a página vira diagnóstico e devolve resultado na hora. Aí o botão diz o cálculo (`Ver minha nota`, `Calcular meu potencial`) e o campo a mais está pago. Isso não é a página desta aula, mas é o caminho de quem quiser subir depois.

---

## O telefone, e por que tirar ele não é edição de texto

Telefone é obrigatório **quando a jornada continua no WhatsApp**. Nesse caso ele não é curiosidade, é o canal: a pessoa se inscreve, cai no WhatsApp, e é por ali que o link e o lembrete chegam. Legítimo, e a página fala isso em voz alta na tela.

**Se a sua jornada não continua no WhatsApp, o campo sai. Só que "sai" mexe em três lugares do arquivo, não em um.** O script do formulário procura esses três por nome:

1. o `<label>` com `<input type="tel" name="phone">`;
2. o `<em class="field-err" id="err-phone">` logo abaixo dele;
3. o bloco de normalização e validação do telefone dentro do script.

Apagar só o primeiro deixa o script chamando `errPhone.hidden = true` num elemento que não existe mais. O handler estoura na primeira linha, antes de qualquer validação, e o sintoma é o pior que existe: **o botão não faz nada**. Sem mensagem, sem erro na tela, sem requisição.

> Recomendação pra esta aula: **mantenha o telefone e faça a jornada continuar no WhatsApp.** É o caminho testado, é o que faz o botão de sucesso levar a pessoa pro `wa.me`, e evita mexer no bloco intocável. Se você tem certeza de que quer tirar, peça assim, com essas palavras: *"remova o campo de telefone do formulário, o `err-phone` e o bloco de normalização do telefone no script, e confirme que o submit continua funcionando"*.

---

## Modelo de dado

Esta é a tabela canônica. Se o SQL que você colar no Supabase divergir dela em um nome de coluna, o formulário devolve **400 com `PGRST204`** dizendo que a coluna não existe, e o lead não entra.

```sql
create table public.leads (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text not null check (char_length(name)  between 1 and 120),
  email        text not null check (char_length(email) between 3 and 180),
  phone        text         check (char_length(phone) <= 24),
  consent_lgpd boolean not null check (consent_lgpd is true),
  consent_text text not null check (char_length(consent_text) between 1 and 2000),
  source_url   text         check (char_length(source_url) <= 500)
);
```

| Coluna | Tipo | Quem preenche | Nota |
|---|---|---|---|
| `id` | `uuid` | **o banco** | `default gen_random_uuid()`. O navegador nunca manda id |
| `created_at` | `timestamptz` | **o banco** | `default now()`. Mandar do navegador grava o relógio do visitante, que pode estar em 1970 |
| `name` | `text` | o formulário | com `trim` |
| `email` | `text` | o formulário | com `trim` e em minúsculas, senão o mesmo lead entra como dois |
| `phone` | `text` | o formulário | só dígitos, com o 55 na frente. É a única chave de ligação com a conversa depois. Aceita nulo **de propósito**: quem tirar o campo (jornada sem WhatsApp) não pode levar `400` do banco por isso. Quem exige o telefone é o `required` do HTML, não a tabela |
| `consent_lgpd` | `boolean` | o formulário | sempre `true`, ver a seção do backstop |
| `consent_text` | `text` | o formulário | a redação congelada, ver a seção do congelamento |
| `source_url` | `text` | o formulário | `origem + caminho` da página, sem querystring |

Três decisões que já estão tomadas e não precisam ser rediscutidas ao vivo:

- **Não existe coluna `consent_at`.** A linha só nasce no submit, então o `created_at` já é a hora do consentimento. Coluna a mais aqui seria a mesma informação duas vezes, com risco de as duas discordarem.
- **Não tem `UNIQUE` no e-mail**, de propósito. Na aula todo mundo testa a própria página com o próprio e-mail, e um `409` no segundo teste parece "quebrou" na frente de dez pessoas. Duplicata se resolve na leitura. Endurecer isso é assunto de depois do desafio.
- **`check` de tamanho em toda coluna de texto fica.** O endpoint de escrita é aberto por natureza (o endereço está no código-fonte da página), e não achamos rate limit publicado pro Data API no plano free, então assuma que **não há freio** e limite o dano no schema. O CAPTCHA nativo do Supabase é só de Auth, não vale pro formulário, então a mitigação de robô é o honeypot.

**O `source_url` tem um limite conhecido, e é melhor saber agora:** ele grava origem e caminho, **sem a querystring**. Ou seja, `utm_source` e afins **não chegam** no banco. No dia do tráfego pago, "de qual anúncio veio esse lead" não se responde por essa coluna. Isso é limite nomeado, não bug, e não se resolve criando campo novo no formulário (o que contrariaria a regra lá de cima).

---

## O payload canônico

Isto é o corpo exato que sai do navegador. Vale igual pro degrau que grava no Supabase e pro degrau que posta num webhook, o que significa que quem plugar um destino depois já sabe o contrato:

```json
{
  "name": "Maria Exemplo",
  "email": "maria@exemplo.com.br",
  "phone": "5511999999999",
  "consent_lgpd": true,
  "consent_text": "Concordo em receber comunicações sobre este webinário por e-mail e WhatsApp, e li a seção de privacidade desta página.",
  "source_url": "https://lp-maria-webinario.vercel.app/"
}
```

O que **não** vai no corpo, e é de propósito: `id` e `created_at` (quem carimba é o banco) e o campo `website`, que é o honeypot e nunca é enviado.

**Não renomeie o honeypot.** Ele se chama `website` porque precisa de um nome que o autofill do navegador **não** reconheça como campo de verdade. Trocar pra `company`, `url` ou `site` faz o gerenciador de senhas preencher sozinho no computador de uma pessoa real, e aí a página mostra "inscrição confirmada" pra ela e **não grava nada**. Ela sai achando que está inscrita. É a falha calada mais cruel possível, e ela nasce de uma renomeação que parece inofensiva.

---

## O `consent_text` congelado, e por que isso é a coluna mais importante da tabela

O script lê o texto do consentimento **da própria página, no momento do submit**, e grava dentro da linha:

```js
consent_text: (document.getElementById('consent-text').textContent || '').replace(/\s+/g, ' ').trim(),
```

Motivo: consentimento é sempre a **um texto específico**. Se você mudar a redação em 19/08 pra caber num anúncio, ou pra incluir "e ofertas do meu programa", toda linha gravada antes disso perde o vínculo com o que a pessoa de fato leu. Sem essa coluna você consegue dizer "ela consentiu". Com ela você consegue dizer "ela consentiu **com isto**", e a segunda frase é a que serve de prova. A LGPD trata consentimento no art. 8º, e vale conferir a redação na fonte oficial.

Duas consequências práticas:

- **O `id="consent-text"` faz parte do contrato de dado, não do visual.** Se uma rodada de estética reescrever aquele `<span>` e derrubar o `id`, o script estoura antes de qualquer envio e o sintoma é de novo **o botão não faz nada**. Se o `id` sobreviver mas a redação for reescrita, nada quebra e a coluna passa a gravar o texto novo, calada.
- **Nunca faça `UPDATE` em `consent_text` de linha antiga.** Nem pra "padronizar", nem pra corrigir uma vírgula. O valor velho é justamente a prova. Se a redação mudou, ela vale das linhas novas em diante.

Teste que fecha isso: mandar um lead de teste e abrir a linha no Table Editor conferindo que `consent_text` **não veio vazio** e que bate com o que está escrito na página.

---

## O texto de consentimento, de partida

Este é o texto que já vem na caixinha do template. É ponto de partida, não parecer jurídico:

```text
Concordo em receber comunicações sobre este webinário por e-mail e WhatsApp,
e li a seção de privacidade desta página.
```

Se a sua jornada não usa WhatsApp, tire a palavra WhatsApp daqui **e** do texto da seção de privacidade, senão a página promete um canal que não existe. E lembre: mudou a redação, mudou o que fica congelado nas linhas a partir dali.

> **Ressalva obrigatória, e ela vale pra todo mundo na sala.** O texto de consentimento, a política de privacidade e o tratamento de um eventual incidente **não são decisão técnica**. A LGPD trata consentimento no art. 8º, informação ao titular no art. 9º, segurança no art. 46 e comunicação de incidente no art. 48, e vale conferir cada um na fonte oficial. O que este material entrega é redação de partida. **Valide com um advogado ou com o Encarregado de Dados do seu próprio negócio antes de escalar tráfego.**

---

## A seção visível de privacidade

A página coleta nome, e-mail e telefone de pessoa física real, então a explicação disso fica **visível na própria página**, não escondida atrás de um link pra um PDF que ninguém abre. O template já traz a seção com âncora `#privacidade`, e a caixinha de consentimento aponta pra ela.

Quatro coisas ela precisa dizer, em português de gente:

| O que dizer | Por quê |
|---|---|
| **quais dados** são coletados, nominalmente | a pessoa tem que saber o que está entregando |
| **pra quê**, com finalidade única e concreta | "te mandar o acesso ao webinário e os avisos ligados a ele" é finalidade. "Para melhorar sua experiência" não é nada |
| **que não são vendidos nem repassados** fora do necessário pro evento | é o medo real de quem hesita no botão |
| **como pedir a exclusão**, com um contato que existe | de nada adianta o direito sem o endereço. Precisa de nome ou razão social e um e-mail que você lê |

O que **não** entra ali: promessa que você não cumpre ("seus dados são criptografados de ponta a ponta"), nem lista de terceiros que você não sabe se usa. Texto curto e verdadeiro vale mais que texto longo e copiado.

---

## O `CHECK` de consentimento é backstop, não validação de formulário

O `check (consent_lgpd is true)` na tabela **não pode ser quem barra o usuário**. Se ele for o responsável por barrar, a pessoa clica, espera a ida e a volta pela rede, e recebe **HTTP 400 com nome de constraint do Postgres na tela**, que não é mensagem pra ninguém ler.

Quem barra é a caixinha `required` no HTML, que roda **antes de qualquer requisição**, com mensagem em português, no navegador da pessoa.

Na verdade a coisa é ainda mais forte: o payload manda `consent_lgpd: true` fixo, e ele só é montado **depois** de a validação do navegador passar. Ou seja, o `CHECK` é matematicamente incapaz de disparar por causa do formulário. O que ele guarda é o resto: qualquer POST que **não veio da página**, batendo direto no endpoint aberto.

| Sintoma | Causa | Verificação |
|---|---|---|
| desmarcar a caixinha e aparecer `400` com nome de constraint | o `required` da caixinha sumiu numa rodada visual | abrir a aba Network e submeter com a caixinha vazia: tem que dar **zero requisição** |
| botão não faz nada, nenhuma mensagem, nenhuma requisição | o script estourou antes do envio, quase sempre porque `id="consent-text"` ou `id="err-phone"` foi removido do HTML | abrir o Console do navegador e ler a primeira linha vermelha |
| linha entra no banco com `consent_text` vazio | o `<span id="consent-text">` ficou vazio ou virou imagem/ícone | Table Editor, olhar a coluna na linha de teste |
| `400 · PGRST204` dizendo que a coluna não existe | o SQL colado divergiu do modelo de dado acima, quase sempre nome em português | comparar nome por nome com a tabela canônica deste arquivo |

**Se o `CHECK` disparar em produção, é bug, não é UX.** Significa que o `required` do HTML se perdeu numa rodada de estética, e a hora de descobrir isso é no teste, não com anúncio rodando.
