# Deploy: do arquivo no seu computador pra URL pública

Este arquivo é lido em dois momentos: na **Fase 5**, quando a página sobe pela primeira vez, e **toda vez que você for republicar** depois de mexer em alguma coisa. Se você já tem URL e só quer subir a versão nova, pula direto pro Passo 4.

Passo exato. Onde tiver bloco de código, é pra colar como está.

---

## O que você vai ter no fim

Uma pasta no seu computador com um arquivo `index.html` dentro, e um endereço público do tipo `https://lp-julio-webinario.vercel.app`. **Esse endereço nunca muda.** Você vai republicar essa página umas dez vezes hoje, e nas dez vezes é o mesmo link. É por isso que ele pode ir pro grupo assim que a página estiver de pé.

Quem faz o quê:

| Comando | Quem roda | Onde |
|---|---|---|
| `npx vercel login` | **você**, na mão | no terminal (no Claude Desktop é o integrado, ``Ctrl+` ``, no Mac ``Cmd+` ``) |
| `npx vercel` (a primeira vez) | **você**, na mão | mesmo terminal |
| `npx vercel --prod` (todas as outras) | **o Claude**, por frase no chat | ele roda e te devolve a URL |

Os dois primeiros ficam com você porque eles **fazem pergunta na tela e esperam resposta**. O Claude roda em modo não-interativo quando detecta que é um agente (está escrito no `--help` do próprio comando), então numa pergunta ele não vai saber o que fazer. Depois que o projeto está criado, ninguém mais pergunta nada e o Claude assume.

> `npx vercel` funciona sem instalar nada. Se você instalou o Vercel global algum dia, `vercel` sozinho também serve. Os dois são o mesmo programa.

---

## Antes de rodar qualquer coisa, três conferências de 30 segundos

**1. Node responde?** No terminal integrado:

```bash
node -v
```

Se saiu algo tipo `v22.22.2`, segue. Se deu "comando não encontrado", você não tem Node e o caminho principal não roda na sua máquina: vai direto pra seção **Lane de fallback** no fim deste arquivo. Você sai com página no ar do mesmo jeito.

**2. A pasta certa, e sempre a mesma.** O deploy é da pasta onde está o `index.html`. Na primeira vez, o Vercel grava um arquivo escondido `.vercel/project.json` **dentro dessa pasta**, e é esse arquivo que faz a URL ser sempre a mesma. Rodar de outra pasta cria **outro projeto e outra URL**, sem avisar. Confere onde você está:

```bash
pwd
ls
```

Tem que aparecer `index.html` na lista.

**3. O nome da pasta é o nome que vai pro ar.** Antes do primeiro deploy, renomeie a pasta pro nome final. Regras na tabela abaixo.

---

## O nome, decidido antes de digitar qualquer comando

O nome do projeto vira o endereço. Convenção da turma: **`lp-PRIMEIRONOME-webinario`**. Exemplo: `lp-julio-webinario` vira `https://lp-julio-webinario.vercel.app`.

| Regra | Por quê |
|---|---|
| só minúsculas, números e hífen | é o que vira subdomínio |
| **sem ponto, sem `www`, sem `.com`** | nome parecido com domínio (tipo `www-clinica-com`) é **reescrito pela proteção anti-phishing** e vira só `clinica`. Sem aviso |
| curto | nome com mais de **63 caracteres** antes do `.vercel.app` é **truncado**. Sem aviso |
| sem espaço e sem acento | vira outra coisa, também calado |
| não pode ser genérico | `webinario.vercel.app` já é de alguém. Subdomínio no `.vercel.app` é **first-come-first-served, não reserva**: se o seu bater com um existente, a Vercel resolve a colisão sozinha e te dá um sufixo |

Os quatro casos acima terminam do mesmo jeito: **a URL final é diferente da que você imaginou, e ninguém te avisa.** Daí a regra que vale mais que todas: **copie a URL que aparece no terminal. Nunca digite de memória.**

---

## Passo 1 · `npx vercel login`

Você, no terminal integrado:

```bash
npx vercel login
```

A primeira execução baixa o pacote e mostra um aviso de telemetria. Normal, deixa rolar.

O que aparece (comportamento verificado na CLI **58.9.3**, em 11/08/2026):

```
Vercel CLI 58.9.3 (Node.js 22.22.2)
>
  Visit vercel.com/device and enter SVCL-FDLD

⠋ Waiting for authentication...
```

Ou seja: abre `vercel.com/device` no navegador, digita **o código que apareceu no seu terminal** (oito caracteres com um hífen no meio, o `SVCL-FDLD` acima é só exemplo) e confirma. Se o navegador pedir login, entra **pelo GitHub**, que é a conta dos pré-requisitos do README. O terminal sai sozinho do "Waiting for authentication" quando você confirma.

Não fecha o terminal enquanto ele espera. E não digita o código de outra pessoa: cada terminal gera o seu.

> Se em vez do código na tela você cair num fluxo que **manda um código por e-mail**, procura na caixa de spam antes de achar que não chegou. Acontece.
> [CONFIRMAR: no ensaio de 13/08, com conta nova, o `vercel login` fica no fluxo do `vercel.com/device` ou pede e-mail em algum momento?]

---

## Passo 2 · `npx vercel` (só a primeira vez, e ele já publica em produção)

Ainda você, na mão, dentro da pasta que tem o `index.html`:

```bash
npx vercel
```

Ele faz umas poucas perguntas curtas de configuração. **Aceita o padrão em todas apertando Enter**, e a única que você digita alguma coisa é a do nome do projeto, se ele oferecer um nome que não é o que você quer. Se travar em alguma pergunta que você não entendeu, chama o BJ em vez de chutar: chute aqui custa uma URL errada.

[CONFIRMAR: o texto literal das perguntas do `vercel` em projeto novo (escopo, link, nome, diretório) na CLI 58.x, conferir no ensaio de 13/08 e colar aqui como está na tela.]

**Detalhe que resolve metade da confusão:** o primeiro deploy de um projeto novo **já é produção**, mesmo sem `--prod`. Não é rascunho, não é preview. Está no ar, público, com HTTPS automático, e o endereço que saiu no terminal é o definitivo.

---

## Passo 3 · Provar que está no ar (aba anônima)

Copia a URL do terminal, abre uma **janela anônima** (`Ctrl+Shift+N`, no Mac `Cmd+Shift+N`) e cola.

Aba normal prova pouco, porque você está logado e o navegador tem cache. Anônima prova que **qualquer pessoa** vê a página. Se abriu na anônima, essa URL vai pro grupo do desafio agora, com todas as letras. É ela até 18/09.

---

## Passo 4 · Republicar, sempre com `--prod`

Toda vez que a página mudar (texto, visual, chave do Supabase), sobe de novo. Frase pra colar no chat do Claude:

```
Roda `npx vercel --prod` na pasta do projeto e me devolve a URL de produção que saiu no terminal.
```

**Tem que ser `--prod`.** `npx vercel` sozinho, depois da primeira vez, gera um **preview**: um endereço novo, temporário, que ninguém tem. A sua URL de sempre continua mostrando a versão velha, você jura que subiu, e o anúncio aponta pra página desatualizada. Com `--prod`, o endereço de produção é reapontado pro deploy novo automaticamente.

Antes de cada `--prod`, dois greps de cinco segundos (pede pro Claude rodar):

```bash
grep -n "8400" index.html
grep -n "service_role\|sb_secret\|SUPABASE_SERVICE" index.html
```

Os dois têm que voltar **vazios**. O primeiro pega o `<script>` que o `live` mode do impeccable injeta e que não pode ir pro ar. O segundo pega a chave errada do Supabase: a que vai no HTML é a **publicável**, e essa é pública de propósito. A `service_role` numa página pública não dá erro nenhum, a página funciona igual, e o seu banco de inscritos fica aberto pro mundo ler e apagar.

---

## As falhas que não dão erro na tela

Nenhuma destas grita. Cada uma pede um gesto de verificação, não uma sensação de que deu certo.

| Sintoma | Causa | Verificação |
|---|---|---|
| Subiu, a URL não mudou de conteúdo | rodou `vercel` sem `--prod` e ganhou um preview | a URL de produção é a do primeiro deploy; só `--prod` reaponta ela |
| Saiu uma URL nova, com sufixo ou nome estranho | rodou fora da pasta que tem o `.vercel/`, e nasceu um segundo projeto | `ls -a` mostra `.vercel` na pasta? é sempre a mesma pasta? |
| Divulgou a URL e ela abre página de terceiro | subdomínio é first-come-first-served, a Vercel resolveu a colisão calada | copiar a URL **do terminal**, nunca digitar de memória |
| Raiz dá 404, mas um caminho completo funciona | não tem `index.html` na raiz da pasta enviada | abrir a URL pura, sem nada depois da barra |
| A URL mostra código cru ou baixa um arquivo | o arquivo virou `index.html.txt` (Windows escondendo a extensão) | dois cliques no arquivo local: abre renderizado no navegador? |
| A página no ar tem um `<script>` apontando pra `localhost:8400` | deployou com o inject do `live` mode dentro | `grep -n "8400" index.html` antes de subir, tem que voltar vazio |
| Corrigiu a data, subiu, e o anúncio segue na versão velha | **só na lane do Drop**: cada drop cria projeto novo, então tem duas páginas vivas | abrir a URL **que está no anúncio**, e contar quantos projetos existem no dashboard |

---

## A cláusula que eu vou dizer em voz alta: o plano Hobby é uso pessoal

A regra de uso justo da Vercel, com essas palavras: *"Hobby teams are restricted to non-commercial personal use only. All commercial usage of the platform requires either a Pro or Enterprise plan."* E a definição de comercial inclui, literalmente, **"Advertising the sale of a product or service"**.

Traduzindo pra 19/08: apontar anúncio pago pra uma página que vende o seu serviço é uso comercial. Cai exatamente nisso. A mesma doc diz que *"where possible, we'll reach out before taking action"*, então não é risco de derrubada instantânea, mas eu não construo a página de vocês em cima de "provavelmente avisam antes".

Três saídas, e escolher é seu:

1. **Vercel Pro**, ~US$ 20/mês. Muda só o plano, a URL e a página continuam as mesmas. Pra quem vai colocar tráfego pago, US$ 20 é ruído perto da verba de anúncio. É a recomendação pra quem de fato vai anunciar.
2. **Cloudflare Pages**, grátis e com uso comercial permitido, banda ilimitada. Mesmo gesto de arrastar a pasta, e o upload direto **atualiza o mesmo projeto**, então a URL fica estável sem precisar de GitHub. Tecnicamente é a melhor opção gratuita das três; o preço é um painel bem mais intimidante.
3. **Netlify Drop**, grátis, e um novo drop na mesma área de Deploys **mantém a URL**. [CONFIRMAR: a permissão de uso comercial no free do Netlify vem de resposta da própria equipe no fórum oficial, não de página de termos. Se for repetir isso na aula, checar antes.]

---

## Lane de fallback · Vercel Drop, pra quem não tem Node

Se `node -v` não respondeu, este é o seu caminho. Você sai com página no ar, HTTPS e lead entrando. Perde só o refinamento fino.

1. Confirme que o arquivo se chama exatamente **`index.html`**. No Windows, ative "Extensões de nomes de arquivos" no Explorador de Arquivos e olhe: se estiver `index.html.txt`, renomeie tirando o `.txt`.
2. Abra `vercel.com/drop`, logado.
3. Arraste **o arquivo `index.html`** (ou a pasta que tem ele dentro) pra área indicada. Sem git, sem CLI, sem Node.
4. Se aparecer uma pergunta sobre diretório raiz, tipo "Root (/)", isso é um diagnóstico grátis: **ela só aparece quando a Vercel não achou um `index.html`**. Volte pro passo 1, o nome do arquivo está errado.
5. Copie a URL da tela. Ela já é de produção: o primeiro deploy de um projeto novo sempre é.
6. Teste em aba anônima.

**As duas armadilhas desta lane, e elas são sérias:**

- **Cada drop cria um projeto NOVO, com URL nova.** Você não está atualizando a página, está criando outra. Então: enquanto estiver ajustando, tudo bem. Mas divulgue **uma** URL só, e sempre a mais recente.
- **Apague os projetos antigos antes de 19/08**, que é o dia em que o anúncio começa a rodar. Duas páginas vivas com datas diferentes é o pior desfecho possível: o anúncio aponta pra versão velha e você não percebe, porque as duas funcionam. Caminho: dashboard da Vercel, abre o projeto antigo, aba **Settings**, rola até a área de exclusão no fim da página, e confirma. [CONFIRMAR: texto exato do botão e do diálogo de confirmação na Vercel em 08/2026.]

Pra ajustar a página sem impeccable e sem `live` mode: pede no chat do Claude uma mudança **por vez**, olha o resultado no Browser pane do Desktop, e refaz o drop quando estiver bom.

---

## Checklist antes de mandar a URL pra alguém

- [ ] `grep -n "8400" index.html` volta vazio
- [ ] a chave no arquivo é a **publicável** do Supabase, nunca a `service_role`
- [ ] a URL foi **copiada** do terminal, não digitada
- [ ] ela abre em **janela anônima**
- [ ] a **data, a hora e o fuso** do webinário aparecem sem rolar a página
- [ ] abriu no **celular** e continua legível
- [ ] você mandou um **lead de teste** e ele apareceu do outro lado

Sete itens, dois minutos. É o que separa "está no ar" de "achei que estava".
