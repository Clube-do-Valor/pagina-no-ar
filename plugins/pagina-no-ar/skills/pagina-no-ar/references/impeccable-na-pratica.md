# impeccable na prática

Leia quando a mão passar do andaime pro visual: bloco 3 da aula (o `init`), bloco 4 (o sorteio) e bloco
5 (o refinamento). E leia antes de qualquer publicação, porque o gate do inject do `live` está aqui
embaixo e é a única falha da aula que não dá erro na tela. Todas as citações são **número de linha** do
`reference/new-work.md` do impeccable (107 linhas, 7 seções): "linha 71" é conferível, "§71" não existe.

## O que é, e por que ele é a resposta exata da tese da aula

A tese: **o gargalo não é gosto, é vocabulário.** Você reconhece uma página que passa confiança, só não
sabe nomear em palavra de designer o que faz ela passar confiança. Aí o prompt sai genérico e o output
sai genérico. O impeccable é uma skill de Claude Code que resolve isso trocando descrição por escolha:
ele não te pede adjetivo, ele te mostra opção.

| O que a aula ia ensinar como técnica | O que o impeccable faz sozinho |
|---|---|
| nomear a família estética em vez de dizer "moderno" | catálogo externo de mundos visuais revisados, cada um com nome |
| impedir o modelo de pegar o favorito dele | `concept-seed.mjs` **sorteia** a direção |
| abrir leque e escolher em vez de descrever | decision page servida no browser local, com cards de tese, paleta, primeiro viewport e risco honesto |
| revisar com olhar novo | um revisor spawnado sem herdar a conversa (linha 105) |
| painel de ajuste sobre a própria página | o `live` mode, com variantes por elemento e troca a quente |

A frase da aula: **o modelo não tem gosto ruim, ele tem média. O impeccable tira a escolha da média e devolve pra você em forma de card.**

## Por que existe o sorteio

Porque sem dado, dez pessoas com dez negócios diferentes recebem a mesma página. A razão está na
própria doc, linha 39:

> *"The script assigns which structure gets built; your top-ranked structure is what every run would
> ship, so the dice come from outside."*

Traduzindo: a opção que o modelo põe em primeiro lugar é a mesma que ele poria em todas as rodadas, pra
todo mundo. O primeiro lugar dele é a média, então o dado vem de fora. São dois sorteios distintos: um
de **estrutura** (`--scope surface`, a linha 39 acima) e um de **direção visual** (`--scope direction`,
linha 46, que chama o dado de *"the mechanism that keeps every run from converging on the category
default"* e diz que esse passo não tem substituto nem condição de pulo). Na aula o sorteio aparece uma
vez, no bloco 4, na máquina do BJ, com os insumos de um voluntário. É ensino, não entregável.

## `init`: o negócio da pessoa entra aqui

Este é o passo que faz dez páginas ficarem diferentes umas das outras. Não é o sorteio, é o `init`. Na
aba Code do Claude Desktop, digite:

```text
/impeccable init
```

Ele olha a pasta e depois **pergunta**. Responda com o negócio de verdade: quem é o cliente na situação
real dele, o que o seu serviço faz de diferente (na sua frase, não na do setor), e o que precisa ser
preservado (nome, logo, os hex da marca se você souber, prova que você já tem). O resultado é um
`PRODUCT.md` na pasta, que é verdade de produto e não de design: o `init` **não pergunta cor, fonte nem
estilo, de propósito**. A parte visual vem depois.

Gate do bloco 3: **abra o `PRODUCT.md` e leia.** Se ele descreve um negócio genérico em vez do seu, a
entrevista foi respondida no piloto automático e a página vai sair genérica junto.

## A regra mais importante deste arquivo: recuse o `/impeccable document`

Quando o `init` terminar, ele sugere a próxima ação. Uma das sugestões é, literalmente
(`reference/init.md`, linha 121):

> *"Existing coherent interface without DESIGN.md: `/impeccable document` if the user wants the
> incumbent system recorded independently of a new build."*

O nosso template é exatamente esse caso: mundo coerente no código e nenhum `DESIGN.md`. Então ele
**vai** sugerir, pra dez pessoas, no mesmo minuto. **Recuse.** Cole isto no chat:

```text
Não, obrigado. Sem DESIGN.md agora. Segue com o refinamento em cima do mundo que já está no index.html.
```

**Por que recusar, se `document` parece inofensivo.** É inofensivo pro sorteio: `DESIGN.md` não reabre
torneio nenhum, até firma a herança. O dano é outro, e a doc nomeia na linha 73:

> *"a rulebook written before the build gets defended against reality instead of describing it"*

Um `DESIGN.md` gerado agora descreve o **template genérico**, que é o ponto de partida que você vai
começar a dobrar pra sua marca dez minutos depois. Você passaria o bloco 5 brigando com um documento
que descreve de onde você saiu. É um "não" de dez segundos que economiza vinte minutos.
**`DESIGN.md` se escreve no fim, a partir do que foi construído** (linha 107), e nesta aula ele é
**dever de casa**, não etapa.

## Quando pedir `redesign`, e quando não pedir

O template nasce com mundo visual comprometido e **sem** `DESIGN.md`, de propósito: é isso que faz o
impeccable herdar em vez de abrir torneio. Linha 10, *"A missing DESIGN.md does not erase a coherent
identity already present in code"*; linha 14, *"A section, component, feature, or state inside an
established surface inherits that surface"*; e a linha 31 manda **não** rodar torneio numa extensão.

| Situação | O que pedir | O que acontece |
|---|---|---|
| ajustar hero, prova, formulário, cores, fonte, espaçamento | pedido normal, uma seção por vez | herda o mundo do template e dobra pra sua marca. **Este é o caminho de todos na aula** |
| o mundo do template não serve pra sua marca de jeito nenhum | `redesign` | roda o torneio inteiro: sorteio, decision page, escolha, build comprometido, revisão. Caro em tempo e em cota |

**Não peça `redesign` no ao vivo.** Não porque é ruim, e sim porque é o caminho caro: quem secar a cota
no minuto 80 termina sem página, o pior desfecho possível. Mundo próprio é dever de casa, com a página
já no ar. E **cuidado com o pedido que vira `redesign` sem você querer**: "refaz do zero", "não gostei
de nada disso", "quero outra identidade" abrem torneio. Se o que você quer é ajuste, diga qual: "mexe
**só** na seção de prova, mantém o resto".

## Os comandos que valem pra esta LP

Regra de condução: **uma dimensão por rodada, uma seção por vez.** Pedido com vinte itens junto vira vinte itens meia-boca.

| Comando | Pra que serve aqui | O que esperar |
|---|---|---|
| `/impeccable typeset` | hierarquia de tipografia, tamanho de headline, troca de fonte | muda o arquivo |
| `/impeccable layout` | espaçamento, ritmo, o que é grande e o que é pequeno | muda o arquivo |
| `/impeccable colorize` | cor com estratégia, em cima dos tokens `--ink` e `--signal` | muda o arquivo |
| `/impeccable bolder` | quando a página ficou correta e sem graça | muda o arquivo, e é o que mais reescreve |
| `/impeccable live` | clicar no elemento no browser e escolher entre variantes | muda o arquivo, **e injeta script. Veja o gate abaixo** |
| `/impeccable critique` | revisão de UX com achados | **não muda nada**, devolve lista |
| `/impeccable audit` | acessibilidade, performance, responsivo | **não muda nada**, devolve lista |

Se você rodar `critique` ou `audit` e a página continuar igual, não quebrou nada: os dois são leitura,
não conserto. **A linha que vai junto de todo pedido visual.** Os comandos de refino reescrevem componente. Linha 89,
literal: *"nav, buttons, inputs, and links are rebuilt in the form's vocabulary"*, ou seja, o formulário
pode ser reescrito numa rodada de estética. Cole isto no fim de **todo** pedido de `typeset`, `layout`,
`colorize`, `bolder` e de qualquer ajuste visual, e depois confira o diff:

```text
Não mexa nos blocos marcados INTOCÁVEL. Mantenha o prefers-reduced-motion, e headline e formulário sem animação de entrada.
```

## Os dois gotchas, escritos literalmente

**1. `npx impeccable install --help` ignora o `--help` e roda o instalador.** Quem é cauteloso e pede
ajuda antes de instalar é exatamente quem vai ser mordido. Não invente flag: cole a linha que veio no
pré-work, exatamente como veio.

**2. O detector não imprime nada quando está limpo.** Saída vazia é ambígua: pode ser "passou" ou "não
rodou no arquivo certo".

| Sintoma | Causa | Como confirmar |
|---|---|---|
| detector rodou e não imprimiu nada | pode estar limpo, pode não ter lido o arquivo | rode com `--json`: limpo imprime `[]` |
| imprimiu `[]` e mesmo assim você duvida | `[]` sai também quando o arquivo não existe | procure a linha `Warning: cannot access <arquivo>` acima do `[]`, e confirme rodando num arquivo que você sabe que está sujo |
| você quer se guiar pelo código de saída | ele separa sujo de limpo, mas **não** separa limpo de "arquivo não existe" | sujo sai com `2`; limpo e arquivo inexistente saem os dois com `0` |

Os três comportamentos foram verificados rodando o detector, não deduzidos. O arquivo sujo de referência: salve como `sujo.html` e peça pro Claude rodar o detector nele.

```html
<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
<style>body { font-family: Inter, sans-serif; }</style>
</head><body><h1>teste</h1></body></html>
```

Tem que sair `2 anti-patterns found`, os dois `overused-font` por causa da Inter. Se sair vazio nesse
arquivo, o detector não está lendo o que você acha que ele está lendo.

Sorte de arquitetura: as regras de fonte e cor operam em **CSS declarativo**, e o nosso template é CSS
puro num arquivo só, então o detector roda com força total aqui. Em projeto com Tailwind, bem menos.

> **Não decore caminho de script.** Peça no chat: *"roda o detector do impeccable no index.html e me
> mostra a saída"*. O Claude sabe onde a skill está na sua máquina. Na do BJ ela está em
> `~/.claude/skills/impeccable/`. [CONFIRMAR: se em máquina limpa o `npx impeccable install` grava no
> mesmo lugar ou dentro da pasta do projeto. Ensaio de 13/08.]

## O gate do inject do `live`, e ele é o único que não avisa

O `live` mode sobe um servidor auxiliar na porta **8400** e **escreve um `<script>` dentro do seu
`index.html`** apontando pra `http://localhost:8400`. É assim que o picker aparece no browser. Se esse
arquivo for pro ar com o inject dentro, a página **não quebra**, **não aparece erro nenhum** na tela nem
no console do visitante, e fica uma referência a `localhost` no código-fonte de uma página que vai
receber tráfego pago. Falha calada é o padrão aqui, então o gate vem antes de todo `vercel --prod`.

**Passo 1, encerrar o live direito.** Peça no chat:

```text
Encerra o live mode do impeccable e remove o inject do index.html.
```

Por baixo quem faz isso é o `live-server.mjs stop`, que roda o `live-inject.mjs --remove`. Atenção:
existe a variante `stop --keep-inject`, que **deixa o script no arquivo de propósito** pra reiniciar
rápido. Não use essa antes de publicar.

**Passo 2, conferir com os próprios olhos.** Peça no chat:

```text
Procura no index.html por "8400" e por "impeccable-" e me diz exatamente o que achou.
```

Não é só o `8400`. O encerramento também pode deixar para trás blocos `impeccable-variants-start` e
`impeccable-carbonize-start`, e esses não têm `8400` dentro. As duas buscas têm que voltar vazias. Esse
gate está escrito em três lugares de propósito (aqui, no `antes-de-publicar.md` e falado na aula): não
é redundância, é a única falha nova que a virada pro Claude Code introduziu.

## O que fica de dever de casa

- `DESIGN.md`, com `/impeccable document`, depois que a página estiver fechada e no ar (linha 107).
- `redesign` com torneio, se o mundo do template não for a sua cara.
- O ciclo completo de revisão, que é bonito e é caro. Linha 71: *"a page that looks complete with the
  FINISH line undischarged is not done, it is abandoned at the finish line."* Rodar pela metade é pior
  que não rodar.

[CONFIRMAR: quanto tempo o fluxo `new-work` completo leva ponta a ponta. Fica em aberto até o ensaio
de 13/08; o gatilho combinado é ~35 minutos sozinho.]
