# Depois que o lead entra: WhatsApp, fan-out e o que fica pra depois

Leia este arquivo na **Fase 4**, quando decidir o destino do lead, e de novo na **Fase 5**, quando ele já aparece no Table Editor e
falta decidir pra onde ele vai. Leia de novo em casa, porque **só a primeira parte fecha ao vivo**.

| O quê | Quando | Custo |
|---|---|---|
| Click-to-WhatsApp (`wa.me`) | **fecha ao vivo, na Fase 5** | zero. Duas linhas no config |
| Database Webhook do Supabase (fan-out) | dever de casa | zero, mas exige um destino que já receba POST |
| ManyChat com automação por keyword | dever de casa, e **só pra quem tiver Pro** | US$ 39/mês depois do trial |
| Disparo ativo pro lead (push) | **bloqueado.** Não cabe no desafio | três portões, dias de espera |

A regra que organiza tudo: **quem inicia a conversa é o lead, não você.** Isso não é escolha estética,
é o que a plataforma permite hoje sem pagar e sem esperar aprovação da Meta.

---

## O default: click-to-WhatsApp, com zero conta em lugar nenhum

`https://wa.me/55DDDNUMERO?text=PALAVRA` é um deep link pro **seu próprio número**. Não passa por
ManyChat, não passa por API, não tem conta pra criar. Abre o WhatsApp do lead já na conversa com você,
com a mensagem digitada.

No template, são duas linhas:

```js
WHATSAPP: '5511999999999',                    // só dígitos, com 55. Sem +, sem (), sem traço
WHATSAPP_TEXT: 'QUERO ENTRAR NO WEBINARIO',   // caixa alta, sem acento
```

O que acontece no submit, nesta ordem exata:

1. valida no navegador (consentimento, e-mail, telefone);
2. normaliza o telefone do lead pra dígitos puros com `55` na frente;
3. faz o `POST` e **espera a resposta HTTP**;
4. só se a resposta for OK mostra "Inscrição confirmada" e, 1,2 segundo depois, redireciona pro
   `wa.me`.

A ordem importa: o lead vai pro WhatsApp **depois** de estar gravado, não antes. Se o banco recusar,
ele vê o erro com o status na tela e ninguém é levado pra lugar nenhum.

### Por que o telefone tem que ser normalizado, e não é frescura

O WhatsApp **não carrega payload escondido**. O `?text=` chega como texto puro visível pro lead, e não
existe campo oculto viajando junto (isso existe no Ref URL do Messenger, não aqui). Ou seja: a **única
chave de ligação** entre a linha do Supabase e a conversa do WhatsApp é o telefone.

E os dois formatos divergem por natureza: a pessoa digita `(11) 99999-9999`, o identificador do
WhatsApp é `5511999999999`. Se você gravar o que ela digitou, nunca mais cruza as duas pontas. Por isso
o template normaliza no submit e grava só dígitos. Isso é requisito, não preferência.

### A verificação, e ela leva 15 segundos

O `scripts/check_page.py` **bloqueia** publicação se o `CONFIG.WHATSAPP` não casar com `55` mais 10 ou
11 dígitos. O que ele não consegue saber é se o número é **o seu**. Então, antes de publicar:

```
Cole na barra de endereço do navegador, com os SEUS dígitos:
https://wa.me/5511999999999?text=QUERO%20ENTRAR%20NO%20WEBINARIO
```

Passou quando abre a conversa **com você** e o texto já está escrito na caixa. Se disser "número
inválido" ou abrir a conversa de outra pessoa, o número está errado, e a sua página não vai acusar nada.

---

## Quando quebra

| Sintoma na tela | Causa | Verificação / frase de conserto |
|---|---|---|
| WhatsApp diz "número inválido" e a página não acusa nada | `CONFIG.WHATSAPP` com `+`, parêntese, traço, espaço ou zero à esquerda | rodar `python3 <SKILL>/scripts/check_page.py index.html`, e abrir o `wa.me` na barra de endereço |
| Abre a conversa **de outra pessoa** | DDD errado, ou o `55` esquecido e o número lido como de outro país | o teste de barra de endereço acima é o único que pega isso |
| Formulário diz "Inscrição validada" e **não redireciona** | você está no **degrau 0**: `WHATSAPP` preenchido, mas `SUPABASE_URL`/`SUPABASE_KEY` e `WEBHOOK_URL` vazios. Nesse degrau a página só mostra o payload, não chama o sucesso | preencher o destino do dado. O redirect vive no caminho de sucesso, e no degrau 0 não há envio pra dar sucesso |
| Lead chega no WhatsApp e a automação do ManyChat não dispara | ele apagou a mensagem pré-preenchida e escreveu a dele. A doc do ManyChat é explícita: mensagem própria não casa a keyword | nenhuma. **Trate como esperado** e olhe a caixa de entrada. A keyword nunca é o único caminho até o lead |
| A automação dispara só às vezes | keyword configurada como `Message is` | trocar pra **`Message contains`**. `Message is` exige a frase idêntica, caractere por caractere |
| A palavra tem acento e falha | o matcher do ManyChat compara texto; acento e caixa viram fonte de divergência | palavra distintiva, **caixa alta e sem acento**. Isso é regra do matcher, não da URL: o link já codifica acento e espaço sozinho |

---

## Por que o push está bloqueado, e é bom saber o motivo

"Push" aqui é a empresa **iniciar** a conversa com um contato que ainda não escreveu. São três portões
empilhados, e nenhum deles é rápido:

1. **ManyChat Pro**, US$ 39/mês. O plano free não faz.
2. **Ticket de suporte** pra liberar import de `wa_id` (o identificador do contato no WhatsApp).
3. **Template aprovado pela Meta**, porque fora da janela de resposta só sai mensagem em template.

Nada disso cabe entre 17/08 e o fim do desafio pra quem está começando agora. Daí o desenho: a página
manda o lead pra você, e a conversa nasce dele. Isso também é o caminho mais barato e o mais rápido de
provar que funciona.

---

## ManyChat, se você for mesmo por esse caminho

Vale a pena quando o volume passa do que dá pra responder no dedo. Antes disso, atender no aplicativo
do **WhatsApp Business** é de graça, funciona, e não tem janela de 24h pra você responder à mão.

O que morde, e é melhor saber antes de montar:

- **Conta free permite 3 keywords.** Planeje quais três, não vá descobrindo.
- **Keyword é `Message contains`, nunca `Message is`.** Repetido de propósito: é o erro mais comum.
- **Se o lead digitar mensagem própria, a automação não dispara.** Ela é um atalho, não uma rede.
- **O trial de 14 dias do Pro começando em 17/08 expira por volta de 31/08**, no meio de um desafio de
  50 dias. E quando cai, **o canal de WhatsApp cai junto**. Ou seja, você monta a automação, ela roda
  duas semanas e some no momento em que o tráfego está quente.
- **WhatsApp Business Account sem verificação fica limitada a 250 conversas por mês**, em vez do teto
  maior das contas verificadas. A verificação na Meta leva dias e não se faz ao vivo. Se você vai
  anunciar em 20/08, **começa antes**.

[CONFIRMAR: o teto exato das contas verificadas e a duração real da verificação na Meta variam por
conta e por país. Os números aqui são os do plano (250/mês sem verificação, "dias" de verificação).
Confira no Business Manager da sua conta antes de contar com volume.]

---

## O fan-out: um lead, vários destinos

Quando o dado já está no Supabase (degrau 2), o **Database Webhook** é o jeito de avisar outros
sistemas sem tocar na página. Você configura no painel do Supabase um webhook na tabela `leads`,
evento `INSERT`, apontando pra uma URL que recebe `POST`. A partir daí, todo lead novo vira uma
chamada HTTP pra onde você quiser (n8n, Make, Zapier, um endpoint seu).

**Atenção ao formato, porque não é o mesmo corpo que sai do navegador.** O que a página posta no
degrau 1 é o payload canônico, achatado:

```json
{
  "name": "Maria Exemplo",
  "email": "maria@exemplo.com.br",
  "phone": "5511999999999",
  "consent_lgpd": true,
  "consent_text": "Concordo em receber comunicações...",
  "source_url": "https://lp-maria-webinario.vercel.app/"
}
```

Já o Database Webhook dispara **do banco**, depois da linha existir, então ele manda um envelope de
gatilho (tipo do evento, nome da tabela e a linha gravada), e a linha gravada traz `id` e `created_at`,
que o navegador de propósito não envia. Quem for mapear os campos no n8n ou no Make precisa olhar o
nível a mais.

[CONFIRMAR: o formato exato do envelope do Database Webhook (nomes dos campos de primeiro nível) não
foi verificado contra o painel. Fecha no ensaio de 13/08. O jeito honesto de descobrir em 5 minutos:
aponte o webhook pra um receptor descartável, insira um lead de teste e **olhe o corpo que chegou**
antes de montar qualquer mapeamento.]

**E o aviso que vale mais que o resto desta seção: o `pg_net`, que é quem entrega o webhook, não tem
retry.** Se o destino estiver fora do ar ou devolver erro, a linha entra no banco normalmente e
**ninguém é avisado**. O lead está salvo, o aviso se perdeu, e a tela não muda de cor. A única forma de
saber é abrir o log do hook no painel do Supabase. Trate o Supabase como a fonte da verdade e o webhook
como conveniência, nunca o contrário.

---

## A regra dura: o token do ManyChat nunca encosta no HTML

**Nunca chame `api.manychat.com` do navegador.** Nem "só pra testar".

O contraste com o Supabase é o ponto inteiro, e ele é o que evita os dois erros opostos:

| | Chave publicável do Supabase | Token da API do ManyChat |
|---|---|---|
| Fica no HTML? | **sim, e está certo.** É pública por design | **jamais** |
| Quem protege | a RLS: a policy é insert-only, e ler a tabela com essa chave dá negado | nada. O token dá acesso total à conta |
| Se vazar | nada acontece, porque ela já era pública | qualquer pessoa lê, escreve e apaga seus contatos |

Tudo que está numa página estática é público. Ver o código-fonte é `Ctrl+U`, e não existe esconderijo:
**variável de ambiente não esconde nada em código de front-end**, porque o valor é embutido no arquivo
que vai pro navegador. Se alguém te disser o contrário, está errado.

Isso não contradiz a saída de emergência: se você **precisar mesmo** falar com a API do ManyChat, o
caminho é uma Serverless Function na Vercel com o token em variável de ambiente. A diferença é onde o
código roda: a função roda **no servidor da Vercel**, e o navegador nunca vê o token. É só nesse caso
que env var protege alguma coisa. Pra esta aula: não chame.

---

## E-mail de confirmação fica fora, de propósito

Parece o próximo passo óbvio e é uma armadilha. O Resend sem domínio verificado só envia a partir de
`onboarding@resend.dev` e só **para o e-mail da própria conta**. Ou seja: passa em todo teste que você
faz, e falha em 100% dos leads reais. É o pior modo de falha que existe, porque parece sucesso.

Enquanto não houver domínio verificado, **a confirmação é o WhatsApp**, e é por isso que o redirect do
`wa.me` vale mais do que parece: ele é o recibo que o lead leva pra casa.
