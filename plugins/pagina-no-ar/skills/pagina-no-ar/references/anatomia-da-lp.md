# Anatomia da LP: onde cada pedaço da copy entra no template

Leia este arquivo na **Fase 1**, pra decidir a ordem das seções, e de novo na **Fase 3**, quando
for encaixar a copy da Função 4 no `index.html`. Ele volta uma vez, na **Fase 6**, pra conferir o
bloco de data.

## A regra que decide o layout

A página recebe tráfego frio no dia 20. Tráfego frio não conhece você, então a página **prova
antes de pedir**: agenda, para quem é, quem apresenta, e só depois o formulário. O botão do hero
não é um formulário, é uma âncora que rola até `#inscricao`. Na dúvida entre tratar o público como
morno ou como frio, trate como frio: público morno converte bem numa página feita pra frio, e o
contrário não é verdade. É por isso que a ordem das seções do template não é negociável, mesmo
que o conteúdo de cada uma seja todo seu.

## O de-para, seção por seção

| Função 4 | Onde vai no `index.html` | O que muda no caminho |
|---|---|---|
| **Headline** | o `<h1>` do hero | escolhe **uma** das três variações. As outras duas são teste pra depois, não vão pra página |
| **Sub-headline** | o `<p class="lede">` logo abaixo, dentro do `.hero-row` | é aqui que mora o "mesmo sem", a objeção neutralizada |
| **Data, hora e formato** | os dois blocos `.event` | o texto **não** vai no HTML. Vai no `EVENTO` do script, ver abaixo |
| **O que você vai aprender** | a `<ol class="agenda">` | a lista é numerada, mas o conteúdo é loop, não agenda. Ver a nota |
| **Quem apresenta** | a `<section class="field-ink">` com `.host` | prova antes de biografia: o `.lede` começa pelo número e fecha com o nome |
| **Para quem é / não é** | o `.fit`, com 3 itens de um lado e 2 do outro | os "não é pra você" com marcador vazado são qualificação, não desculpa |
| **O formulário** | o `.form-card` marcado INTOCÁVEL | o único texto que você muda ali dentro é o do botão |
| **Reforço final** | o segundo `.event`, dentro de `#inscricao` | ele cobre a metade "repete data e hora". O bônus tem outro endereço, ver a nota |

### Nota da agenda: a lista é numerada, o texto é loop

O template chama a seção de "O que a gente vê, na ordem" e usa `<ol>` porque a ordem carrega
informação. A Função 4 diz o oposto sobre o texto: bullet é **loop aberto**, não spoiler, não
agenda. As duas coisas convivem se você usar os dois níveis que a `<li>` já tem:

- o `<h3>` recebe a **versão curiosa** do bullet ("os três erros que quase todo mundo comete");
- o `<p>` abaixo recebe a **versão concreta** ("por que o terceiro é o que trava o caixa").

A Função 4 entrega as duas versões de bullets de propósito, e é aqui que as duas cabem juntas.
O `<h2>` da seção você reescreve à vontade. O template traz 3 `<li>`; se a copy tiver 4 bullets,
duplique o bloco `<li>` inteiro (o número `04` aparece sozinho, é `counter-increment`).

### Nota do reforço final: onde mora o bônus

O bônus de quem fica até o fim não é objeção, é motivo de comparecer, então ele rende mais ao
lado do botão do que no rodapé. O endereço dele é **um só**, e é a linha genérica que já existe
no hero:

```html
<span class="lede" style="font-size:.92rem">Vagas limitadas pela sala ao vivo.</span>
```

Troque o texto dela pelo bônus. Você não cria marcação nova, e marcação nova é justamente o que
uma rodada de estética come primeiro.

## O bloco de data, hora e fuso

Este é o entregável de +10 pontos do desafio, e é o que nenhuma das páginas de referência tem.
Ele existe duas vezes na página (hero e formulário) e você preenche **num lugar só**, no script:

```js
const EVENTO = {
  data:     '25 de agosto, segunda-feira',
  hora:     '20h',
  duracao:  '90 minutos',
  fuso:     'horário de Brasília',
  iso:      '2026-08-25T20:00:00-03:00',   // só alimenta a contagem regressiva
};
```

O script varre a página procurando `[data-evento="data"]`, `[data-evento="hora"]`, `duracao` e
`fuso`, e escreve o texto nos dois blocos de uma vez. Se `iso` ficar vazio, a contagem some e
nada quebra. O `-03:00` é o fuso de Brasília.

**O fuso não é firula.** Cliente em Manaus, em Rio Branco ou em Portugal lê "20h" e aparece uma
hora errado, o que vira ausência sem ninguém entender por quê. O campo `fuso` é texto justamente
pra você escrever o que o **seu** público entende.

**A dobra no celular é o risco real.** Abaixo de 60rem o bloco `.event` empilha depois da
headline, da sub-headline e do botão. Quem decide se a data cabe na primeira tela é o tamanho da
headline: em português, uma headline de 78 caracteres vira oito linhas no celular e empurra tudo
pra baixo. A alavanca é **encurtar a headline**, e o teste é celular de verdade, sem rolar.

> [CONFIRMAR: em qual comprimento de headline o bloco de data sai da primeira tela no celular.
> Medir no ensaio de 13/08, em aparelho real, não em emulador.]

O `check_page.py` bloqueia a publicação se `EVENTO.data` ou `EVENTO.hora` estiverem vazios,
porque data pública na página é o que o desafio pontua.

## O que você recebe ao se inscrever

A Função 4 não tem essa seção e a página precisa dela: é a resposta pra "o que acontece depois que
eu clico". Ela aparece em **três lugares que têm que dizer a mesma coisa**, e o modo de falhar é
prometer numa e entregar noutra.

1. o `<p class="lede">` acima do formulário, em `#inscricao`, que é a promessa;
2. a resposta da FAQ "Como eu recebo o link?";
3. a mensagem de sucesso, no script.

Se `CONFIG.WHATSAPP` estiver preenchido, o sucesso redireciona pro WhatsApp em 1,2 segundo. Então
a promessa tem que falar de WhatsApp. Se a página prometer e-mail e o destino for WhatsApp, a
pessoa fica esperando um e-mail que ninguém programou:

Os dois textos de confirmação moram no HTML, dentro do formulário, e não numa string do
JavaScript:

```html
<template id="txt-sucesso">[FALTA: diga aqui o que acontece agora, logo depois da inscrição.]</template>
<template id="txt-sucesso-wpp">Te levando pro WhatsApp pra liberar o acesso...</template>
```

Isso é de propósito, e a razão é chata de descobrir sozinho: o gate **obriga** você a editar esse
texto, e um apóstrofo (`chama o Dall'agnol`) dentro de aspas simples no JavaScript quebra o arquivo
inteiro sem dar erro na tela. Em HTML, apóstrofo é só apóstrofo.

Detalhe que morde: o ramo **sem** WhatsApp continua com um `[FALTA:` dentro dele mesmo que você não
use esse caminho. O `check_page.py` acha e bloqueia. Preencha os dois ou apague o que você não usa.

## Um fold, uma mensagem

Teste de 20 segundos, feito uma vez por página: abre a página no celular, sem rolar, e pergunta
três coisas. Tem **uma** mensagem só na tela? Dá pra dizer pra quem é? A data está visível? Se a
primeira tela tenta dizer duas coisas, ela não diz nenhuma. Esse teste também é o melhor argumento
educado pra tirar da dobra o parágrafo que o dono do negócio quer empurrar: não é que o texto seja
ruim, é que ele é o segundo.

## Intent é uma ação só

O componente `intent` do prompt de quatro partes é **uma ação**, e a desta página é: a pessoa se
inscrever no webinário. Nada mais. Não tem "e também agenda uma conversa", não tem "e baixe o
ebook", não tem botão de WhatsApp no hero competindo com o formulário. A página tem uma âncora
(`#inscricao`) e um `submit`, e o texto do botão diz o que acontece ("Quero minha vaga",
"Confirmar minha inscrição"), nunca "Enviar". Cada ação a mais na página divide a atenção do
tráfego frio e cobra em inscrito.

## O que o template acrescenta, e por quê

**FAQ.** Não está na Função 4 e fica. Três perguntas curtas, e a terceira ("Como eu recebo o
link?") é metade do "o que você recebe ao se inscrever" ali de cima.

**Privacidade como seção visível, não link de rodapé.** A página coleta nome, e-mail e telefone de
pessoa física, e a caixinha de consentimento aponta pra `#privacidade` **na própria página**.
Link pra outro documento seria mais uma coisa pra escrever e publicar antes de segunda.

**O `[COMPLIANCE: ...]` que o script não vê.** A Função 4 marca assim os pontos onde o setor
regulado precisa de disclaimer ou de afirmação suavizada, e o público desta turma é exatamente
esse: médico, advogado, consultor. O `check_page.py` procura `[FALTA:` e **não** procura
`[COMPLIANCE:`, então a página pode passar limpa no script e subir com a marcação à vista.
`Ctrl+F` por `[COMPLIANCE:` na página renderizada antes de publicar. E resolver o texto, não
apagar a marcação.

## O mapa: pra onde foi cada peça do prompt de quatro componentes

O esquema `aesthetic + reference + intent + guardrails` continua sendo o melhor slide da aula,
mas o papel dele mudou: hoje ele é o mapa de onde cada peça foi parar. Ensinar o esquema é o que
faz a pessoa entender **por que** a ferramenta pergunta o que pergunta, em vez de virar refém dela.

| Componente | De onde vem | Onde ele acontece na aula |
|---|---|---|
| `aesthetic` | o mundo visual que já vem comprometido no template, e o sorteio do impeccable, que tira a direção de um catálogo externo em vez de deixar o modelo pegar o favorito dele | Fase 2 (o desenho) e Fase 3 (a crítica) |
| `reference` | os 3 prints do pré-work, cada um com legenda dizendo **qual seção** é (hero, prova, formulário). O rótulo é o que impede a referência de depoimento de virar hero | Fase 1, e entra no `PRODUCT.md` que o `init` escreve |
| `intent` | a copy da Função 4 e a spec do PORTÃO 1. Uma ação só, ver acima | Fase 1 e PORTÃO 1 |
| `guardrails` | os blocos INTOCÁVEL do template, as regras do detector, e as duas guardas de movimento: `prefers-reduced-motion` respeitado, e headline e formulário sem animação de entrada | template, e reinstalado no PORTÃO 3 |

## Quando quebra nesta camada

| Sintoma | Causa | Verificação e frase de conserto |
|---|---|---|
| A página publicada mostra `[FALTA: data]` onde deveria ter a data | uma rodada de estética reescreveu o `.event` e tirou o `data-evento="data"`, então o script não achou onde escrever | o `check_page.py` bloqueia, pela regra do `[FALTA:`. No chat: *"restaure os atributos `data-evento` nos dois blocos `.event`, é neles que o script escreve"* |
| A data na página está certa, mas mudar `EVENTO.data` não muda nada | a rodada de estética escreveu a data direto no HTML e tirou o `data-evento`. O `EVENTO` virou config morta | nada bloqueia isso. Troque `EVENTO.data` por `TESTE` e recarregue: se a página não mudar, está morto |
| Duas datas diferentes na mesma página | alguém editou um dos `.event` na mão e esqueceu o outro | `Ctrl+F` pela data na página renderizada: tem que aparecer duas vezes e iguais |
| Página no ar com `[COMPLIANCE: ...]` visível | o script só procura `[FALTA:` | `Ctrl+F` por `[COMPLIANCE:` antes de publicar |
| No celular a data só aparece rolando | abaixo de 60rem o `.event` empilha depois do hero, e a headline longa empurra | celular real, sem rolar. Conserto: encurtar a headline |
| O botão do formulário diz "Enviar" | veio de formulário genérico, não da copy | o botão diz o que acontece. É o único texto do bloco INTOCÁVEL que você muda |
| O formulário parou de gravar depois de uma rodada bonita | o build recompromete inputs e botões no vocabulário do novo visual, e leva junto `name=` e `id=` | o `check_page.py` bloqueia por `e.preventDefault()`, `if (!r.ok)`, `return=minimal` e `consent_text`. No chat, junto com o pedido de estética: *"mantenha os name= e os id= do formulário"* |

> [CONFIRMAR: se um `bolder` ou um `typeset` preserva os atributos `data-evento`. O item 13 do
> ensaio de 13/08 testa a sobrevivência do `fetch`, do `e.preventDefault()`, do
> `Prefer: return=minimal` e do `required` do consentimento, e não lista o `data-evento`.]
