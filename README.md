# pagina-no-ar

Plugin de Claude Code que coloca no ar a página de inscrição de um webinário: do
arquivo local até um lead real gravado no banco.

Feito para o encontro **"Página no ar: deploy no Vercel com Claude"** do Desafio
Webinário Perfeito em 50 Dias (Clube de Aceleração de Negócios · Clube do Valor),
17/08/2026.

## Instalar

Dentro do Claude Code:

```
/plugin marketplace add Clube-do-Valor/pagina-no-ar
/plugin install pagina-no-ar@clube-do-valor
```

Se o resumo da instalação pedir, rode `/reload-plugins`.

## O que ele faz, e o que ele NÃO faz

Faz: estrutura da página, deploy no Vercel, tabela e captura no Supabase, saída
pro WhatsApp, e o portão de QA antes de publicar.

**Não faz a copy.** O texto da página vem pronto da Função 4 da skill do desafio.
Sem copy, não há o que publicar.

## O que vem dentro

| | |
|---|---|
| `assets/index-template.html` | arquivo único, sem build, sem import, com mundo visual próprio e três degraus de degradação |
| `assets/impeccable-live-config.json` | config pronta pro `live` mode do impeccable |
| `references/` | oito arquivos, do de-para das seções ao catálogo de falhas caladas |
| `scripts/check_page.py` | Portão 2: o que conferir antes de publicar |
| `scripts/probe_page.mjs` | verificação profunda no Chrome headless |

## Os três degraus do template

| Degrau | Configuração | Resultado |
|---|---|---|
| 0 · seco | nada preenchido | valida, mostra sucesso e **exibe o payload que enviaria** |
| 1 · webhook | uma constante de URL | posta o payload direto no destino |
| 2 · completo | URL + chave publicável do Supabase | grava no banco |

Os três são página no ar que funciona. Ninguém fica sem entregável.

## Verificar o template

```bash
python3 skills/pagina-no-ar/scripts/check_page.py index.html
node skills/pagina-no-ar/scripts/probe_page.mjs /caminho/index.html /pasta/prints
```

O `probe_page.mjs` roda o formulário de verdade num Chrome headless e mede o que
screenshot não mostra: contraste computado de todo texto da página, o CTA dentro
da primeira tela, o eixo de alinhamento das seções, e o **teste da mentira** (com
a URL do banco trocada por lixo, a página tem que dizer erro, nunca "confirmado").
