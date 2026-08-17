# Claude Design: prototipar e trazer pro código

Leia na **Fase 2** (o desenho) e na **Fase 3** (o handoff). Tudo neste arquivo foi medido
num caso real que foi do Claude Design até produção, não deduzido.

**A frase que resolve a confusão das duas ferramentas:** Claude Design é onde você
desenha, Claude Code é onde você constrói e publica. Uma é prancheta, a outra é oficina.

---

## Fase 2 · Desenhar

O desenho é feito no navegador, em `claude.ai/design`. Nada de código nesta fase.

**Três regras de condução, e as três economizam rodada:**

1. **Comece pelo hero.** Paleta, tipografia e clima do resto derivam dele. Aprovar o
   hero primeiro evita refazer cinco seções quando a cor mudar.
2. **Uma seção por rodada, uma dimensão por vez.** Pedido com vinte itens junto vira
   vinte itens meia-boca.
3. **Traga as três referências com rótulo** da Fase 1 pra dentro do pedido. "Quero o
   topo parecido com este, pelo motivo X" funciona. "Quero moderno" não.

---

## O que é um arquivo `.dc.html`

É um HTML **único e legível**, sem build e sem import. Por dentro:

| Parte | Onde mora |
|---|---|
| o desenho | dentro de uma tag `<x-dc>` no `<body>` |
| o CSS | numa única tag `<style>` dentro de `<helmet>` |
| a lógica | num `<script type="text/x-dc" data-dc-script>` no fim, numa classe que estende `DCLogic` |
| os dados no template | interpolação de chaves duplas, mais duas tags próprias, `sc-if` e `sc-for` |

Ele **não roda sozinho**: precisa do `support.js` que vem com ele, mais React e ReactDOM
que **não estão no projeto** e são baixados de fora.

---

## Por que ele NÃO vai pra produção como está, com o número

Medido num arquivo real de 100,3 KB:

| Peça | Tamanho |
|---|---|
| markup | 62,2 KB |
| CSS | 15,0 KB |
| **lógica** | **15,3 KB** (sem comentários) |
| `support.js` | 67,5 KB |
| React + ReactDOM | 139,2 KB, e vêm de fora do projeto |
| **runtime total pra abrir a prancheta fora do editor** | **307,0 KB** |

**307 KB de código pra rodar 15 KB de lógica.** E tem um custo pior que peso: a página só
existe depois do JavaScript rodar, então prévia de link e busca ficam cegas. O markup é
estático e não precisa de React nenhum.

---

## Fase 3 · Como tirar o desenho de lá

Duas coisas, e a segunda é uma armadilha real.

**A ferramenta é o `DesignSync`, método `get_file`.** Provado: um `.dc.html` de 102.662
bytes voltou inteiro, `truncated: false`, byte a byte idêntico à cópia local. O teto é
**256 KB por arquivo**, então um `.dc.html` de 100 KB passa folgado. O `list_files`
entrega tudo, inclusive o `support.js` e as fotos.

> **ARMADILHA: o `list_projects` não mostra o projeto do desenho.** Ele só devolve
> projetos do tipo *design system*, e o projeto onde o desenho mora é do tipo comum.
> Então ele **não aparece na lista**, mesmo com permissão de edição. O `get_project`, o
> `list_files` e o `get_file` funcionam nele, mas só se você já tiver o **UUID em mãos**,
> e o UUID vem da URL do `claude.ai/design`. Peça a URL pra pessoa; não fique procurando
> na lista.

**E o `DesignSync` só serve pra ler nesse sentido.** Os métodos de escrita dele sobem
biblioteca de componente **pra dentro** do Claude Design, e só em projeto do tipo design
system. Não é o caminho de publicar a página.

---

## A decisão da Fase 3: reconstruir, não congelar

Existem dois caminhos, e o certo depende de quem está na cadeira.

| Caminho | O que é | Custo |
|---|---|---|
| **Congelar** | abre a página com o runtime, espera montar e serializa o DOM. **Não é gerar HTML parecido, é fotografar o DOM que o runtime produz**, então o desenho não pode divergir da prancheta | terminal com dois processos vivos, puppeteer, Chrome de caminho fixo, Python com PIL, e seis abortos de build que só quem escreveu sabe diagnosticar |
| **Reconstruir** | trata o `.dc.html` como **especificação e fonte de copy**, e refaz em cima do `assets/index-template.html`, que já traz o formulário endurecido | uma rodada de trabalho visual, e o resultado é arquivo único sem build |

**Pra quem tem duas horas e nunca abriu um terminal: reconstruir.** Congelar é
tecnicamente melhor e é o caminho de quem vai manter a página por meses. Não é o caminho
de quem está aprendendo hoje.

O ganho de reconstruir sobre o template não é só simplicidade: o template já tem o
formulário com validação, honeypot, consentimento congelado e as guardas que avisam na
tela quando um `id` do contrato de dado desaparece. Refazer isso do zero em cima do
`.dc.html` é jogar fora tudo isso.

---

## As sete armadilhas do handoff, e TODAS falham caladas

Esta é a parte mais importante do arquivo. Em todas as sete, **a página parece pronta na
tela.**

### 1. `renderVals()` é a única ponte da classe pro template

Método da classe **não existe** pro `{{ }}`. Só o que o `renderVals()` devolve existe.
Um `onSubmit="{{ enviar }}"` com `enviar` fora do `renderVals()` resolve pra `undefined`,
o React não recebe handler nenhum e **o formulário inteiro fica morto sem um único erro
no console**: validação, honeypot, consentimento e o aviso de integração desligada
simplesmente não rodam.

**O que a pessoa vê:** preenche, clica em enviar, e nada acontece. Sem mensagem, sem erro.
O único freio que sobra é a validação nativa do navegador.

No runtime: `support.js` monta `vals = { ...userProps, ...this.logic.renderVals() || {} }`,
e a implementação base é `renderVals() { return {}; }`.

**Junto disso:** atributo que o CSS compara por valor precisa de **string**.
`data-erro="{{ bool }}"` vira `data-erro="true"`, e a regra `[data-erro="1"]` nunca casa.
Devolva `'1'` ou `''`.

### 2. Abrir com duplo clique engana

Em `file://` a página **monta**, as seções aparecem, e mesmo assim o formulário não liga.
A causa: o runtime relê o próprio documento com `fetch(location.href)`, e esse fetch é
bloqueado em `file://`.

**Servir por HTTP é obrigatório pra testar.** Um `python3 -m http.server` resolve.

### 3. O Claude Design escreve estilo INLINE, e inline vence folha de estilo

Um arquivo real tinha **369 atributos `style="`**. Qualquer regra que você acrescente pra
sobrescrever **precisa de `!important`**, senão ela é escrita, é lida pelo navegador, e
não acontece nada.

**Regra que fica:** ao sobrescrever qualquer coisa que o Claude Design gera, **meça o
valor computado depois**. Escrever a regra não é prova de que ela venceu. Isso pegou duas
vezes na mesma sessão.

### 4. As constantes de integração chegam ZERADAS em todo handoff

`SUPABASE_URL`, `SUPABASE_KEY` e o número do WhatsApp saem em branco **de propósito**.

O erro clássico é preencher no arquivo do desenho: o próximo export volta vazio, e uma
hora a página sobe sem canal, com todo botão de WhatsApp caindo numa âncora vazia.

**Preencha no lado do código, não na prancheta.** E se você automatizar isso, ancore a
busca na linha inteira e faça o processo **abortar** quando não achar, pra que renomear a
constante estoure na hora em vez de virar página muda no ar.

### 5. O `.dc.html` não tem `<title>` nem descrição

Quem monta isso no editor é o runtime, então a fonte não tem nenhum dos dois.

**O que a pessoa vê:** a aba do navegador mostra o endereço em vez de um nome, e colar o
link no WhatsApp ou no LinkedIn gera um card **sem título e sem descrição**. Numa página
que vai ser divulgada em grupo, isso é a primeira impressão inteira.

Escreva `<title>` e `<meta name="description">` na reconstrução. Não espere que venham.

### 6. Download de imagem do Claude Design pode vir truncado

Dois PNGs de logo vieram com **196.608 bytes cravados** (exatamente 192 KB), sem o chunk
final e com o último bloco de dados cortado.

**Tamanho que é potência exata de 2 é o sinal.** Confira o tamanho e abra a imagem antes
de usar. Uma imagem truncada às vezes até renderiza pela metade, o que é pior que não
renderizar.

### 7. Correção feita na prancheta volta atrás no próximo handoff

Qualquer conserto que você faça editando o `.dc.html` à mão **desaparece** quando a pessoa
mexer no desenho e exportar de novo.

**Consequência de processo:** decida onde cada tipo de mudança mora. Desenho e copy moram
na prancheta. Fiação, correção de mobile e integração moram no código. Misturar os dois
garante retrabalho silencioso.

---

## Se alguém for congelar mesmo assim: as três de bônus

Só valem pra quem escolher o caminho do congelamento.

1. **O runtime embrulha cada interpolação num `<span class="sc-interp">`.** Dentro de
   `<option>` isso é HTML inválido e o select chega quebrado. Desembrulhar é obrigatório.
2. **Ele converte valor pra texto**, então booleano vira a string `"true"`.
3. **As flags que escondem seções esperando animação congelam LIGADAS**, escondendo o
   conteúdo **pra sempre** pra quem não executa script, robô de busca incluído.

E a regra de processo que custou mais caro: **passo de build que dá pra esquecer é passo
que uma hora é esquecido.** Se o congelamento lê um artefato que outro passo gera, o
segundo passo tem que chamar o primeiro. Senão você troca o desenho, roda o congelamento,
e sai uma página **inteira, funcional, do tamanho certo, sem erro nenhum, com os textos
velhos.**

Corolário de diagnóstico: quando "a página não está conforme", **compare título por
título com a fonte** antes de investigar runtime, React ou seletor.
