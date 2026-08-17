# Domínio próprio

Leia na **Fase 4**. Números conferidos na fonte oficial em **17/08/2026**.

**A conclusão primeiro, porque ela muda o planejamento: comprar domínio não cabe numa
aula.** A URL `.vercel.app` já é entregável, ela é permanente, e ela dá pra mandar pra
qualquer pessoa hoje. Domínio próprio é o passo seguinte, não um bloqueio do primeiro.

---

## Por que não cabe ao vivo, e não é só a conta do tempo

| Etapa | Tempo |
|---|---|
| registro sai | até 5 minutos |
| **edição de DNS destrava** | só **depois que o pagamento cai** (boleto não tem prazo publicado) |
| propagação no DNS do registro.br | até 1 hora |
| certificado TLS na Vercel | só depois da propagação |
| **trocar nameserver por engano** | 2 horas pra ir, e **4 horas de espera** pra voltar |

Quatro horas de rollback é mais que a aula inteira.

**E o pior não é o tempo, é que as travas são individuais e invisíveis de antemão.** Você
não consegue prever qual dos dez vai travar:

- **CPF ou CNPJ já preso a um Provedor de Serviços.** Nesse caso o registro.br não deixa
  registrar, não deixa editar DNS e não emite boleto: tudo tem que passar pelo provedor.
  Sair dele leva 3 dias, ou 60 dias de carência se ele já pagou algo.
- **Cartão que não é Visa nem Mastercard.** Elo, Amex, Hipercard e débito estão fora.
- **A chave de acesso numérica parada no spam** do e-mail corporativo, com validade de
  30 minutos.

> **E tem um motivo de privacidade que pesa sozinho:** registrar ao vivo obriga cada
> pessoa a digitar **CPF, endereço e telefone com a tela compartilhada**. Isso é exposição
> de dado pessoal sem necessidade, e não se conserta depois. Se for pra registrar em
> grupo, cada um faz na própria tela, sem compartilhar.

---

## O que o registro.br exige, e quanto custa

- **Pessoa física: CPF. Pessoa jurídica: CNPJ.** Mais um contato em território nacional.
- O `.com.br` **não** está entre as categorias que exigem envio de documento de
  identidade, então não há etapa de análise documental.
- **R$ 40,00 por ano**, valor vigente em 17/08/2026.
- Pagamento: **Pix, boleto ou cartão de crédito Visa ou Mastercard**. O prazo de
  compensação do boleto não é publicado. **Pix é o caminho, porque destrava o DNS mais
  rápido.**

---

## Comprar pela Vercel está fora, e tem uma pegadinha

A Vercel **não vende `.com.br` nem `.br`**. E a armadilha: **`.br.com` está na lista
dela.** Quem busca na caixa de domínios da Vercel encontra algo que parece o domínio
brasileiro e não é. `.br.com` é outro registro, com outro dono e outro significado.

O domínio grátis do plano Pro também não ajuda: ele cobre só `.online`, `.site`,
`.space`, `.store`, `.tech` e `.website`.

---

## Ligar na Vercel: os dois registros

No painel, **Settings > Domains > Add Domain**. Pelo CLI é equivalente.

| O que | Tipo de registro | Valor |
|---|---|---|
| apex (`seudominio.com.br`) | **A** | **copie do domain card do projeto.** Pra maioria é `76.76.21.21`, mas projeto novo recebe outro IP do pool anycast, tipo `216.198.79.1` |
| `www` | **CNAME** | o valor que a própria Vercel mostra no card |

> **Não decore o IP.** Copie do card do seu projeto. Escrever de memória é como se
> publica uma página que resolve pro lugar errado sem erro nenhum na tela.

No registro.br, use o **Modo Avançado** da zona de DNS. O **Modo Básico não serve**,
porque ele só aceita endereço de site e servidor de e-mail, sem CNAME.

**Fique no DNS do próprio registro.br.** Propaga em até 1 hora e é recuperável. Trocar
pra nameserver externo é o clique que custa as 4 horas.

### Duas regras duras

1. **Nunca mexa em nameserver ao vivo.** É a única mudança aqui que não tem volta rápida.
2. **Deixe o `www` como domínio primário, com o apex redirecionando.** A própria Vercel
   documenta relato de timeout no Brasil quando o apex responde pelo registro A fixo.

---

## O certificado TLS

É automático, via Let's Encrypt com desafio HTTP-01, e sai em poucos minutos **depois que
o DNS já propagou**. Não é passo manual.

Os bloqueadores documentados, quando ele não sai:

| Bloqueador | O que fazer |
|---|---|
| registro **CAA** que não autoriza a Let's Encrypt | acrescentar ou remover o CAA |
| **redirect** em `/.well-known/acme-challenge/` | tirar o redirect dessa rota |
| **TXT `_acme-challenge`** velho de outro provedor | apagar o registro antigo |
| registro **AAAA** no apex | remover o AAAA |

---

## O que fazer na aula, em 3 minutos

Não registre nada ao vivo. Demonstre:

1. abra o domain card de um domínio **já registrado e já pago**
2. mostre de onde o valor do A record é copiado
3. cole o A no apex e o CNAME no `www` na zona de DNS
4. mostre que o TLS aparece sozinho depois

E diga a frase que fecha o assunto:

> A URL `.vercel.app` que você tem agora **é permanente e é sua**. O domínio próprio é
> aparência e proteção de marca, não é o que faz a página funcionar. Compra essa semana,
> aponta com esses dois registros, e nada da página muda.

---

## Um aviso que vale pra rede corporativa

Se a página não abrir na rede da empresa mas abrir no celular com dados móveis,
**suspeite do firewall antes de suspeitar da página.** Firewall corporativo costuma
bloquear domínio recém-registrado por categoria (*"Newly Observed Domain"*), e isso sai
sozinho conforme o domínio envelhece.

E onde há interceptação de TLS, `curl` e ferramenta de linha de comando **mentem**: elas
reportam o site como fora do ar por causa do certificado interceptado. Verifique pelo
painel do provedor, não pela rede.

**Ou seja: "não abre aqui" precisa ser testado de fora antes de virar diagnóstico.**
