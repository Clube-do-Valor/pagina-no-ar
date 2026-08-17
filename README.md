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

## As seis fases

Desde a versão 0.2.0 a skill é o método inteiro, não só o deploy. Seis fases, e
entre cada uma um **portão** que só abre com uma prova mostrada na tela.

| Fase | O que acontece | Portão |
|---|---|---|
| 1 · Fundação | público, objetivo, promessa, gancho, marca, 3 referências com rótulo, e quais perguntas o lead responde | a spec cabe em 15 linhas e foi aprovada |
| 2 · Prototipação | o desenho nasce no **Claude Design**, começando pelo hero | hero aprovado **e** arquivo no disco |
| 3 · Handoff e crítica | reconstrói em cima do template, roda `audit` e `critique` do impeccable | os achados foram corrigidos, não só lidos |
| 4 · As três definições | campos do formulário, domínio próprio, destino do lead | as três estão escritas |
| 5 · Deploy | Supabase, `vercel --prod`, verificação de segurança | lead de teste no Table Editor |
| 6 · Validação visual | aba anônima, celular de verdade, lead pela página no ar | você mostrou a tela |

**Não faz a copy.** A Fase 1 produz a fundação (promessa, gancho, público), e o
texto das seções vem pronto da Função 4 da skill do desafio.

## O que vem dentro

| | |
|---|---|
| `assets/index-template.html` | arquivo único, sem build, sem import, com mundo visual próprio e três degraus de degradação |
| `assets/impeccable-live-config.json` | config pronta pro `live` mode do impeccable |
| `references/` | doze arquivos, da entrevista de fundação ao catálogo de falhas caladas |
| `scripts/check_page.py` | Portão 5: o que conferir antes de publicar |
| `scripts/probe_page.mjs` | verificação profunda no Chrome headless |

Três coisas que a v0.2.0 traz e que valem ser ditas em voz alta, porque as três
foram medidas e as três contrariam o que parecia certo:

- **`/security-review` não roda numa pasta sem git.** O portão dele é um
  `git rev-parse --is-inside-work-tree` e, quando fecha, o comando devolve só um
  recado e nunca carrega o prompt de revisão. Por isso a verificação de segurança
  desta skill é checklist, não slash command. Ver `references/seguranca.md`.
- **O `audit` do impeccable rodado contra URL dá falso-limpo.** Sem o pacote
  puppeteer ele imprime `[]` e sai com código 0, que é a assinatura de "limpo".
  Rode no arquivo.
- **As sete armadilhas do handoff do Claude Design falham todas caladas**, com a
  página parecendo pronta na tela. Ver `references/claude-design.md`.

## Os três degraus do template

| Degrau | Configuração | Resultado |
|---|---|---|
| 0 · seco | nada preenchido | valida, mostra sucesso e **exibe o payload que enviaria** |
| 1 · webhook | uma constante de URL | posta o payload direto no destino |
| 2 · completo | URL + chave publicável do Supabase | grava no banco |

Os três são página no ar que funciona. Ninguém fica sem entregável.

## Verificar o template

```bash
python3 plugins/pagina-no-ar/skills/pagina-no-ar/scripts/check_page.py index.html
node plugins/pagina-no-ar/skills/pagina-no-ar/scripts/probe_page.mjs /caminho/index.html /pasta/prints
```

O `probe_page.mjs` roda o formulário de verdade num Chrome headless e mede o que
screenshot não mostra: contraste computado de todo texto da página, o CTA dentro
da primeira tela, o eixo de alinhamento das seções, e o **teste da mentira** (com
a URL do banco trocada por lixo, a página tem que dizer erro, nunca "confirmado").
