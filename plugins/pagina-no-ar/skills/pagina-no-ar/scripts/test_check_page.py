#!/usr/bin/env python3
"""
Testa o check_page.py nos DOIS sentidos.

Um verificador só vale se você provar que ele acusa quando é pra acusar E que
fica calado quando é pra ficar. Saída vazia é ambígua: pode ser "passou" ou
"não rodou".

Este arquivo existe porque o check de chave `service_role` passou no primeiro
teste sem estar funcionando. Ele procurava a string literal, e a chave de
verdade é um JWT, onde a palavra está em base64. O caso que mais importa era
justamente o cego.

    python3 test_check_page.py
"""

import base64
import re
import subprocess
import sys
import tempfile
from pathlib import Path

AQUI = Path(__file__).parent
CHECK = AQUI / "check_page.py"
TEMPLATE = AQUI.parent / "assets" / "index-template.html"


def jwt(papel: str) -> str:
    def b64(d: bytes) -> str:
        return base64.urlsafe_b64encode(d).decode().rstrip("=")

    cabecalho = b64(b'{"alg":"HS256","typ":"JWT"}')
    corpo = b64(('{"role":"%s","iss":"supabase"}' % papel).encode())
    return f"{cabecalho}.{corpo}.aSsInAtUrAfAlSa"


def pagina_pronta() -> str:
    """O template com tudo preenchido: tem que passar limpo."""
    s = TEMPLATE.read_text(encoding="utf-8")
    s = s.replace("SUPABASE_URL:   '',", "SUPABASE_URL:   'https://abcdefgh.supabase.co',")
    s = s.replace("SUPABASE_KEY:   '',", "SUPABASE_KEY:   'sb_publishable_aBcDeFgHiJkLmNoPqRs',")
    s = s.replace("WHATSAPP: '',", "WHATSAPP: '5511988887777',")
    s = s.replace("data:     '',", "data:     'Segunda, 25 de agosto',")
    s = s.replace("hora:     '',", "hora:     '20h00',")
    s = s.replace("duracao:  '',", "duracao:  '90 minutos',")
    return re.sub(r"\[FALTA:[^\]]*\]", "texto de verdade", s)


PRONTA = pagina_pronta()

CASOS = [
    # (nome, html, tem_que_bloquear, texto que precisa aparecer no bloqueio)
    ("template cru", TEMPLATE.read_text(encoding="utf-8"), True, "[FALTA:"),
    ("página pronta", PRONTA, False, None),
    ("chave publicável nova", PRONTA, False, None),
    ("chave anon em JWT antigo",
     PRONTA.replace("sb_publishable_aBcDeFgHiJkLmNoPqRs", jwt("anon")), False, None),
    ("chave service_role em JWT",
     PRONTA.replace("sb_publishable_aBcDeFgHiJkLmNoPqRs", jwt("service_role")), True, "service_role"),
    ("chave secreta formato novo",
     PRONTA.replace("sb_publishable_aBcDeFgHiJkLmNoPqRs", "sb_secret_ZzYyXxWwVvUu"), True, "secreta"),
    ("inject do live mode",
     PRONTA.replace("</body>", '<script src="http://localhost:8400/live.js"></script></body>'),
     True, "live mode"),
    ("whatsapp com máscara",
     PRONTA.replace("'5511988887777'", "'(11) 98888-7777'"), True, "E.164"),
    ("sem data",
     PRONTA.replace("data:     'Segunda, 25 de agosto',", "data:     '',"), True, "sem data"),
    ("preventDefault apagado por uma rodada de estética",
     PRONTA.replace("e.preventDefault();", ""), True, "preventDefault"),
    ("if (!r.ok) apagado",
     PRONTA.replace("if (!r.ok)", "if (false)"), True, "r.ok"),
    ("created_at no payload",
     PRONTA.replace("source_url: location.origin", "created_at: new Date().toISOString(),\n      source_url: location.origin"),
     True, "created_at"),
    ("aviso sobre service_role no comentário NÃO pode bloquear",
     PRONTA, False, None),

    # --- os que fazem o gate falhar ABERTO, que é pior que gate nenhum -------
    ("whatsapp torto escrito com ASPAS DUPLAS",
     PRONTA.replace("WHATSAPP: '5511988887777',", 'WHATSAPP: "(11) 98888-7777",'),
     True, "E.164"),
    ("data vazia escrita com ASPAS DUPLAS",
     PRONTA.replace("data:     'Segunda, 25 de agosto',", 'data:     "",'),
     True, "sem data"),
    ("config do Supabase pela metade",
     PRONTA.replace("SUPABASE_KEY:   'sb_publishable_aBcDeFgHiJkLmNoPqRs',", "SUPABASE_KEY:   '',"),
     True, "pela metade"),

    # --- campo novo no form que o payload joga fora --------------------------
    ("campo novo só no <form>, sem entrar no payload",
     PRONTA.replace('<label class="consent">',
                    '<label class="f"><span>Área</span><input type="text" name="area"></label>\n        <label class="consent">'),
     True, "joga fora"),
    ("campo novo em form E payload NÃO bloqueia",
     PRONTA.replace('<label class="consent">',
                    '<label class="f"><span>Área</span><input type="text" name="area"></label>\n        <label class="consent">')
           .replace("        source_url: location.origin", "        area: campo('area'),\n        source_url: location.origin"),
     False, None),
]


def rodar(html: str) -> tuple[int, str]:
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / "index.html"
        p.write_text(html, encoding="utf-8")
        r = subprocess.run(
            [sys.executable, str(CHECK), str(p)], capture_output=True, text=True
        )
        return r.returncode, r.stdout


def main() -> int:
    falhas = 0
    for nome, html, deve_bloquear, esperado in CASOS:
        codigo, saida = rodar(html)
        bloqueou = codigo == 1
        ok = bloqueou == deve_bloquear
        if ok and esperado:
            ok = esperado.lower() in saida.lower()
        print(f"{'PASS' if ok else 'FALHOU'}  {nome}")
        if not ok:
            falhas += 1
            print(f"        esperava bloquear={deve_bloquear}, bloqueou={bloqueou}")
            if esperado:
                print(f"        procurava '{esperado}' na saída")
            for linha in saida.splitlines():
                if "BLOQUEIO" in linha:
                    print(f"        {linha.strip()}")

    print()
    print(f"{len(CASOS) - falhas}/{len(CASOS)} passaram")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
