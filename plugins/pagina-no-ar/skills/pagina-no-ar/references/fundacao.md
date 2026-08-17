# Fundação: o porquê, antes de qualquer tela

Leia na **Fase 1**. Esta é a única fase sem uma linha de HTML, e ela é a que faz dez
páginas ficarem diferentes umas das outras.

O produto desta fase é **uma spec de 15 linhas aprovada**. Não é um documento, não é um
briefing bonito: são quinze linhas que a pessoa lê e diz "pode ir".

---

## Por que a entrevista vem antes, e por que ela é curta

O gargalo de quem não é designer **não é gosto, é vocabulário.** A pessoa reconhece na
hora uma página que passa confiança, só não sabe nomear em palavra de designer o que faz
ela passar confiança. Aí o pedido sai genérico e a página sai genérica.

A saída não é ensinar vocabulário de design em uma hora. É **substituir descrição por
escolha**: em vez de pedir adjetivo ("moderno", "clean", "premium"), pedir referência e
decisão.

E tem um giro que muda tudo pra quem é médico, advogado, consultor ou dono de clínica:

> O teu taste não é taste de designer, é **taste de mercado**. Você sabe o que faz o teu
> cliente confiar em você. Aqui isso vale mais que saber o nome de uma fonte.

Consequência prática: **a referência dessa pessoa não é Dribbble.** Página premiada em
portfólio costuma converter mal, porque otimiza beleza e não decisão.

---

## Conduza com o brainstorming, não com um formulário

Use `superpowers:brainstorming`. Ele existe exatamente pra isso: explorar intenção e
requisito antes de qualquer implementação. Sem ele, conduza à mão com as sete perguntas
abaixo.

**Peça tudo de uma rodada, numerado.** Se a pessoa já disse algo, não pergunte de novo.
E não aceite resposta de piloto automático: se vier genérico, devolva a pergunta com um
exemplo do negócio dela dentro.

---

## As sete perguntas, e o que cada resposta trava

### 1. Quem é o público, na situação real dele

Não é "empresários de 30 a 50 anos". É a **situação**: o que essa pessoa está tentando
resolver na terça-feira à noite quando encontra a sua página.

| Resposta ruim | Resposta que serve |
|---|---|
| "investidores" | "quem tem 500 mil parado na poupança e sabe que está perdendo pra inflação, mas tem medo de errar sozinho" |
| "mulheres que querem emagrecer" | "quem já fez três dietas, perdeu peso nas três e recuperou nas três" |

O teste: **a resposta nomeia um problema que a pessoa reconheceria em si mesma?** Se não,
volte.

### 2. O objetivo da página, e é UMA ação só

Uma página, uma ação. Se a resposta tiver "e também", corte o "e também".

Inscrever no webinário **ou** baixar o material **ou** agendar conversa. Duas ações
competindo derrubam as duas, porque a página deixa de ter um assunto.

### 3. A promessa, na frase dela e não na do setor

Esta é a pergunta que mais recebe resposta de catálogo. O que você quer é a frase que a
pessoa usa quando explica o serviço pro cunhado, não a que está no site do concorrente.

Pergunte assim: **"o que a pessoa vai saber fazer, ou vai entender, depois de sair desse
webinário, que ela não sabia antes?"**

E a regra dura: **sem inventar.** Se a promessa depende de um número, de um caso ou de um
depoimento que a pessoa não deu, marque `[FALTA: ...]` e siga. Nunca escreva prova que
não existe.

### 4. O gancho: como a primeira tela chama atenção

A primeira tela tem uma tarefa só: fazer a pessoa continuar. Pergunte qual é a coisa que
o público dela **já acredita e está errado**, ou o que ele **já tentou e não funcionou**.
Gancho bom quase sempre nasce de uma dessas duas.

### 5. Identidade visual: logo e os hex

Pergunte três coisas, nesta ordem, e aceite "não tenho" como resposta:

1. você tem logo em arquivo? (PNG com fundo transparente ou SVG)
2. você sabe as cores da sua marca em código hexadecimal?
3. tem alguma coisa que **não pode** mudar? (nome, jeito de escrever, uma cor específica)

Se ela não souber os hex, **não invente paleta de marca**. O template já nasce com um
mundo visual coerente, e a Fase 2 dobra ele pro que a pessoa quiser. Chutar hex é criar
uma marca falsa que vai ter que ser desfeita depois.

> **Armadilha de logo:** logo azul escuro desaparece em fundo escuro. Se for o caso, ou
> pede a versão clara, ou resolve com `filter: brightness(0) invert(1)`. Não fica
> tentando "clarear" a cor no CSS.

### 6. As 3 páginas em que ela mesma se inscreveu

**Este é o item que mais paga, e o rótulo é o que faz funcionar.**

Não é "me manda 3 páginas bonitas". É:

> Me manda **3 páginas de webinário em que você mesmo se inscreveu**, e embaixo de cada
> uma escreve **qual parte** te fez continuar. "Esse topo", "essa parte de depoimento",
> "esse formulário".

Três motivos pra ser assim:

- página que **fez ela se inscrever** é informação sobre conversão, não sobre estética
- o **rótulo** transforma "gostei" em instrução acionável
- três é o número que dá pra cruzar. Uma é gosto, dez é indecisão

Se a pessoa chegar sem os prints, essa é a hora de descobrir, não no minuto 60. E dá pra
resolver na hora: pede pra ela abrir o e-mail e procurar "webinário" ou "aula gratuita".

### 7. Quais perguntas o lead responde, e o que ele ganha por cada campo

**As perguntas SÃO o banco.** O que for decidido aqui é literalmente o `create table` da
Fase 5, então mudar depois custa migração.

A regra que resolve a discussão inteira:

> **Campo extra só entra se a página DEVOLVER alguma coisa por ele.**

Formulário de inscrição não é cadastro. Cada campo a mais é uma pessoa a menos
terminando, e a pergunta que autoriza o campo é sempre a mesma: *o que a pessoa recebe
de volta por ter respondido isso?* Se a resposta for "nada, é pro meu CRM", o campo não
entra.

O detalhamento campo por campo, com o veredito de cada um, está em
`formulario-e-dados.md`. O que precisa ficar decidido **aqui** é só isto:

- nome, e-mail e consentimento entram sempre
- telefone entra **se a jornada continuar no WhatsApp**
- qualquer outro campo precisa da contrapartida dita em voz alta

A regra irmã, e ela é do mesmo par: **o botão nomeia o que entrega, em vez de dizer
"enviar".** Se o botão só consegue dizer "enviar", é sinal de que a página está pedindo
sem devolver.

---

## Referências de inspiração: como usar sem virar cópia

O que a pessoa manda são **três páginas com rótulo**. O que você faz com isso:

| O que ela disse | O que isso significa em decisão |
|---|---|
| "gostei desse topo" | a estrutura do hero: o que aparece primeiro, quanto texto, se tem foto |
| "gostei desse depoimento" | o formato da prova: vídeo, print, nome e cargo, número |
| "gostei desse formulário" | quantos campos, onde ele fica, se é na primeira tela |
| "gostei do visual" | isso é resposta vaga. Pergunte: a cor? o espaço em branco? a fonte grande? |

E o que **não** fazer: copiar seção por seção de uma referência só. O valor das três é o
cruzamento. Se as três têm depoimento em vídeo logo depois do topo, isso é um padrão do
mercado dela e vale seguir. Se só uma tem, é gosto de quem fez aquela página.

> **Cuidado com a referência que é do concorrente.** Se a pessoa mandar a página de um
> concorrente direto, use a estrutura e **nunca** a copy, o posicionamento ou os números.

---

## O PORTÃO 1, e por que 15 linhas

Devolva, em no máximo 15 linhas:

1. as seções da página, na ordem
2. os campos do formulário
3. o texto do botão
4. **o que acontece depois que a pessoa envia**

Espere o "pode ir".

**Por que 15 linhas e não um documento:** spec longa não é lida, é aprovada por
cansaço. Quinze linhas a pessoa lê inteiro e discorda de verdade, que é o ponto.

**Por que o item 4 é o mais importante:** quem não sabe responder o que acontece depois
do envio ainda não tem página, tem só uma vontade de página. Isso aparece em segundos e
é o melhor instrumento de triagem que existe. As opções estão em `pos-captura.md`, e a
resposta pode ser simplesmente "cai no meu WhatsApp".

---

## O teto honesto, e ele vai dito nesta fase

Combine o acabamento agora, não no fim:

> Você vai sair com uma página que **funciona e já é a sua cara**. Você não vai sair com
> uma página de agência. O refinamento fino é trabalho de outra sessão.

Combinar o teto na Fase 1 custa trinta segundos. Descobrir o teto na Fase 6 custa a
sensação de que a entrega falhou, quando ela não falhou.
