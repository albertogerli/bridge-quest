#!/usr/bin/env python3
"""
Fase A: rigenera TUTTE le dispense A4 (profilo Junior) con gpt-image-2.

Importa LEZIONI e STYLE_PROMPT dai 4 script canonici e lancia un batch unico.
Salva in public/infografiche/{seme}/lezione-{id}-junior-v2.png per non
sovrascrivere gli originali Gemini.

Uso:
  OPENAI_API_KEY=sk-... python3 scripts/generate-all-gpt-image-2.py [--only fiori]

Log progressi su stdout + scrive scripts/gpt-image-2-run.log.
"""

import argparse
import base64
import importlib.util
import os
import sys
import time
from pathlib import Path

from openai import OpenAI

SCRIPTS_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPTS_DIR.parent
INFOGRAFICHE_DIR = PROJECT_ROOT / "public" / "infografiche"

COURSES = [
    {"seme": "fiori",        "script": "generate-infografiche.py",              "corso_label": "Corso Fiori (Principianti)"},
    {"seme": "quadri",       "script": "generate-infografiche-quadri.py",       "corso_label": "Corso Quadri (Base)"},
    {"seme": "cuori-licita", "script": "generate-infografiche-cuori-licita.py", "corso_label": "Corso Cuori Licita (Licita Avanzata)"},
    {"seme": "cuori-gioco",  "script": "generate-infografiche-cuori-gioco.py",  "corso_label": "Corso Cuori Gioco (Gioco Avanzato)"},
]

# ---------- Import helper ----------

def load_course_data(script_path: Path):
    """Import LEZIONI e STYLE_PROMPT dallo script Gemini senza eseguirlo full."""
    # Evita raise SystemExit nel check GEMINI_API_KEY in cima.
    os.environ.setdefault("GEMINI_API_KEY", "__dummy__")

    module_name = script_path.stem.replace("-", "_")
    spec = importlib.util.spec_from_file_location(module_name, script_path)
    mod = importlib.util.module_from_spec(spec)

    # Evita che un eventuale main() parta: il modulo usa `if __name__ == "__main__"`.
    spec.loader.exec_module(mod)

    if not hasattr(mod, "LEZIONI"):
        raise RuntimeError(f"{script_path.name}: manca LEZIONI")
    if not hasattr(mod, "STYLE_PROMPT"):
        raise RuntimeError(f"{script_path.name}: manca STYLE_PROMPT")
    return mod.LEZIONI, mod.STYLE_PROMPT


# ---------- Prompt + API ----------

EXTRA_RULES = """
REGOLE AGGIUNTIVE FONDAMENTALI (rispetta ALLA LETTERA):

LINGUA ITALIANA (CRITICO - riletto 3 volte prima di finalizzare):
- USA SEMPRE ACCENTI TIPOGRAFICI UNICODE, MAI apostrofo ASCII al loro posto:
  * "e'" SBAGLIATO -> "e" accento grave GIUSTO (come in "cio che e' vero")
  * "piu'" SBAGLIATO -> "piu" con accento acuto finale (come "di piu")
  * "puo'" SBAGLIATO -> "puo" con accento grave finale
  * "gia'" SBAGLIATO -> "gia" con accento acuto finale
  * "perche'" SBAGLIATO -> "perche" con accento acuto finale
  * "cosi'" SBAGLIATO -> "cosi" con accento acuto finale
  * "sara'" SBAGLIATO -> "sara" con accento grave finale
  * "citta'" SBAGLIATO -> "citta" con accento grave finale
  NON usare MAI apostrofo ASCII come accento. Le parole italiane che finiscono con vocale accentata richiedono il CARATTERE UNICODE accentato (U+00E0 a grave, U+00E8 e grave, U+00EC i grave, U+00F2 o grave, U+00F9 u grave, U+00E9 e acuto).
- Apostrofi tipografici curly SOLO per elisione (l'apertore, l'Asso, un'apertura). Mai ASCII ' nelle parole intere.
- NO inglese. "OR" -> "O" o "OPPURE". "WEST" -> "OVEST". "EAST" -> "EST". Mai "TOEST" o "OEST".
- Zero parole inventate: rileggi ogni parola prima di finalizzare.

SEZIONI NUMERATE (CRITICO):
- Se il brief lista sezioni numerate (1, 2, 3, ..., 7), riproducile TUTTE come sezioni DISTINTE.
- Non duplicare mai il contenuto di una sezione in un'altra (es. due box "SURLICITA LIBERA" identici).
- Ogni sezione numerata = un riquadro visivamente distinto con titolo diverso.
- Prima di finalizzare: rileggi i titoli dei box e verifica che siano tutti diversi.

TAVOLO DA BRIDGE:
- Posizioni SEMPRE scritte: NORD in alto, SUD in basso, EST a destra, OVEST a sinistra. Mai WEST/EAST/TOEST.
- Se mostri 4 mani: ogni mano ha ESATTAMENTE 13 carte totali. Ogni seme del mazzo ha ESATTAMENTE 13 carte totali tra le 4 mani (1+2+3+4+5+6+7+8+9+10+J+Q+K+A = 13).
- Se il testo dice "AKJ875" o una combinazione specifica, mostrala ESATTAMENTE con le carte citate, stesso numero di carte.

COLORI DEI SEMI (rigido):
- Picche (P): NERO #1a1a2e
- Cuori (C): ROSSO #B91C1C
- Quadri (Q): ROSSO #B91C1C
- Fiori (F): VERDE #15803d (sistema a 4 colori europeo). Mai nero per fiori!

LOGO FIGB (in alto a sinistra, disposizione OBBLIGATORIA fissa):
- 4 diamanti azzurri #0098D4 disposti a rombo:
  - SOPRA: P (picche nero)
  - DESTRA: C (cuori rosso)
  - SINISTRA: Q (quadri rosso)
  - SOTTO: F (fiori verde)
- Sotto i 4 diamanti, scritta "FIGB" azzurro
- NON cambiare mai questa disposizione tra un'infografica e l'altra

CONTENUTO TECNICO FIGB STANDARD:
- Apertura 1NT = 15-17 punti bilanciata (4333, 4432, 5332)
- Rebid 1NT (apertore dopo risposta a colore) = 12-14 punti
- Salto a 2NT dell'apertore = 18-19 bilanciata con fermo
- Apertura 2NT = 20-21 punti bilanciata
- Apertura 2F forte = 22+ punti
- Slam piccolo = 33+ punti coppia. Grande slam = 37+ punti coppia
- Manche = 25+ punti coppia
- Stayman 2F: risposte 2Q (no nobile 4), 2C (4 cuori), 2P (4 picche). NON esiste 2NT!
- Contro informativo: 12+ punti, CORTO nel colore avversario, 3+ carte in ogni altro colore. NON e' mai "bilanciato con fermo" (quello e' 1NT).
- Rivalutazione: per MANO SINGOLA (rispondente), non su fit totale. Doubleton +1, singolo +3, vuoto +5.

CONVENZIONI (se menzionate, usa lo schema ESATTO dalla lezione, non inventare):
- Ghestem: 2NT = due colori inferiori; 3F = due estremi; cue-bid = due intermedi
- Truscott 2NT: fit 3 o 4 + invito manche (10-12 punti), convenzionale, non NT naturale
- Multicolor 2Q: apertura 2Q debole con una lunga nobile
- Michael's cue-bid su 1C = picche + una minore; su 1P = cuori + una minore; almeno 5-5
- Texas/Jacoby: 2Q = transfer per cuori; 2C = transfer per picche
- Landy 2F su 1NT avversario = 5-4+ nelle nobili

DIFESA / CONTROGIOCO:
- Segnali di scarto usano SCARTINE (2-9), MAI onori (A, K, Q, J)
- In difesa: prima del morto = basso di sequenza; seconda posizione = piccola su piccola

METAFORE E ICONE:
- MAI icone letterali strane come "Sputnik", "bomba atomica", animali casuali
- Usa icone pulite educative: lampadine (idea), frecce (flusso), check/X (si/no), stelle (importante), scudi (difesa), corone (forza)

QUALITA' TESTO:
- RILEGGI ogni parola prima di finalizzare. Tutte le parole devono esistere in italiano.
- Zero typo tipo "olstribuzione", "li contro", "toestv". Rileggi.
- Un solo header principale per pagina, mai duplicati.
"""


def build_prompt(corso_label: str, lezione: dict, style_prompt: str) -> str:
    return (
        f"Genera un'infografica educativa per la FIGB (Federazione Italiana Gioco Bridge).\n"
        f"Corso: {corso_label}\n"
        f"Titolo: \"Lezione {lezione['id']}: {lezione['titolo']}\"\n\n"
        f"{lezione['contenuto']}\n\n"
        f"{style_prompt}\n\n"
        f"{EXTRA_RULES}\n"
    )


def generate_one(client: OpenAI, prompt: str, out_path: Path, retries: int = 2) -> tuple[bool, float, int]:
    """Ritorna (ok, elapsed_s, size_kb)."""
    attempt = 0
    while True:
        t0 = time.time()
        try:
            resp = client.images.generate(
                model="gpt-image-2",
                prompt=prompt,
                size="1024x1536",
                quality="high",
                n=1,
            )
            elapsed = time.time() - t0
            b64 = resp.data[0].b64_json
            if not b64:
                raise RuntimeError("b64_json vuoto")
            img_bytes = base64.b64decode(b64)
            out_path.parent.mkdir(parents=True, exist_ok=True)
            out_path.write_bytes(img_bytes)
            return True, elapsed, len(img_bytes) // 1024
        except Exception as e:
            elapsed = time.time() - t0
            print(f"    ERRORE (tentativo {attempt+1}): {e}")
            attempt += 1
            if attempt > retries:
                return False, elapsed, 0
            time.sleep(10)


# ---------- Main ----------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="Genera solo questo corso (fiori/quadri/cuori-licita/cuori-gioco)")
    parser.add_argument("--suffix", default="v2", help="Suffix del filename (default: v2)")
    parser.add_argument("--skip-existing", action="store_true", help="Salta se il file esiste gia")
    parser.add_argument(
        "--lessons",
        help="Filtro per lezioni specifiche. Formato: 'seme:id1,id2;seme2:id3,id4'. "
             "Es: 'fiori:05,10,11;quadri:4,10,11,12'",
    )
    args = parser.parse_args()

    # Parse lesson filter
    lesson_filter = {}  # {seme: set(ids)}
    if args.lessons:
        for part in args.lessons.split(";"):
            if ":" not in part:
                continue
            seme, ids = part.split(":", 1)
            lesson_filter[seme.strip()] = {i.strip() for i in ids.split(",") if i.strip()}

    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        raise SystemExit("Set OPENAI_API_KEY")

    client = OpenAI(api_key=api_key)
    log_path = SCRIPTS_DIR / "gpt-image-2-run.log"
    log_f = log_path.open("a")

    def log(msg: str):
        print(msg, flush=True)
        log_f.write(msg + "\n")
        log_f.flush()

    log("=" * 70)
    log(f"gpt-image-2 batch start: {time.strftime('%Y-%m-%d %H:%M:%S')}")

    # 1) Carica tutte le lezioni
    jobs = []  # list of (seme, corso_label, lezione, style)
    for c in COURSES:
        if args.only and c["seme"] != args.only:
            continue
        # Se lesson_filter e' attivo, processa solo i corsi menzionati
        if lesson_filter and c["seme"] not in lesson_filter:
            continue
        script_path = SCRIPTS_DIR / c["script"]
        lezioni, style = load_course_data(script_path)
        log(f"  {c['seme']}: {len(lezioni)} lezioni caricate da {c['script']}")
        course_ids = lesson_filter.get(c["seme"]) if lesson_filter else None
        for lez in lezioni:
            if course_ids is not None and str(lez["id"]) not in course_ids:
                continue
            jobs.append((c["seme"], c["corso_label"], lez, style))

    log(f"TOT lezioni da generare: {len(jobs)}")
    log("")

    # 2) Batch
    ok_count = 0
    fail_count = 0
    skip_count = 0
    total_kb = 0
    total_time = 0.0
    t_start = time.time()

    for i, (seme, corso_label, lez, style) in enumerate(jobs, 1):
        out_path = INFOGRAFICHE_DIR / seme / f"lezione-{lez['id']}-junior-{args.suffix}.png"
        if args.skip_existing and out_path.exists():
            log(f"[{i:02d}/{len(jobs)}] SKIP (esiste) {out_path.relative_to(PROJECT_ROOT)}")
            skip_count += 1
            continue

        prompt = build_prompt(corso_label, lez, style)
        log(f"[{i:02d}/{len(jobs)}] {seme} lezione {lez['id']}: {lez['titolo']}")
        ok, elapsed, size_kb = generate_one(client, prompt, out_path)
        total_time += elapsed

        if ok:
            ok_count += 1
            total_kb += size_kb
            log(f"    OK {elapsed:.0f}s  {size_kb} KB  -> {out_path.relative_to(PROJECT_ROOT)}")
        else:
            fail_count += 1
            log(f"    FAIL dopo {elapsed:.0f}s")

        # rate-limit soft: pausa breve tra chiamate
        if i < len(jobs):
            time.sleep(2)

    wall = time.time() - t_start
    log("")
    log("=" * 70)
    log(f"FINE. ok={ok_count} fail={fail_count} skip={skip_count}")
    log(f"Wall time: {wall/60:.1f} min  |  API time: {total_time/60:.1f} min")
    log(f"Totale output: {total_kb/1024:.1f} MB")
    log(f"Costo stimato (~$0.08/img high): ~${ok_count * 0.08:.2f}")
    log_f.close()


if __name__ == "__main__":
    main()
