---
name: pagina-no-ar
description: Coloca no ar a página de inscrição do webinário, do arquivo ao lead gravado. Use quando alguém quiser publicar, subir, deployar ou hospedar a LP de inscrição, criar o formulário de captura, ligar a página ao Supabase ou a um webhook, ou mandar o lead pro WhatsApp. NÃO escreve a copy da página: a copy vem pronta da Função 4 da skill do desafio, e esta skill só a coloca no ar.
---

# Página no ar

Do arquivo local até um lead real no banco, em duas horas, sem terminal e sem build.

**Esta skill não escreve copy.** Se a pessoa ainda não tem o texto da página, ela para
aqui e vai buscar na Função 4 da skill do desafio. Sem copy, não há o que publicar.

## Antes de tudo: onde moram os arquivos desta skill

O `cwd` é a pasta do projeto **da pessoa**. Os arquivos citados abaixo (`assets/`,
`references/`, `scripts/`) **não estão lá**: eles moram no diretório desta skill, que
fica no cache do plugin e muda de caminho a cada atualização.

Resolva o diretório uma vez, no começo da sessão, e use caminho absoluto daí em diante:

```bash
SKILL="${CLAUDE_PLUGIN_ROOT:-}"
[ -n "$SKILL" ] && SKILL="$SKILL/skills/pagina-no-ar"
[ -f "$SKILL/scripts/check_page.py" ] || SKILL="$(ls -d "$HOME"/.claude/plugins/cache/*/pagina-no-ar/*/skills/pagina-no-ar 2>/dev/null | tail -1)"
[ -f "$SKILL/scripts/check_page.py" ] && echo "SKILL=$SKILL" || echo 'NAO ACHEI a skill'
```

Se isso imprimir `NAO ACHEI`, use o **diretório-base da skill que o runtime mostrou** ao
carregar este arquivo. Nunca chute, e nunca gere do zero o que era pra ser copiado: se o
`index.html` sair de improviso em vez do `assets/index-template.html`, todas as guardas
deste material somem de uma vez e ninguém percebe.

## A ordem, e ela não é negociável

Visual primeiro, dado depois. Não é preferência: a fase de design **reescreve o
formulário inteiro**, então qualquer fio de dado plugado antes disso corre risco de
ser reescrito em silêncio numa rodada de estética.

E o dado é o que menos aguenta improviso. Duas mudanças de plataforma do Supabase em
2026 invalidaram todo snippet decorado, inclusive o meu. Então:

> **Na direção visual, liberdade total. Na camada de dado e no deploy, passo literal.**
> O bloco testado é colado, não gerado.

## Fluxo

### 1. Ficha de insumos, em uma rodada

Peça tudo de uma vez, numerado. Se a pessoa já disse algo, não pergunte de novo.

1. o arquivo com a copy da Função 4
2. **data, hora, duração e fuso** do webinário, já decididos
3. marca: logo e os hex, se souber
4. o WhatsApp de destino, com DDD
5. o que ela quer capturar além de nome, e-mail e telefone, **e o que a página
   devolve em troca de cada campo extra**

O item 5 tem regra: campo extra só entra se a página entregar alguma coisa por ele.
Sem contrapartida, o campo só derruba conversão.

### 2. PORTÃO 1 · spec aprovada antes de uma linha de HTML

Devolva, em no máximo 15 linhas: as seções na ordem, os campos do formulário, o texto
do botão, e **o que acontece depois que a pessoa envia**. Espere o "pode ir".

Quem não souber responder o que acontece depois do envio ainda não tem página. Isso
aparece em segundos e é o melhor instrumento de triagem que existe.

### 3. A URL nasce antes do design

```bash
cp "$SKILL/assets/index-template.html" ./index.html
```

O destino é `index.html` **na raiz da pasta do projeto da pessoa**, e vai sem alterar
nada. Ver `references/deploy.md` para os comandos literais de publicação.

O entregável deste passo é a **URL existir**, não o conteúdo dela. Editar a headline
antes de subir parece natural e é armadilha: adiciona um passo que depende de cada
pessoa acertar antes de existir prova de vida.

Copie também a config do `live` mode pra dentro do projeto da pessoa, o que economiza
uma etapa de setup se o refinamento visual usar o `live`:

```bash
mkdir -p .impeccable/live && cp "$SKILL/assets/impeccable-live-config.json" .impeccable/live/config.json
```

### 4. O visual, e aqui a skill sai da frente

O trabalho visual é do impeccable. Ver `references/impeccable-na-pratica.md`.

Você só reinstala duas guardas, depois de cada rodada:

- `prefers-reduced-motion` respeitado
- **headline e formulário sem animação de entrada** (a página recebe tráfego pago, e
  animação de entrada atrasa conteúdo e derruba conversão)

Uma direção por rodada, uma seção por vez. Ninguém passa da primeira seção antes do
hero estar aprovado, porque paleta, tipografia e clima do resto derivam dele.

### 5. O dado

Ver `references/supabase.md` e colar o SQL de lá **inteiro, sem adaptar**. Depois
`references/formulario-e-dados.md` para o modelo de dado e o consentimento.

**Avise antes que vai falhar.** O primeiro envio não chega em 100% das ocorrências
filmadas. Isso é esperado, não é vergonha, e a frase de conserto está em
`references/quando-quebra.md`.

Rode o `curl` de pré-flight você mesmo e leia o status. Não peça pra pessoa fazer
gesto que você consegue executar.

### 6. PORTÃO 2 · QA antes de publicar

```bash
python3 "$SKILL/scripts/check_page.py" index.html
```

Ele sai com código 1 se houver bloqueio. Some a isso `references/antes-de-publicar.md`,
que cobre o que o script não vê. Os dois itens que fecham de verdade:

- **grep por `8400` volta vazio** (o inject do `live` mode não dá erro nenhum no ar)
- **um lead de teste aparecendo no Table Editor** (a mensagem de obrigado não prova nada)

### 7. Publica e registra a URL canônica

`vercel --prod`. A URL de produção é sempre a mesma, então ela vai pro grupo com
todas as letras. Registre-a onde a pessoa vá achar depois.

### 8. Pós-captura

`references/pos-captura.md`. O default é click-to-WhatsApp, que funciona com zero
conta no ManyChat. Feche perguntando o que ficou fraco e o que vira dever de casa.

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

## Arquivos

Todos relativos a `$SKILL`, nunca ao `cwd` da pessoa. Ver a primeira seção.

| Arquivo | Quando ler |
|---|---|
| `references/anatomia-da-lp.md` | montando a estrutura da página |
| `references/impeccable-na-pratica.md` | antes de qualquer trabalho visual |
| `references/formulario-e-dados.md` | decidindo campos, consentimento, modelo de dado |
| `references/supabase.md` | criando a tabela e ligando o formulário |
| `references/deploy.md` | publicando, e sempre que a URL não abrir |
| `references/quando-quebra.md` | qualquer coisa que não funcionou |
| `references/pos-captura.md` | mandando o lead pro WhatsApp ou pra outro destino |
| `references/antes-de-publicar.md` | no Portão 2, sempre |
| `assets/index-template.html` | ponto de partida obrigatório, nunca gere do zero |
| `assets/impeccable-live-config.json` | copiar pra `.impeccable/live/config.json` |
| `scripts/check_page.py` | Portão 2 |
| `scripts/probe_page.mjs` | verificação profunda, opcional: roda o formulário e mede contraste, dobra e alinhamento no Chrome headless. Precisa de Chrome instalado, então é ferramenta de quem construiu, não do participante |
