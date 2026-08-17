# A verificação de segurança

Leia na **Fase 5**, antes de divulgar a URL. Tudo aqui foi medido nesta pilha, e a
primeira seção existe pra impedir que você mande alguém rodar um comando que não faz nada.

---

## NÃO use o `/security-review` nesta pasta. Ele não roda.

Isso foi verificado no binário do Claude Code, não suposto.

| Fato | Consequência |
|---|---|
| o portão do comando é um `git rev-parse --is-inside-work-tree`, e ele exige código de saída 0 **e** a saída exata `true` | a pasta da pessoa tem um `index.html` solto e **não é** repositório git, então o portão fecha |
| quando o portão fecha, o comando devolve **só um recado** dizendo que precisa rodar dentro de um repositório git, e **nunca carrega o prompt de revisão** | a pessoa recebe uma conversa e **zero verificação**. Não dá erro, o que é pior |
| rodar `git init` não salva: o prompt de verdade é montado em cima de `git diff origin/HEAD...` | sem remoto configurado, os três comandos de git do prompt morrem com código 128 |
| mesmo com git e remoto, ele revisa **diff**, e foi instruído literalmente a *"not comment on existing security concerns"* | ele **nunca olharia** um `index.html` pronto, que é justamente o que você tem |

**E o `/impeccable harden` também não substitui.** Ele é comando de **escrita** sobre
resiliência de frontend: overflow de texto, i18n, estados de erro, empty state,
acessibilidade. De segurança de verdade ele tem zero: nenhuma menção a chave, secret,
token, credencial, CSP, XSS ou CSRF no arquivo inteiro. O único "leak" que aparece lá é
vazamento de memória.

**Então a verificação desta fase é o checklist abaixo mais o `check_page.py`.** Um
checklist que a pessoa executa vale mais que um comando que devolve conversa.

---

## O risco real desta página, nomeado

Não é XSS, não é injeção e não é CSRF. É um só, e ele é catastrófico e calado:

> **A chave `service_role` colada no HTML público.**

Se isso acontecer, **a página fica normal**. Nada quebra, nada avisa, o lead entra, a
mensagem de obrigado aparece. E o banco inteiro fica aberto pro mundo, porque a
`service_role` passa por cima da RLS. Qualquer pessoa que abrir o `Ctrl+U` tem escrita e
leitura em tudo.

**A chave publicável no HTML está CERTA.** Ela é pública de propósito, e quem segura o
banco é a RLS, não o segredo da chave. Variável de ambiente **não esconde nada** em página
estática: o valor é embutido no HTML no build e continua visível no `Ctrl+U`. Então nunca
"conserte" uma chave publicável exposta trocando ela por uma secreta.

| Chave | Como é | Vai pro HTML? |
|---|---|---|
| **Publishable key** | começa com `sb_publishable_` | **sim, e está certo** |
| Secret key / `service_role` | começa com `sb_secret_`, ou vem rotulada `service_role` | **NUNCA, em lugar nenhum** |

---

## O checklist, e ele roda na página PUBLICADA

Os quatro primeiros são de segurança. Rode todos, e **mostre a tela de cada um**.

### 1. `Ctrl+U` na URL de produção, e procure a chave

Abra o código-fonte da página no ar e procure por `sb_`. O que aparecer tem que começar
com `sb_publishable_`.

Se aparecer `sb_secret_` ou a palavra `service_role`: **pare tudo.** A ordem é rotacionar
a chave no painel do Supabase **antes** de consertar o HTML, porque a chave vazada já está
vazada, e trocar o arquivo não desfaz isso.

### 2. `grep` por `8400` e por `impeccable-`, e as duas voltam vazias

O `live` mode do impeccable sobe um servidor auxiliar na porta 8400 e **escreve um
`<script>` dentro do seu `index.html`**. Se esse arquivo for pro ar com o inject dentro, a
página **não quebra**, **não aparece erro nenhum** no console do visitante, e fica uma
referência a `localhost` no código-fonte de uma página que vai receber tráfego pago.

**Não é só o `8400`.** O encerramento pode deixar para trás blocos
`impeccable-variants-start` e `impeccable-carbonize-start`, e esses não têm `8400` dentro.

Peça no chat, e leia a resposta:

```text
Procura no index.html por "8400" e por "impeccable-" e me diz exatamente o que achou.
```

E antes disso, encerre o live direito:

```text
Encerra o live mode do impeccable e remove o inject do index.html.
```

> Existe a variante `stop --keep-inject`, que **deixa o script no arquivo de propósito**
> pra reiniciar rápido. Não use essa antes de publicar.

### 3. Submeta com o consentimento desmarcado, e conte as requisições

Abra a aba **Network** do navegador, desmarque a caixinha de consentimento e clique em
enviar. Tem que dar **zero requisição**.

Se sair requisição e voltar `400` com nome de constraint do Postgres na tela, o `required`
do HTML se perdeu numa rodada de estética. Isso é bug, não é UX: significa que a página
poderia gravar consentimento afirmativo de quem não marcou nada, e é justamente esse
registro que vale como prova depois.

### 4. Prove que a leitura está trancada, e prove com um controle negativo

Escrita tem que passar, **leitura tem que falhar**. O `curl` de pré-flight está em
`supabase.md`.

E a regra que faz a prova valer: **toda sonda de segurança precisa de um controle que
falhe por outro motivo.** Rode a mesma sonda com uma **chave inventada** e confirme que a
resposta é diferente. Sem o controle negativo, "deu erro" também é compatível com "a
chave estava errada", e você não provou trava nenhuma.

Diagnóstico por código, que resolve em segundos:

| resposta | quer dizer |
|---|---|
| `401 Invalid API key` | a chave está errada. Morre **antes** de olhar o resto |
| `42501 permission denied` | falta **grant** pro role |
| `404 PGRST205` | a tabela não existe naquele schema |
| `400 PGRST204` | o SQL colado divergiu do modelo, quase sempre nome de coluna em português |

**Chave errada e trava de permissão são erros diferentes, e o código separa os dois.**

### 5. O script, que pega o que o olho não pega

```bash
python3 <SKILL>/scripts/check_page.py index.html
```

Ele sai com código 1 se houver bloqueio. Se der `No such file`, o `<SKILL>` não foi
substituído pelo caminho por extenso.

---

## O que fica de fora, e é honesto dizer

Esta página tem um **endereço de escrita público por natureza**: ele está no código-fonte.
Isso é o desenho, não um defeito, e a mitigação é em camadas:

| Camada | O que ela faz | Limite |
|---|---|---|
| RLS ligada com policy só de INSERT | ninguém lê, ninguém altera, ninguém apaga | não impede alguém de **escrever** lixo |
| `CHECK` de tamanho em toda coluna de texto | limita o dano por linha | não limita o número de linhas |
| honeypot com nome que o autofill ignora | barra robô simples | não barra quem lê o código |

**Não achamos rate limit publicado pro Data API no plano free, então assuma que não há
freio.** Se a página virar alvo, a resposta é uma tabela de contagem por IP no próprio
Postgres, ou o firewall da Vercel (bloqueio de IP e regra própria são grátis em todos os
planos; só rate limiting é cobrado).

> **Não renomeie o honeypot.** Ele se chama `website` porque precisa de um nome que o
> autofill do navegador **não** reconheça como campo de verdade. Trocar pra `company`,
> `url` ou `site` faz o gerenciador de senhas preencher sozinho no computador de uma
> pessoa real, e aí a página mostra "inscrição confirmada" pra ela e **não grava nada**.
> Ela sai achando que está inscrita.

---

## O passo seguinte, pra quando a página for canal de cliente pagante

O desenho de hoje é o browser escrevendo direto no Supabase com a chave publicável. Ele
funciona, e é por isso que é comum. O que ele publica é um **endpoint de escrita anônimo**:
quem abre o DevTools copia a chamada, e o honeypot e a validação, por morarem no cliente,
são pulados junto.

O desenho melhor é **uma função no servidor** (`/api/lead` na Vercel) com a chave secreta
lá dentro: a chave nunca chega no navegador, a validação é refeita onde não dá pra burlar,
e a resposta pra "quem pode escrever aqui?" é uma só. De brinde, o CSP fecha em
`connect-src 'self'`.

**Isso não é conserto pra hoje, é o próximo degrau.** Trocar de desenho no meio da
primeira publicação é como se perde a página.
