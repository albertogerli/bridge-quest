#!/usr/bin/env python3
"""
Test gpt-image-2 su una singola lezione FIGB per valutare qualita vs Gemini 3 Pro.
Lezione scelta: 209 - "Mani di Fit nel Nobile - Standard" (una delle piu dense).

Uso:
  OPENAI_API_KEY=sk-... python3 scripts/test-gpt-image-2.py

Output: public/infografiche/_test-gpt-image-2/lezione-209-junior.png
"""

import base64
import os
import sys
import time

from openai import OpenAI

API_KEY = os.environ.get("OPENAI_API_KEY", "")
if not API_KEY:
    raise SystemExit("Set OPENAI_API_KEY environment variable")

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "public/infografiche/_test-gpt-image-2",
)
os.makedirs(OUTPUT_DIR, exist_ok=True)

STYLE_PROMPT = """
Stile grafico OBBLIGATORIO:
- Infografica educativa verticale, stile vettoriale pulito e moderno
- Sfondo bianco con accenti azzurro FIGB (#0098D4) e dettagli colorati per i semi
- In alto: logo FIGB (4 diamanti azzurri con i simboli dei 4 semi: picche nero, cuori rosso, quadri rosso, fiori verde, sotto la scritta "FIGB" in azzurro)
- In basso a destra: "Maestro Franci" in corsivo azzurro
- Tavolo da bridge: panno verde visto dall'alto, forma rettangolare con bordi arrotondati, 4 posizioni (NORD, SUD, EST, OVEST)
- Semi delle carte: Picche (spade nero), Cuori (cuore rosso), Quadri (diamante rosso), Fiori (trifoglio nero/verde)
- Testo TUTTO in italiano, leggibile, font sans-serif pulito
- Layout adatto a stampa come dispensa A4
- NO scritte in inglese, NO "BridgeQuest"
- Icone e diagrammi semplici, chiari, educativi
- Target: ragazzi 8-17 anni, quindi colorato e accattivante ma non infantile
- Usa colori vivaci per evidenziare concetti importanti (rosso per attenzione, verde per corretto, blu per info)
"""

LEZIONE = {
    "id": "209",
    "titolo": "Mani di Fit nel Nobile - Standard",
    "contenuto": """
Visualizza questi concetti chiave:
1. TITOLO: "FIT nel Nobile: come comunicare la forza con l'appoggio"
2. TABELLA APPOGGI BARRAGE (box rosso):
   - Appoggio a 3 = fit QUARTO con 0-7 punti (barrage)
   - Appoggio a 4 = fit QUINTO con 0-7 punti (barrage chiusura)
   "Obiettivo: togliere spazio agli avversari!"
3. 2NT TRUSCOTT (box dorato con stella):
   "2NT = fit TERZO o QUARTO + invito manche (10-12 punti)"
   "NON e a senza! E' convenzionale!"
4. 1NT SEMIFORZANTE (box azzurro):
   "1NT = 5-11 punti, l'apertore DEVE ridichiarare"
   "L'apertore inventa una minore anche con solo 3 carte!"
5. APPOGGIO A 2 (box grigio):
   "Troppo forte per barrage a 3, troppo debole per 2NT Truscott"
   "Troppo bilanciato per barrage: usa appoggio a 2"
6. CON INTERVENTO AVVERSARIO (box giallo con freccia):
   "2NT Truscott diventa ILLIMITATA (11+ punti)!"
   "L'intervento cambia i significati"
7. Schema riassuntivo:
   0-7 + fit 4 = 3 nel nobile (barrage)
   0-7 + fit 5 = 4 nel nobile (barrage)
   8-9 = appoggio a 2
   10-12 = 2NT Truscott
""",
}


def build_prompt(lezione):
    return (
        f"Genera un'infografica educativa per la FIGB (Federazione Italiana Gioco Bridge).\n"
        f"Corso: Cuori Licita (Licita Avanzata)\n"
        f"Titolo: \"Lezione {lezione['id']}: {lezione['titolo']}\"\n\n"
        f"{lezione['contenuto']}\n\n"
        f"{STYLE_PROMPT}\n"
    )


def main():
    client = OpenAI(api_key=API_KEY)
    prompt = build_prompt(LEZIONE)

    print("=" * 60)
    print(f"TEST gpt-image-2 - Lezione {LEZIONE['id']}")
    print(f"Prompt chars: {len(prompt)}")
    print(f"Output dir: {OUTPUT_DIR}")
    print("=" * 60)

    t0 = time.time()
    try:
        resp = client.images.generate(
            model="gpt-image-2",
            prompt=prompt,
            size="1024x1536",  # ~A4 verticale
            quality="high",
            n=1,
        )
    except Exception as e:
        print(f"ERRORE API: {e}")
        sys.exit(1)

    elapsed = time.time() - t0
    print(f"Generato in {elapsed:.1f}s")

    b64 = resp.data[0].b64_json
    if not b64:
        print("Nessun b64_json nella risposta. Dump:")
        print(resp)
        sys.exit(1)

    img_bytes = base64.b64decode(b64)
    out_path = os.path.join(OUTPUT_DIR, f"lezione-{LEZIONE['id']}-junior.png")
    with open(out_path, "wb") as f:
        f.write(img_bytes)

    size_kb = len(img_bytes) / 1024
    print(f"OK  {out_path}  ({size_kb:.0f} KB)")
    print("\nApri il file per valutare qualita testo/layout/logo FIGB.")


if __name__ == "__main__":
    main()
