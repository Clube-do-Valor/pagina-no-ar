---
name: pagina-no-ar
description: "Guia completo pra colocar no ar a página de inscrição do webinário, da fundação até o lead gravado no banco. Cobre público e promessa, protótipo no Claude Design, handoff pro Claude Code com crítica do impeccable, os campos do formulário que viram o banco, domínio próprio, deploy no Vercel com Supabase, a verificação de segurança e a validação do que subiu. Use quando alguém quiser criar, desenhar, revisar, publicar, subir, deployar ou hospedar a LP de inscrição, montar o formulário de captura, ligar a página ao Supabase ou a um webhook, apontar um domínio próprio, ou mandar o lead pro WhatsApp."
---

# Página no ar

Seis fases, seis portões. Da fundação até um lead real no banco.

**O portão é o que faz isso ser método e não lista.** Cada um só abre com uma prova
mostrada na tela. Ninguém passa de fase porque achou que estava bom, e ninguém passa
porque você disse que funcionou.

## Antes de tudo: onde moram os arquivos desta skill

O `cwd` é a pasta do projeto **da pessoa**. Os arquivos citados abaixo (`assets/`,
`references/`, `scripts/`) **não estão lá**: eles moram no diretório desta skill, que
fica no cache do plugin e muda de caminho a cada atualização.

Resolva o diretório **uma vez**, no começo da sessão, rodando isto:

```bash
S="${CLAUDE_PLUGIN_ROOT:+$CLAUDE_PLUGIN_ROOT/skills/pagina-no-ar}"
[ -f "$S/scripts/check_page.py" ] || S="$(ls -d "$HOME"/.claude/plugins/cache/*/pagina-no-ar/*/skills/pagina-no-ar 2>/dev/null | tail -1)"
[ -f "$S/scripts/check_page.py" ] && echo "ACHEI: $S" || echo 'NAO ACHEI a skill'
```

Se imprimir `NAO ACHEI`, use o **diretório-base da skill que o runtime mostrou** ao
carregar este arquivo.

> **A regra que faz isso valer, e ela não é estilo.** Guarde o caminho que apareceu e
> **escreva ele literal, por extenso, em todo comando daqui pra frente.** Variável de
> shell **não sobrevive de um comando pro outro**, então `$S` num comando novo chega
> vazio e o caminho vira `/scripts/check_page.py`, que não existe. Daqui em diante,
> `<SKILL>` nos blocos abaixo significa **substitua pelo caminho por extenso**, nunca
> cole o sinal de menor.

E a que fecha o buraco de comportamento: **nunca gere do zero o que era pra ser
copiado.** Se o `cp` falhar, resolva o caminho de novo. Um `index.html` improvisado no
lugar do `assets/index-template.html` perde todas as guardas deste material de uma vez,
e perde calado.

## A regra que governa o fluxo inteiro

> **Na direção visual, liberdade total. Na camada de dado e no deploy, passo literal.**
> O bloco testado é colado, não gerado.

Isso não é preguiça de um lado nem rigidez do outro. Na direção visual o taste de
mercado da pessoa vale mais que qualquer regra que eu escreva. Na camada de dado errar
não dá aviso: dá lead perdido em silêncio, e o pior deles é a tela dizendo "inscrição
confirmada" pra um envio que não aconteceu.

**E a ordem visual antes de dado não é preferência, é invariante.** A fase de design
**reescreve o formulário inteiro**, então qualquer fio de dado plugado antes disso corre
risco de ser desfeito numa rodada de estética, sem ninguém ver.

## As seis fases

### FASE 1 · Fundação, o porquê antes de qualquer tela

Nada de HTML aqui. Esta fase é **entrevista**, e o produto dela é uma spec de 15 linhas.

Use `superpowers:brainstorming` pra conduzir. É exatamente o que ele faz: explora
intenção e requisito antes de implementação. Se ele não estiver instalado, conduza a
entrevista à mão, com as perguntas de `references/fundacao.md`.

Sete coisas saem daqui, e o detalhe de cada uma está em `references/fundacao.md`:

1. quem é o público, na situação real dele
2. o objetivo da página, e é **uma ação só**
3. a promessa, na frase da pessoa e não na do setor
4. o gancho: como a primeira tela chama atenção
5. identidade visual: logo, e os hex se ela tiver
6. **3 páginas em que ela mesma se inscreveu**, com o rótulo do que gostou em cada
7. quais perguntas o lead responde, **e o que a página devolve por cada campo**

O item 6 é o que faz dez páginas ficarem diferentes umas das outras, e o item 7 é o que
vira o banco na Fase 4. Nenhum dos dois é opcional.

**PORTÃO 1.** Devolva a spec em no máximo 15 linhas: as seções na ordem, os campos do
formulário, o texto do botão, e **o que acontece depois que a pessoa envia**. Espere o
"pode ir".

Quem não souber responder o que acontece depois do envio ainda não tem página. Isso
aparece em segundos e é o melhor instrumento de triagem que existe.

### FASE 2 · Prototipação, o desenho nasce no Claude Design

O desenho é feito **no Claude Design**, no navegador, não no código. Uma seção por
rodada, começando pelo hero, porque paleta, tipografia e clima do resto derivam dele.

Ver `references/claude-design.md`, que traz o que é um `.dc.html`, como tirar o arquivo
de lá, e as sete armadilhas do handoff. **Todas as sete falham caladas**, com a página
parecendo pronta na tela.

**PORTÃO 2.** O hero está aprovado **e** o arquivo do desenho está no disco da pessoa.
As duas metades, porque desenho aprovado que não saiu da prancheta não é entregável.

### FASE 3 · Handoff pro Claude Code, e a primeira crítica

O desenho vira página de verdade aqui. **Reconstrua em cima do `assets/index-template.html`**,
que já traz o formulário endurecido, e trate o `.dc.html` como **especificação e fonte de
copy**, não como arquivo de publicação. O porquê está em `references/claude-design.md`,
e é medido: são 307 KB de runtime pra rodar 15 KB de lógica.

Depois de reconstruir, uma rodada de crítica:

```text
/impeccable audit index.html
```
```text
/impeccable critique index.html
```

**Rode nos dois no ARQUIVO, nunca na URL publicada.** Alvo URL sem o puppeteer
instalado devolve `[]` e sai com código 0, que é exatamente a assinatura de "limpo": um
falso-limpo, com o erro escondido no stderr. Detalhe em `references/impeccable-na-pratica.md`.

Quando os achados voltarem, use `superpowers:receiving-code-review`. Uma lista de doze
achados não se implementa de olhos fechados: cada um se verifica antes de virar mudança.
Concordar por educação com um achado errado piora a página.

Corrija **em um lote** e confira o diff.

**PORTÃO 3.** Os achados foram **corrigidos**, não só lidos. E depois de cada rodada
visual você reinstala duas guardas:

- `prefers-reduced-motion` respeitado
- **headline e formulário sem animação de entrada** (a página recebe tráfego pago, e
  animação de entrada atrasa conteúdo e derruba conversão)

### FASE 4 · As três definições antes de subir

Três decisões, e nenhuma delas é código. Elas travam o que vem depois.

**1. Os campos do formulário, porque as perguntas SÃO o banco.** A regra que resolve a
discussão inteira: **campo extra só entra se a página devolver alguma coisa por ele.**
Formulário de inscrição não é cadastro. Ver `references/formulario-e-dados.md`.

**2. O domínio próprio.** Ver `references/dominio.md`. Aviso de escopo que precisa ser
dito na hora: **comprar domínio não cabe numa aula.** O registro sai em 5 minutos, mas a
edição de DNS só destrava depois do pagamento cair, a propagação leva até 1 hora, e o
TLS vem só depois disso. A URL `.vercel.app` já é entregável, e ela é permanente.

**3. Pra onde o lead vai depois do botão.** O default é click-to-WhatsApp, que funciona
com zero conta em qualquer outra ferramenta. Webhook, bot e ManyChat estão em
`references/pos-captura.md`.

**PORTÃO 4.** As três estão escritas, não combinadas de cabeça. Se a pessoa não
consegue dizer os campos em voz alta, a Fase 5 vai criar a tabela errada.

### FASE 5 · Deploy: banco, Vercel e segurança

Aqui o passo é literal. **Duas mudanças de plataforma do Supabase em 2026 invalidaram
todo snippet decorado, inclusive o meu.** Cole o SQL de `references/supabase.md`
**inteiro, sem adaptar**.

**Avise antes que vai falhar.** O primeiro envio não chega em 100% das ocorrências
filmadas. Isso é esperado, não é vergonha, e a frase de conserto está em
`references/quando-quebra.md`. Rode o `curl` de pré-flight você mesmo e leia o status:
não peça pra pessoa fazer gesto que você consegue executar.

Depois o deploy, com `references/deploy.md`. `vercel --prod`. A URL de produção é sempre
a mesma, então ela vai pro grupo com todas as letras.

E a verificação de segurança, que é `references/seguranca.md` mais o script:

```bash
python3 <SKILL>/scripts/check_page.py index.html
```

Se der `No such file`, o `<SKILL>` não foi substituído pelo caminho por extenso. Resolva
de novo pela primeira seção. Não pule o portão por causa disso.

> **Não mande ninguém rodar `/security-review` aqui.** Ele exige repositório git, e a
> pasta da pessoa não é um. Fora de um repo ele não faz revisão nenhuma: devolve um
> recado dizendo que precisa de git e nunca carrega o prompt de revisão. `git init`
> também não resolve, e mesmo com git ele audita **diff** e foi instruído a ignorar o
> que já existe, então nunca olharia um `index.html` pronto. O porquê medido está em
> `references/seguranca.md`.

**PORTÃO 5.** Um lead de teste **aparecendo no Table Editor**. A mensagem de obrigado
não prova nada: ela aparece igual quando o envio não saiu.

Mais os dois que fecham de verdade:

- **grep por `8400` volta vazio** (o inject do `live` mode não dá erro nenhum no ar)
- **`Ctrl+U` na página publicada** e a chave que aparece começa com `sb_publishable_`

### FASE 6 · Validação visual do que subiu

Não é olhar o arquivo local. É olhar **o que está no ar**.

Use `superpowers:verification-before-completion` como disciplina desta fase: evidência
antes de afirmação, sempre. Três coisas, e nenhuma delas é opinião:

1. a URL de produção aberta **em aba anônima** (a sua tem cache e mente)
2. **no celular de verdade**, não no simulador de tamanho do navegador
3. **um lead enviado pela página no ar**, e você abrindo o banco pra ver a linha

Feche com `references/antes-de-publicar.md`, que cobre o que o script não vê: um fold,
uma mensagem, data visível sem rolar.

**PORTÃO 6.** Você **mostrou** a tela. Dizer que funcionou não vale.

## Regras que valem o fluxo inteiro

**Falha calada é o padrão desta pilha.** `fetch` não estoura erro em 401. Chave errada
não gera sintoma. Policy faltando devolve 401 com um JSON que ninguém lê. Então:
nenhum passo fecha com "funcionou", só com **uma tela mostrada**.

**A chave publicável do Supabase é pública de propósito**, e isso está certo, porque
quem segura o banco é a RLS. Variável de ambiente **não esconde nada** em página
estática: o valor é embutido no HTML e continua visível no `Ctrl+U`. Nunca "conserte"
isso colando uma chave `service_role`.

**Os blocos marcados INTOCÁVEL no template** são o formulário e a configuração. Se uma
rodada de estética os reescrever, restaure. `check_page.py` detecta.

**Sem inventar.** Não escreva número, prova, depoimento ou claim que a pessoa não deu.
Marque `[FALTA: ...]`, que é a convenção que ela já usa na Função 4.

**Quando quebrar, não chute.** Use `superpowers:systematic-debugging` e o catálogo de
sintomas de `references/quando-quebra.md`, que já tem a causa e a frase de conserto de
cada falha conhecida desta pilha.

**A copy da página não é assunto desta skill.** A Fase 1 produz a fundação (promessa,
gancho, público), e o texto das seções vem pronto da Função 4 da skill do desafio. Se a
pessoa chegar sem a copy, a Fase 1 é onde isso aparece.

## Arquivos

Todos relativos ao diretório da skill (o `<SKILL>` da primeira seção), nunca ao `cwd` da pessoa.

| Arquivo | Fase | Quando ler |
|---|---|---|
| `references/fundacao.md` | 1 | conduzindo a entrevista e fechando a spec |
| `references/anatomia-da-lp.md` | 1 e 3 | montando a estrutura e a ordem das seções |
| `references/claude-design.md` | 2 e 3 | prototipando, e antes de trazer o arquivo pro código |
| `references/impeccable-na-pratica.md` | 3 | antes de qualquer trabalho visual |
| `references/formulario-e-dados.md` | 4 | decidindo campos, consentimento, modelo de dado |
| `references/dominio.md` | 4 | apontando domínio próprio, ou decidindo não apontar |
| `references/pos-captura.md` | 4 e 5 | mandando o lead pro WhatsApp ou pra outro destino |
| `references/supabase.md` | 5 | criando a tabela e ligando o formulário |
| `references/deploy.md` | 5 | publicando, e sempre que a URL não abrir |
| `references/seguranca.md` | 5 | na verificação de segurança, sempre |
| `references/antes-de-publicar.md` | 5 e 6 | nos Portões 5 e 6 |
| `references/quando-quebra.md` | 3 a 6 | qualquer coisa que não funcionou |
| `assets/index-template.html` | 3 | ponto de partida obrigatório, nunca gere do zero |
| `assets/impeccable-live-config.json` | 3 | copiar pra `.impeccable/live/config.json` |
| `scripts/check_page.py` | 5 | Portão 5 |
| `scripts/probe_page.mjs` | 6 | verificação profunda, opcional: roda o formulário e mede contraste, dobra e alinhamento no Chrome headless. Precisa de Chrome instalado, então é ferramenta de quem construiu, não do participante |
