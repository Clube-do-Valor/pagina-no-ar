# Antes de publicar: o checklist do Portão 2

Leia este arquivo quando o visual estiver fechado e você estiver prestes a rodar `vercel --prod`.
Leia de novo depois de **qualquer** mudança na página, porque o gesto da aula (pede no chat, olha o
diff, `vercel --prod`) acontece quatro vezes, e cada rodada envelhece o checklist anterior.

**A regra do portão: "funcionou aqui" não fecha item. Mostrar a tela fecha.** Tudo que está aqui é
falha que não aparece sozinha. A página fica bonita, carrega rápido, e está errada.

Oito itens. Nenhum é opcional. O item 8 é o único que fecha de verdade.

| Quando | Itens | Por quê |
|---|---|---|
| Antes de subir, no arquivo | 1, 2 | são os dois que decidem se pode publicar |
| Depois de subir, na página publicada | 3, 4, 5, 6, 7, 8 | é a página que recebe tráfego que precisa passar, não o rascunho local |

---

## 1. Rodar o `check_page.py`

```bash
python3 "$SKILL/scripts/check_page.py" index.html
```

Passou quando a última linha diz `Liberado pra publicar.`. Qualquer linha começando com
`BLOQUEIO ·` é parada obrigatória: o script imprime o que viu e a frase de conserto junto.

Linha `aviso ·` não trava publicação, mas leia. O aviso de "nenhum destino configurado (degrau 0)"
significa que a página valida e não grava em lugar nenhum: é página no ar que funciona, e **não**
conta como captação pro entregável de inscritos.

## 2. `grep` por `8400`

```bash
grep -c 8400 index.html
```

Passou quando a tela mostra `0`. Qualquer número maior que zero é bloqueio.

Detalhe que confunde: esse comando **sai com código de erro mesmo quando está certo** (é assim que o
`grep` avisa "não achei nada"). O sinal é o `0` impresso na tela, não o código de saída. Se você
rodar `grep -n 8400 index.html` em vez disso, o certo é não sair nada, e aí saída vazia é ambígua:
pode ser "limpo" ou "não rodou".

**Por que isso existe separado do item 1, se o `check_page.py` já procura `8400`.** Porque o `live`
mode do impeccable reinjeta o script a qualquer momento que você abrir ele de novo. Um
`check_page.py` limpo de vinte minutos atrás não vale nada se você voltou pro `live` no meio. Este
grep é o último gesto antes do `vercel --prod`, e custa dois segundos.

Frase de conserto, cole no chat: **"remova o inject do live mode do index.html"**.

## 3. `Ctrl+U` na página PUBLICADA

Abra a URL de produção **em aba anônima** (`Ctrl+Shift+N`), e nela aperte `Ctrl+U`. Isso mostra o
código-fonte que o mundo inteiro enxerga. Com `Ctrl+F` dentro dessa tela, procure duas coisas:

1. `8400` → tem que dar zero resultado. Se aparecer, o deploy subiu com o inject dentro.
2. `SUPABASE_KEY` → olhe o valor. Ele tem que ser a chave **publicável** (rótulo `publishable`, ou
   `anon` em projeto antigo). Se aparecer `service_role`, `sb_secret_` ou qualquer coisa rotulada
   `secret`, é incidente.

A chave publicável no HTML está **certa**. Ela é pública de propósito, porque quem segura o banco é
a RLS, não o segredo da chave. A `service_role` no HTML não gera erro nenhum: a página funciona
idêntica e qualquer pessoa lê e apaga sua lista de inscritos.

Se a errada já subiu: troque pela publicável no `CONFIG`, publique de novo, e **rotacione a secreta**
no painel do Supabase em Project Settings → API. Nessa ordem, sem pular a rotação.

## 4. Um fold, uma mensagem

Abra a página publicada e **não role**. Vinte segundos olhando a primeira tela:

- dá pra dizer em uma frase o que essa página oferece?
- tem uma ideia só ali, ou tem três brigando?

Se tem três, o conserto é tirar texto, não diminuir fonte. Cole no chat: **"mexa só no hero: reduza
pra uma mensagem só, tire o que não for a promessa principal, não mexa em mais nenhuma seção"**.

## 5. A data visível sem rolar

Na mesma primeira tela do item 4, a data e a hora do webinário precisam estar visíveis. Isso não é
capricho: data pública na página é o entregável de pontuação da semana 4.

Isso falha de verdade em página correta. Headline em português de 78 caracteres empurra o bloco do
evento pra baixo da dobra, principalmente no celular.

Frase de conserto: **"suba o bloco do evento pra logo depois da headline no hero, e encurte a
headline se precisar. Não mexa nos atributos `data-evento`"**.

Cuidado: existem **dois** blocos com `data-evento` na página, um no hero e outro na seção de
inscrição, e o script preenche os dois. O segundo não é duplicata pra apagar.

## 6. Abrir no celular de verdade

Celular de verdade, não o emulador do DevTools. Mande a URL pro seu WhatsApp e abra do telefone.
O tráfego pago de 20/08 chega majoritariamente em celular, então o celular é a conversão, não o
detalhe.

Três coisas, nessa ordem:

- a primeira tela é legível sem pinçar zoom;
- a data aparece sem rolar (é o item 5, de novo, no aparelho que importa);
- dá pra preencher os três campos e apertar o botão com o polegar, sem o teclado tampar o botão.

## 7. Caixinha de consentimento desmarcada: zero requisição

O gesto exato, na página publicada:

1. `F12` para abrir o DevTools, aba **Network** (Rede);
2. **filtre por `Fetch/XHR`**, ou clique no ícone de limpar a lista. Isso não é firula: a página
   carrega o Google Fonts, então tem requisição legítima ali e sem o filtro você conta errado;
3. preencha nome, e-mail e WhatsApp, **deixe a caixinha desmarcada**, e clique em Confirmar.

**Passou quando não aparece nenhuma linha nova na aba Network.** Esse é o gate binário, e ele é
determinístico: o `required` do HTML barra antes de qualquer `fetch` sair.

Se aparecer uma requisição, e pior, se voltar um erro `400` com nome de constraint do Postgres, o
`required` da caixinha sumiu do HTML numa rodada de estética. Cole no chat: **"restaure o
`required` no checkbox de consentimento do formulário"**.

Junto do gate binário, olhe a mensagem que o navegador mostra. Ela tem que ser compreensível pra
quem está se inscrevendo.

> [CONFIRMAR: a redação exata e o idioma da mensagem nativa do navegador. Ela é gerada pelo
> navegador, não pela página, e segue o **idioma do navegador**, não o `lang="pt-BR"` do HTML. Num
> Chrome em inglês pode sair em inglês numa página perfeitamente correta. Conferir no ensaio de
> 13/08. Se sair em inglês, o conserto é uma mensagem customizada no template, não uma mudança
> neste checklist.]

## 8. Lead de teste no Table Editor

**Este é o único item que fecha de verdade.** Os sete anteriores são pré-requisito dele.

1. Abra a **URL publicada, em aba anônima**. Não use o arquivo local: o payload grava
   `source_url` a partir do endereço aberto, então um envio de `file://` não prova nada sobre a
   página que está no ar;
2. preencha com dados seus, mas com o nome começando em `TESTE ` pra você achar depois;
3. envie, e aceite que **pode não sair na primeira tentativa**. Se falhar, a página mostra o status
   cru na tela. Copie a linha inteira e cole no chat: o número é o diagnóstico;
4. abra o painel do Supabase em **Table Editor → tabela `leads`** e ache a linha.

A mensagem "Inscrição confirmada" na tela **não fecha este item**. Com `Prefer: return=minimal`, ela
prova que voltou um 2xx, não que existe linha. Quem prova é a linha na tela do Table Editor.

Na linha, confira quatro campos:

| Campo | O que tem que estar lá |
|---|---|
| `phone` | começando em `55` e **só dígitos**, sem parêntese, traço ou espaço |
| `consent_text` | preenchido, com a redação que está na página agora |
| `created_at` | a hora de agora, não 1970 |
| `email` | minúsculo, como você digitou |

---

## As falhas que não avisam

Cada linha aqui é uma coisa que dá certo na aparência e errado no resultado. É por isso que existe
gesto, e não sensação.

| Sintoma na tela | Causa | Verificação que pega |
|---|---|---|
| Nada. A página está normal | sobrou o `<script>` do `live` mode apontando pra `localhost:8400` | itens 1, 2 e 3 |
| Nada. A página está normal | `service_role` no lugar da chave publicável, e o banco está aberto pro mundo | item 3, `Ctrl+U` na página publicada |
| "Inscrição confirmada" e o banco vazio | RLS ligada sem policy, ou faltou o `grant insert`. O erro volta em JSON que ninguém lê | item 8, a linha no Table Editor |
| Datas em 1970, ou a hora errada | `created_at` foi mandado no corpo do POST e sobrescreveu o `default now()` do banco | item 8, o campo `created_at` |
| O lead chega e o `wa.me` diz "número inválido" | telefone gravado com parêntese ou traço em vez de E.164 | item 8, o campo `phone` |
| A caixinha desmarcada devolve erro esquisito | sumiu o `required` do checkbox. O script ainda lê a caixinha e recusa com mensagem, mas quem devia barrar antes de qualquer requisição é o HTML | item 7, zero linha na aba Network |

---

## O fecho

Se você mexeu em qualquer coisa depois de fechar o checklist, ele venceu. Rode de novo, no mínimo os
itens 1 e 2, e publique de novo com `vercel --prod`.

E copie a URL do que o comando imprimiu na tela, nunca digite de memória. Subdomínio `.vercel.app` é
por ordem de chegada, e a Vercel resolve colisão de nome calada.
