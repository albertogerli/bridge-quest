"""
Le dispense in inglese, rigenerate con OpenAI.

    OPENAI_API_KEY=sk-... python3 scripts/genera-dispense-inglese.py
    OPENAI_API_KEY=sk-... python3 scripts/genera-dispense-inglese.py --only fiori
    python3 scripts/genera-dispense-inglese.py --prova       # traduce e basta

PERCHÉ NON SI TRADUCONO, SI RIFANNO. Il testo delle dispense sta DENTRO
l'immagine: sono infografiche generate da un prompt che contiene le frasi da
disegnare. Non esiste un livello di testo da sostituire — l'unica strada è
rigenerare con il prompt tradotto.

DUE PASSAGGI, NON UNO. Si potrebbe dire al generatore di immagini «scrivi tutto
in inglese» e sperare: è il modo più veloce di ottenere una manche chiamata
*match* e una presa chiamata *hand*. Qui invece il prompt viene prima tradotto
da un modello di testo, con il glossario di bridge imposto come vincolo, e solo
dopo si genera l'immagine. Il prompt tradotto viene salvato accanto al file:
così un errore di terminologia si vede leggendo un file di testo, senza dover
guardare 238 immagini una per una.

IL GLOSSARIO È LA PARTE CHE CONTA. In un'infografica didattica una parola
sbagliata non è un refuso: è una regola sbagliata, stampata, che l'allievo
impara e porta al tavolo. Le corrispondenze qui sotto sono le stesse di
`docs/i18n-inglese.md` e sono in inglese americano (ACBL), come deciso.

DOVE FINISCONO. `public/infografiche/en/{seme}/…`, accanto alle italiane e con
gli stessi nomi: il codice sceglie la cartella in base alla lingua. Le
italiane non vengono toccate.

RIPARTIBILE: un file già presente viene saltato. Si può interrompere e
riprendere, il che su qualche centinaio di immagini serve davvero.
"""

import argparse
import base64
import importlib.util
import json
import os
import sys
import time
from pathlib import Path

SCRIPTS_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPTS_DIR.parent
USCITA = PROJECT_ROOT / "public" / "infografiche" / "en"

# Gli stessi quattro script che generano le italiane: le lezioni e lo stile si
# leggono da lì, così non esiste una seconda lista da tenere allineata.
CORSI = [
    {"seme": "fiori", "script": "generate-infografiche.py"},
    {"seme": "quadri", "script": "generate-infografiche-quadri.py"},
    {"seme": "cuori-gioco", "script": "generate-infografiche-cuori-gioco.py"},
    {"seme": "cuori-licita", "script": "generate-infografiche-cuori-licita.py"},
]

GLOSSARIO = """
licita, dichiarazione = bidding / the auction / a bid
smazzata = deal        mano = hand           presa = trick
atout = trump          contro = double       surcontro = redouble
manche = game (MAI "match")                  parziale = part score
slam = slam            cadere di due = to go down two
dichiarante = declarer morto = dummy         apertore = opener
taglio = ruff          impasse = finesse     affrancare = to establish
attacco = opening lead punti onori = high card points (HCP)
in zona = vulnerable   fuori zona = not vulnerable
Nord/Sud/Est/Ovest = North/South/East/West
Fiori/Quadri/Cuori/Picche = Clubs/Diamonds/Hearts/Spades
"""

ISTRUZIONI_TRADUZIONE = f"""Sei un traduttore tecnico di bridge. Traduci in
INGLESE AMERICANO (terminologia ACBL) il prompt qui sotto, che serve a generare
un'infografica didattica.

REGOLE
1. Traduci SOLO i testi che finiranno disegnati nell'immagine. Le istruzioni
   grafiche (colori, disposizione, stile) traducile pure, ma non cambiarle.
2. Usa ESATTAMENTE questa terminologia, senza sinonimi:
{GLOSSARIO}
3. Non aggiungere, non togliere e non «migliorare» il contenuto didattico: una
   regola di bridge riscritta meglio è una regola diversa.
4. Le sigle restano: FIGB, HCP, IMP.
5. LE ISTRUZIONI SULLA LINGUA VANNO ROVESCIATE, non tradotte. Il prompt
   italiano contiene righe come «TUTTO il testo in italiano» e «NESSUNA
   scritta in inglese»: tradotte alla lettera diventano «ALL text in Italian»,
   e il generatore di immagini obbedisce — producendo un'infografica italiana
   a partire da un prompt inglese. È successo davvero, alla prima prova.
   Sostituiscile con «ALL text in AMERICAN ENGLISH» e «NO Italian text».
6. Rispondi con il solo prompt tradotto, senza commenti.

PROMPT DA TRADURRE:
"""


def carica_modulo(nome: str):
    """Importa uno degli script italiani per prenderne LEZIONI e STYLE_PROMPT."""
    percorso = SCRIPTS_DIR / nome
    if not percorso.exists():
        return None
    spec = importlib.util.spec_from_file_location(percorso.stem.replace("-", "_"), percorso)
    modulo = importlib.util.module_from_spec(spec)
    # Gli script canonici richiedono la chiave Gemini per costruirsi l'URL: qui
    # non la useremo mai, ma senza il modulo si rifiuta di caricare.
    os.environ.setdefault("GEMINI_API_KEY", "non-usata-qui")
    try:
        spec.loader.exec_module(modulo)
    except SystemExit:
        return None
    return modulo


def traduci_prompt(client, testo: str) -> str:
    risposta = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": ISTRUZIONI_TRADUZIONE + testo}],
        temperature=0,
    )
    return risposta.choices[0].message.content.strip()


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--only", help="un solo corso: fiori, quadri, cuori-gioco, cuori-licita")
    p.add_argument("--prova", action="store_true", help="traduce i prompt e si ferma lì")
    p.add_argument("--modello-immagini", default="gpt-image-2")
    p.add_argument("--quante", type=int, default=0,
                   help="fermati dopo N immagini: si guarda il risultato prima di lanciarle tutte")
    args = p.parse_args()

    chiave = os.environ.get("OPENAI_API_KEY", "")
    if not chiave and not args.prova:
        print("Serve OPENAI_API_KEY. Con --prova si possono tradurre i prompt senza generare.")
        return 1

    try:
        from openai import OpenAI
    except ImportError:
        print("Manca il pacchetto openai:  pip3 install openai")
        return 1

    client = OpenAI(api_key=chiave) if chiave else None
    if client is None:
        print("Senza chiave si può solo contare quante dispense servono.\n")

    fatte = saltate = fallite = 0
    for corso in CORSI:
        if args.only and corso["seme"] != args.only:
            continue
        modulo = carica_modulo(corso["script"])
        if modulo is None or not hasattr(modulo, "LEZIONI"):
            print(f"! {corso['seme']}: non riesco a leggere le lezioni da {corso['script']}")
            continue

        cartella = USCITA / corso["seme"]
        cartella.mkdir(parents=True, exist_ok=True)
        stile = getattr(modulo, "STYLE_PROMPT", "")

        for lezione in modulo.LEZIONI:
            # `.jpg` come le italiane: il codice costruisce il percorso con
            # quell'estensione, e un `.png` accanto a un `.jpg` atteso dà 404 in
            # produzione senza che niente si lamenti in fase di build (successo
            # il 19/08/2026). Pesano anche un terzo.
            nome = f"lezione-{str(lezione['id']).zfill(2)}-junior.jpg"
            destinazione = cartella / nome
            if destinazione.exists():
                saltate += 1
                continue

            # La stessa forma dello script italiano: titolo, contenuto, stile.
            # ATTENZIONE — il campo si chiama `contenuto`, non `prompt`: con la
            # chiave sbagliata `get` restituisce una stringa vuota senza
            # protestare, e resta solo lo stile. Sono uscite 49 infografiche
            # tutte uguali, introduzioni generiche al bridge senza la lezione
            # dentro (19/08/2026). Se un domani cambia il nome del campo, meglio
            # che esploda qui che stampare 49 dispense mute.
            titolo = lezione["titolo"]
            contenuto = lezione["contenuto"]
            prompt_it = (
                f"Genera un'infografica educativa per la FIGB "
                f"(Federazione Italiana Gioco Bridge).\n\n"
                f'Titolo: "Lezione {lezione["id"]}: {titolo}"\n\n'
                f"{contenuto}\n\n{stile}"
            )
            if client is None:
                fatte += 1
                continue
            prompt_en = traduci_prompt(client, prompt_it)
            # Cintura oltre alle bretelle: qualunque cosa abbia deciso il
            # traduttore, l'ultima parola sulla lingua è questa. Va in fondo
            # perché in un prompt lungo l'ultima istruzione è quella che pesa.
            prompt_en += (
                "\n\nLANGUAGE — THIS OVERRIDES ANYTHING ABOVE: every single word "
                "rendered inside the image must be in AMERICAN ENGLISH. No Italian "
                "text anywhere, including headings, labels, table seats and captions. "
                "Use North / South / East / West for the seats and Spades / Hearts / "
                "Diamonds / Clubs for the suits."
            )
            # Il prompt tradotto si conserva: è l'unico modo di rileggere cosa
            # è stato chiesto senza riaprire l'immagine.
            (cartella / (nome.replace(".jpg", ".prompt.txt"))).write_text(prompt_en, encoding="utf-8")

            if args.prova:
                print(f"  tradotto {corso['seme']}/{nome}")
                fatte += 1
                continue

            try:
                immagine = client.images.generate(
                    model=args.modello_immagini,
                    prompt=prompt_en,
                    size="1024x1536",
                    quality="high",
                    n=1,
                )
                # Il modello restituisce PNG: si converte, perché il nome del
                # file deve corrispondere a quello che il sito va a cercare.
                grezzo = base64.b64decode(immagine.data[0].b64_json)
                try:
                    from io import BytesIO
                    from PIL import Image

                    Image.open(BytesIO(grezzo)).convert("RGB").save(
                        destinazione, "JPEG", quality=82, optimize=True
                    )
                except ImportError:
                    # Senza Pillow si salva il PNG e si converte a mano con
                    # `sips`: meglio un file nel formato sbagliato che nessuno.
                    destinazione.with_suffix(".png").write_bytes(grezzo)
                    print("    (Pillow assente: salvato .png, converti con sips)")
                fatte += 1
                print(f"  {corso['seme']}/{nome}")
            except Exception as errore:  # noqa: BLE001 — si continua col resto
                fallite += 1
                print(f"  ! {corso['seme']}/{nome}: {errore}")
            if args.quante and fatte >= args.quante:
                print(f"\nfermato dopo {fatte}: guarda il risultato prima di continuare.")
                return 0
            time.sleep(1)

    print(f"\nfatte {fatte}, saltate {saltate} (già presenti), fallite {fallite}")
    print(f"in {USCITA.relative_to(PROJECT_ROOT)}")
    return 0 if not fallite else 1


if __name__ == "__main__":
    sys.exit(main())
