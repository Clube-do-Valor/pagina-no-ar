#!/usr/bin/env python3
"""
Portão 2: o que conferir ANTES de publicar.

Cada item aqui é uma falha que NÃO aparece na tela. A página fica bonita,
carrega rápido, e está errada. Por isso é script e não olho.

    python3 check_page.py index.html

Sai com código 1 se achar bloqueio, 0 se estiver liberado pra publicar.
"""

import base64
import re
import sys
from pathlib import Path

BLOQUEIOS = []
AVISOS = []


def bloqueio(titulo, detalhe, conserto):
    BLOQUEIOS.append((titulo, detalhe, conserto))


def aviso(titulo, detalhe, conserto):
    AVISOS.append((titulo, detalhe, conserto))


def sem_comentarios(html: str) -> str:
    """
    Devolve o arquivo sem comentário nenhum.

    Isso não é firula. O template AVISA, num comentário, pra nunca colar a chave
    `service_role`. Procurar a palavra no arquivo cru acusa o próprio aviso, e um
    bloqueio que dispara no template intacto ensina o participante a ignorar
    bloqueio. Aí o dia em que a chave estiver mesmo lá, ninguém olha.
    """
    s = re.sub(r"<!--.*?-->", " ", html, flags=re.S)          # comentário HTML
    s = re.sub(r"/\*.*?\*/", " ", s, flags=re.S)              # bloco /* */
    s = re.sub(r"(?<![:/])//[^\n]*", " ", s)                  # linha //, poupando https://
    return s


def checar(caminho: Path) -> None:
    html = caminho.read_text(encoding="utf-8", errors="replace")
    codigo = sem_comentarios(html)

    # --- 1. o inject do live mode indo pro ar --------------------------------
    # O `live` do impeccable escreve um <script> apontando pra localhost:8400
    # dentro do index.html. Em produção ele não faz nada e não dá erro visível,
    # e fica no código-fonte de uma página que recebe tráfego pago.
    if "8400" in html:
        linhas = [i + 1 for i, l in enumerate(html.splitlines()) if "8400" in l]
        bloqueio(
            "sobrou o inject do live mode",
            f"achei '8400' na(s) linha(s) {linhas}",
            "peça pro Claude: 'remova o inject do live mode do index.html'",
        )

    # --- 2. a chave errada do Supabase ---------------------------------------
    # service_role no HTML não gera erro nenhum: a página funciona idêntica e o
    # banco fica aberto pro mundo ler E apagar a lista de inscritos.
    for marca in ("service_role", "sb_secret_", "supabase_secret"):
        if marca in codigo:
            bloqueio(
                "chave secreta do Supabase na página",
                f"achei '{marca}' no HTML",
                "troque pela chave PUBLICÁVEL (publishable/anon) e rotacione a "
                "secreta em Project Settings > API antes de republicar",
            )
    # A chave `service_role` de verdade é um JWT, e aí a palavra que denuncia ela
    # está em base64 dentro do payload. Procurar a string literal NÃO acha, e essa
    # é justamente a chave que abre o banco pro mundo ler E apagar a lista de
    # inscritos, sem nenhum sintoma na tela. Então tem que decodificar.
    for jwt in re.findall(r"eyJ[A-Za-z0-9_-]{6,}\.(eyJ[A-Za-z0-9_-]{6,})\.[A-Za-z0-9_-]+", codigo):
        try:
            corpo = base64.urlsafe_b64decode(jwt + "=" * (-len(jwt) % 4)).decode("utf-8", "replace")
        except Exception:
            continue
        papel = re.search(r'"role"\s*:\s*"([^"]+)"', corpo)
        if papel and papel.group(1) != "anon":
            bloqueio(
                f"JWT com papel `{papel.group(1)}` na página",
                f"decodifiquei o payload do token e achei role={papel.group(1)}",
                "essa chave dá acesso total ao banco. Troque pela publicável "
                "(anon / publishable) e ROTACIONE a secreta em Project Settings > API "
                "ANTES de republicar. Se ela já foi publicada, considere os dados "
                "expostos e trate como incidente",
            )

    # --- 3. placeholders que sobraram ----------------------------------------
    faltas = re.findall(r"\[FALTA:[^\]]*\]", html)
    if faltas:
        amostra = "; ".join(sorted(set(faltas))[:5])
        bloqueio(
            f"{len(faltas)} marcação(ões) [FALTA:] no ar",
            amostra + (" ..." if len(set(faltas)) > 5 else ""),
            "preencha ou apague. Publicar com [FALTA:] visível custa inscrito",
        )

    for marca in ("__SUPABASE_URL__", "__SUPABASE_KEY__", "SEU_NUMERO", "lorem ipsum"):
        if marca.lower() in codigo.lower():
            bloqueio(
                "placeholder de configuração não substituído",
                f"achei '{marca}'",
                "preencha o bloco CONFIG no fim do arquivo",
            )

    # --- 4. a data, que é o entregável de 10 pontos --------------------------
    m_data = re.search(r"data:\s*'([^']*)'", codigo)
    m_hora = re.search(r"hora:\s*'([^']*)'", codigo)
    if not m_data or not m_data.group(1).strip():
        bloqueio(
            "sem data do webinário",
            "EVENTO.data está vazio",
            "preencha EVENTO.data. A semana 4 pontua data pública na página",
        )
    if not m_hora or not m_hora.group(1).strip():
        bloqueio(
            "sem hora do webinário",
            "EVENTO.hora está vazio",
            "preencha EVENTO.hora",
        )

    # --- 5. as três linhas que fazem o formulário não mentir -----------------
    invariantes = [
        ("e.preventDefault()", "sem isso o navegador aborta o fetch no meio do voo"),
        ("if (!r.ok)", "sem isso a página diz 'confirmado' até offline"),
        ("return=minimal", "sem isso o Supabase reverte a inserção depois de inserir"),
        ("consent_text", "sem isso a linha não sabe com que texto a pessoa consentiu"),
    ]
    for trecho, porque in invariantes:
        if trecho not in codigo:
            bloqueio(
                f"sumiu `{trecho}` do formulário",
                porque,
                "restaure o bloco INTOCÁVEL. Uma rodada de estética reescreveu ele",
            )

    if re.search(r"created_at\s*:", codigo):
        bloqueio(
            "created_at está indo no corpo do POST",
            "achei `created_at:` como campo de objeto, fora de comentário",
            "tire do payload. Quem carimba a hora é o banco, pelo default now(). "
            "Mandado do navegador, grava o relógio do visitante, que pode estar em 1970",
        )

    # --- 6. destino configurado ----------------------------------------------
    tem_supabase = bool(re.search(r"SUPABASE_URL:\s*'https://\S+'", codigo))
    tem_webhook = bool(re.search(r"WEBHOOK_URL:\s*'https?://\S+'", codigo))
    if not tem_supabase and not tem_webhook:
        aviso(
            "nenhum destino configurado (degrau 0)",
            "a página valida e mostra o payload, mas não grava em lugar nenhum",
            "isso é página no ar que funciona, mas não conta como captação. "
            "Preencha SUPABASE_URL + SUPABASE_KEY antes de mandar tráfego",
        )

    # --- 7. WhatsApp em E.164 -------------------------------------------------
    m_wpp = re.search(r"WHATSAPP:\s*'([^']*)'", codigo)
    if m_wpp and m_wpp.group(1).strip():
        num = m_wpp.group(1).strip()
        if not re.fullmatch(r"55\d{10,11}", num):
            bloqueio(
                "WhatsApp fora do formato E.164",
                f"CONFIG.WHATSAPP = '{num}'",
                "só dígitos, começando em 55. Ex.: 5511999999999. Com parêntese, "
                "traço ou espaço o wa.me diz 'número inválido' e a página não acusa",
            )

    # --- 8. o arquivo tem que se chamar index.html ---------------------------
    if caminho.name != "index.html":
        aviso(
            f"o arquivo se chama {caminho.name}",
            "o Vercel procura index.html na raiz por padrão",
            "renomeie pra index.html, senão a URL raiz dá 404",
        )


def main() -> int:
    if len(sys.argv) < 2:
        print("uso: python3 check_page.py index.html")
        return 2
    caminho = Path(sys.argv[1])
    if not caminho.exists():
        print(f"não achei {caminho}")
        return 2

    checar(caminho)

    for titulo, detalhe, conserto in BLOQUEIOS:
        print(f"\nBLOQUEIO · {titulo}")
        print(f"  o que eu vi ..... {detalhe}")
        print(f"  como conserta ... {conserto}")

    for titulo, detalhe, conserto in AVISOS:
        print(f"\naviso · {titulo}")
        print(f"  o que eu vi ..... {detalhe}")
        print(f"  o que fazer ..... {conserto}")

    print()
    if BLOQUEIOS:
        print(f"NÃO PUBLIQUE AINDA: {len(BLOQUEIOS)} bloqueio(s), {len(AVISOS)} aviso(s).")
        return 1

    print(f"Liberado pra publicar. {len(AVISOS)} aviso(s), nenhum bloqueio.")
    print("Falta o que este script não vê: abrir a página publicada em aba")
    print("anônima e mandar um lead de teste, conferindo a linha no Table Editor.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
