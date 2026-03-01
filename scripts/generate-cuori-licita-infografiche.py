#!/usr/bin/env python3
"""
Generate 14 infographic images for FIGB Corso Cuori Licita (Junior - Maestro Franci)
using Gemini API image generation.
"""

import json
import base64
import time
import os
import ssl
import urllib.request
import urllib.error
from pathlib import Path

API_KEY = "AIzaSyAB_VB1vU6eqJLf5OE_5OYeE5Gr571wUKs"
MODEL = "gemini-3-pro-image-preview"
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent?key=" + API_KEY

OUTPUT_DIR = Path("/Users/albertogiovannigerli/Desktop/Personale/Bridge/bridgequest/public/infografiche/cuori-licita")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

STYLE = (
    "STILE OBBLIGATORIO per questa infografica: "
    "Infografica educativa VERTICALE, stile vettoriale moderno e pulito, adatta a stampa A4. "
    "Sfondo BIANCO con accenti blu FIGB (#0098D4) e tocchi di rosso per i cuori. "
    "IN ALTO: logo FIGB stilizzato (4 quadrati/diamanti blu con i simboli dei semi: picche nero, cuori rosso, quadri rosso, fiori verde, scritta FIGB sotto). "
    "IN BASSO A DESTRA: scritta Maestro Franci in corsivo blu. "
    "TAVOLO DA BRIDGE visto dall alto: panno verde, 4 posizioni (NORD, SUD, EST, OVEST) dove rilevante. "
    "Semi delle carte: Picche (spade nero), Cuori (cuore rosso), Quadri (rombo rosso), Fiori (trifoglio nero/verde). "
    "TUTTO il testo in ITALIANO, font sans-serif leggibile e pulito. "
    "Layout adatto a stampa A4 come dispensa di studio. "
    "NESSUN testo in inglese, NESSUNA scritta BridgeQuest. "
    "Target: ragazzi 8-17 anni, colorato e coinvolgente ma chiaro e didattico. "
    "Usa icone, frecce, box colorati e diagrammi per rendere i concetti visivi. "
    "Numeri e formule in evidenza con box o cerchi colorati."
)

LESSONS = [
    {
        "id": 200,
        "title": "La Legge delle Prese Totali",
        "prompt": (
            "Crea un infografica educativa sul bridge per ragazzi (8-17 anni) con titolo grande: "
            "LEZIONE 1 LA LEGGE DELLE PRESE TOTALI. "
            "Contenuti: 1) FORMULA CENTRALE in grande box blu: Prese Totali = Somma di TUTTE le Atout delle due coppie. "
            "Esempio: NS hanno 8 picche + EO hanno 9 cuori = 17 Prese Totali. "
            "2) REGOLA D ORO: Il tuo livello di sicurezza = numero delle tue atout in linea. "
            "Tabella: 8 atout=livello 2, 9 atout=livello 3, 10 atout=livello 4. "
            "3) Box giallo ATTENZIONE: Distribuzioni PIATTE (5332, 4333) = PRUDENZA! Meno prese del previsto. "
            "4) Box verde BONUS +1: Singolo nel colore avversario o Doppio fit = dichiara uno in piu. "
            "5) FIGURE SOFT vs PURE: box rosso QJ nei colori avversari riducono le prese, box verde Mani pure piu prese. "
            "6) Esempio al tavolo: Compagno apre 1 fiori, avversario dice 1 picche, tu hai fit nono, dici 3 fiori (9 atout = 9 prese). "
            "7) Box rosso ERRORE: Non confondere rialzo COMPETITIVO con INVITO a manche! " + STYLE
        )
    },
    {
        "id": 201,
        "title": "Le Lunghe e le Corte",
        "prompt": (
            "Crea un infografica educativa sul bridge per ragazzi (8-17 anni) con titolo grande: "
            "LEZIONE 2 LE LUNGHE E LE CORTE. "
            "Contenuti: 1) Box grande: Il fit da solo NON basta! Servono CORTE (per tagliare) o LUNGHE (da affrancare). "
            "2) I SINGOLI: I singoli di prese NON ne fanno, e la carta di ATOUT che taglia! Solo l Asso e utile davanti a un singolo. I singoli si RACCONTANO e il partner VALUTA. "
            "3) MONOCOLORI 7+: Con 7+ carte quel colore DEVE essere atout. Con un ottava ignora i punti! Esempio: 763/J1076542/-/864 su 2NT dici 4 cuori. "
            "4) Box blu: Non nascondere le lunghe dietro al Contro Sputnik! "
            "5) MANI 7/4 e 7/5: Sono mani MONOCOLORI, non tradire la lunga. "
            "6) Box rosso ERRORE: Nascondere una settima/ottava dietro il Contro = la lunga diventa irraggiungibile! " + STYLE
        )
    },
    {
        "id": 202,
        "title": "Le Texas su 1NT e 2NT",
        "prompt": (
            "Crea un infografica educativa sul bridge per ragazzi (8-17 anni) con titolo grande: "
            "LEZIONE 3 LE TEXAS TRANSFER SU 1NT E 2NT. "
            "Contenuti: 1) Per mostrare un colore dichiara quello IMMEDIATAMENTE INFERIORE. 2 quadri = almeno 5 cuori, 2 cuori = almeno 5 picche. "
            "Vantaggi: orienta il gioco dalla mano forte + moltiplica le licite. "
            "2) CONTINUAZIONI dopo 1NT-2quadri-2cuori: Passo=parziale, 3cuori=invitante, 4cuori=manche, 2NT=bilanciata invitante, 3NT=bilanciata manche, 4NT=quantitativo NON Blackwood. "
            "3) SUPER-ACCETTAZIONE box verde: Apertore con fit quarto e mano massima salta a 3 nel colore. "
            "4) STAYMAN A 6 GRADINI: 2fiori allora 2quadri, 2cuori, 2picche, 2NT, 3fiori, 3quadri con significati specifici. "
            "5) TRANSFER MINORI box arancio: 2picche=6+fiori, 2NT=6+quadri. "
            "6) Dopo 2NT: 3fiori=Stayman, 3quadri=5+cuori, 3cuori=5+picche. " + STYLE
        )
    },
    {
        "id": 203,
        "title": "Sviluppi dopo 2 su 1",
        "prompt": (
            "Crea un infografica educativa sul bridge per ragazzi (8-17 anni) con titolo grande: "
            "LEZIONE 4 SVILUPPI DOPO LE RISPOSTE 2 SU 1. "
            "Contenuti: 1) REGOLA box blu: 2 su 1 = FORZANTE DI MANCHE con 3 eccezioni (passato, intervento colore, intervento Contro). "
            "2) Schema dopo 1fiori-2fiori: 2quadri=Diritto, 2cuori/2picche=Rever quarta nobile, 2NT=Rever senza, 3fiori/3quadri=Rever. "
            "3) Ridichiarazioni dopo 1maggiore-2x: Colore nuovo liv.2=11-21pt, Ripetizione nobile NON allunga NON limita, 2NT=12-14 unica che limita, Colore nuovo liv.3=15+ o 5-5. "
            "4) STRUMENTI RISPONDENTE box verde: Colore morto=problema fermi, 2NT=disinteresse fermi, Riporto a 2=tolleranza, Rialzo a 3=slam, Quarto colore=chiede fermo. "
            "5) Box rosso ERRORE: Non dire 2NT con fermi scoperti! " + STYLE
        )
    },
    {
        "id": 204,
        "title": "Fissare l Atout per lo Slam",
        "prompt": (
            "Crea un infografica educativa sul bridge per ragazzi (8-17 anni) con titolo grande: "
            "LEZIONE 5 FISSARE L ATOUT PER LO SLAM. "
            "Contenuti: 1) Due box: BLU TERRENO SOLIDO 21+ punti Atout sotto manche FORZANTE. ARANCIO TERRENO NON SOLIDO meno 21 Atout sotto manche INVITANTE passabile. "
            "2) DUE DOMANDE: Il compagno puo accontentarsi? Aveva strade piu forti? Se SI a entrambe PASSABILE. "
            "3) FISSARE CON MINORE: Slam parte solo SUPERANDO 3NT. Spazio sotto 3NT per FERMI. "
            "4) TRUCCO: QUARTO COLORE per terreno solido RITARDATO poi appoggia sotto manche FORZANTE. "
            "5) Box rosso COMPETIZIONE: Rialzo diretto SOLO competitivo. Per fissare forte prima SURLICITA poi fissa. " + STYLE
        )
    },
    {
        "id": 205,
        "title": "Le Cue Bid per lo Slam",
        "prompt": (
            "Crea un infografica educativa sul bridge per ragazzi (8-17 anni) con titolo grande: "
            "LEZIONE 6 LE CUE BID PER LO SLAM. "
            "Contenuti: 1) Cue Bid = dichiarazione illogica che mostra CONTROLLO. Primo giro: Asso/Vuoto. Secondo: Re/Singolo. Terzo: Dama. Controllo diverso da Fermo! "
            "2) 4 REGOLE: 1-MAI cue bid nel colore atout, 2-Sempre PIU ECONOMICA, 3-Saltata=non ce il compagno che prosegue PROMETTE, 4-Saltata poi fatta=terzo giro Dama. "
            "3) 4 FASI Slam: Fissare atout, Verificare controlli (sotto manche OBBLIGATORIE), Ridefinire forza, 4NT RKCB solo chi non si e limitato. "
            "4) Box rosso: NON negare cue bid con mano minima sotto manche sono OBBLIGATORIE! " + STYLE
        )
    },
    {
        "id": 206,
        "title": "Le Sottoaperture",
        "prompt": (
            "Crea un infografica educativa sul bridge per ragazzi (8-17 anni) con titolo grande: "
            "LEZIONE 7 LE SOTTOAPERTURE. "
            "Contenuti: 1) Box blu: 2quadri, 2cuori, 2picche = 6 CARTE 6-10 PUNTI. 2fiori resta FORTE. INTERDITTIVE Rispondente CAPITANO. "
            "2) Requisiti: 2cuori/2picche almeno A o K oppure Q con 10. 2quadri 2 onori maggiori. MAI con quarta maggiore a fianco! "
            "3) Risposte: Colore nuovo 5+carte 14+pt FORZANTE. Rialzo 3 DECISIONALE NON invito. Rialzo 4 DECISIONALE. 2NT=OGUST. "
            "4) OGUST tabella: 3fiori=minimo brutto, 3quadri=minimo bello, 3cuori=massimo brutto, 3picche=massimo bello, 3NT=AKQxxx. "
            "5) Esempio: picche KQ10953 cuori 87 quadri 984 fiori Q7 apre 2picche su 2NT dice 3quadri minimo bello. " + STYLE
        )
    },
    {
        "id": 207,
        "title": "Apertura 2 Fiori Forte",
        "prompt": (
            "Crea un infografica educativa sul bridge per ragazzi (8-17 anni) con titolo grande: "
            "LEZIONE 8 APERTURA DI 2 FIORI FORTE. "
            "Contenuti: 1) 2fiori = UNICA apertura FORTE. Nessun limite. CAPITANO e Apertore. Con mano base minore FORCING MANCHE. "
            "2) Risposte: 2quadri=ATTESA frequente. 2cuori/2picche=5+carte+onore+5pt FM. 3fiori/3quadri=5+con 3 onori. 2NT=5-7pt 4333 no Asso no 2Re. "
            "3) Su 2quadri: 2NT=bilanciata 23+ FM. 2cuori/2picche=NON FM fino ritorno. 3cuori/3picche=monocolore chiusa impone atout. "
            "4) POSSESSO BOARD box verde: o giochiamo NOI o loro CONTRATI. Contro fino 3picche PUNITIVO. Oltre: Contro mano nulla Passo carte utili. " + STYLE
        )
    },
    {
        "id": 208,
        "title": "Competitivo Costruttivo Interdittivo",
        "prompt": (
            "Crea un infografica educativa sul bridge per ragazzi (8-17 anni) con titolo grande: "
            "LEZIONE 9 COMPETITIVO COSTRUTTIVO INTERDITTIVO. "
            "Contenuti: 1) TRE CATEGORIE box colorati: VERDE COMPETITIVO lotta parziale colori da giocare NON a salto. "
            "BLU COSTRUTTIVO tentativo manche/slam valori esterni Contro Surlicita Cambio colore. "
            "ROSSO INTERDITTIVO prese attacco zero difesa SEMPRE a SALTO al MASSIMO livello PRIMA occasione demanda al compagno. "
            "2) Riconoscere COMPETITIVA: sistema la definisce, alternative forti esistevano, coppia ha detto no manche. "
            "3) TRAPPOLA: 1cuori-Passo-2cuori-Passo-3cuori NON invito ma INTERDITTIVO lunghezza extra. "
            "4) ESEMPI: Con KQJ76/75/KQJ9/32 su 3cuori dici 3picche competitivo. Con A8762/A5/AQ2/KJ2 dici CONTRO costruttivo. " + STYLE
        )
    },
    {
        "id": 209,
        "title": "Fit nel Nobile Standard",
        "prompt": (
            "Crea un infografica educativa sul bridge per ragazzi (8-17 anni) con titolo grande: "
            "LEZIONE 10 MANI DI FIT NEL NOBILE STANDARD. "
            "Contenuti: 1) BARRAGE: 3 nobile=fit QUARTO 0-7pt sbilanciata, 4 nobile=fit QUINTO 0-7pt. ESATTA lunghezza fit. "
            "2) 2NT TRUSCOTT box blu: Fit terzo/quarto INVITO manche 10-12pt. NON fermi NON bilanciata. Fit terzo serve corta 11-12. Fit quarto 10 anche 9. "
            "Su 2NT: 3atout rifiuta, manche accetta, colore laterale aiuto. "
            "3) 1NT SEMIFORZANTE box verde: 5-11pt. 5332 minima puo passare. 13-14 tiene aperta. Inventa minore terzo. "
            "4) APPOGGIO 2: 5-9/10pt fit terzo/quarto bilanciato. "
            "5) DOPO INTERVENTO: 2NT ILLIMITATA 11+ almeno 4 carte. Surlicita fit TERZO 11+. Appoggio 3/4 barrage. " + STYLE
        )
    },
    {
        "id": 210,
        "title": "Fit nel Nobile Bergen",
        "prompt": (
            "Crea un infografica educativa sul bridge per ragazzi (8-17 anni) con titolo grande: "
            "LEZIONE 11 FIT NEL NOBILE BERGEN. "
            "Contenuti: 1) SALTI BERGEN: 1maggiore-3fiori=fit QUARTO 7-9pt. 1maggiore-3quadri=fit QUARTO 10-11pt. "
            "Apertore 3atout se minimo. Sotto 3atout=Trial. Sopra 3atout=Cue slam. "
            "2) APPOGGIO 2 COSTRUTTIVO: 7/8-10pt fascia stretta. "
            "3) 2NT TRUSCOTT 12+: fit quarto+. Su 2NT colore=singolo, 3atout=interessante, 3NT=5332 forte. "
            "4) 1NT FORZANTE schema: 4-7pt 1NT poi liv.2. 8-10pt diretto 2. 11pt 1NT poi liv.3. MAI passo tranne 5332-11. Inventa minore. "
            "5) Bergen valgono solo se intervento non supera 2fiori. " + STYLE
        )
    },
    {
        "id": 211,
        "title": "Appoggi Costruttivi e 1NT Forzante",
        "prompt": (
            "Crea un infografica educativa sul bridge per ragazzi (8-17 anni) con titolo grande: "
            "LEZIONE 12 APPOGGI COSTRUTTIVI E 1NT FORZANTE. "
            "Contenuti: 1) 1NT FORZANTE box blu: Su 1cuori/1picche campo 5-11pt. 2su1 FM. 1NT nasconde fit. Apertore DEVE ridichiarare. "
            "2) APPOGGIO 2 COSTRUTTIVO box arancio: 8-10pt fit TERZO. "
            "3) Schema: 4-7pt 1NT poi 2 debole. 8-10pt diretto 2 costruttivo. 11pt 1NT poi 3 forte. "
            "4) 2NT TRUSCOTT box verde: Fit QUARTO invito 10-12pt. Fit quinto 2NT poi rialza 10carte=10prese. "
            "5) RIDICHIARARE: inventa minore terzo basso. Solo 5332-11 puo passare. "
            "6) DOPO INTERVENTO: Appoggio 2 tutto campo 5-9. 2NT ILLIMITATA 11+. Surlicita TERZO 11+. " + STYLE
        )
    },
    {
        "id": 212,
        "title": "Interventi Speciali e Difese",
        "prompt": (
            "Crea un infografica educativa sul bridge per ragazzi (8-17 anni) con titolo grande: "
            "LEZIONE 13 INTERVENTI SPECIALI E DIFESE. "
            "Contenuti: 1) MICHAELS box blu: Su 1cuori/1picche Surlicita=altro nobile+minore 5-5 12+pt. Su 1fiori/1quadri 2quadri=nobili, 2NT=bassi. MAI 5-4, servono 5-5! "
            "2) GHESTEM box verde: Su 1cuori/1picche Surlicita=altro nobile+fiori, 2NT=minori, 3fiori=altro nobile+quadri. "
            "3) SU 1NT AVVERSARIO box arancio: 2fiori LANDY=5/4 nobile. 2quadri=Transfer cuori. 2cuori=Transfer picche. 2NT=minori. Solo seste o bicolori! "
            "4) DIFESA 2QUADRI MULTI box rosso: Come sottoapertura 2picche. Contro=CUORI. Passo-Contro=PICCHE. 2NT=minori o bilanciata 15+. "
            "5) Su sottoaperture avversarie: Contro=altro nobile. 2NT=16/17 bilanciata. Colore=6+carte. " + STYLE
        )
    },
    {
        "id": 213,
        "title": "Casi Particolari dopo 1 su 1",
        "prompt": (
            "Crea un infografica educativa sul bridge per ragazzi (8-17 anni) con titolo grande: "
            "LEZIONE 14 CASI PARTICOLARI DOPO RISPOSTE 1 SU 1. "
            "Contenuti: 1) REVER A SENZA box blu: 1maggiore-1x-2NT=17-18pt 5332. 1maggiore-1x-3NT=19-20pt. 1NT con nobile quinto=MINIMO 15-16. Da minore con fit quarto salta 3NT. "
            "2) INDAGINI: Ripetizione=a passare. Colore nuovo=forzante. 3fiori tipo Stayman=nobili. "
            "3) EFFETTO SPONDA box verde: Intervento LIBERA Apertore. Se dichiara ha qualcosa SPECIALE. "
            "4) LIBERE tabella: Appoggio=fit QUARTO. Surlicita=forte fit quarto. 1NT=18-20 fermo. Ripetizione=ottimo sesto. Contro=16-20 generico. "
            "5) Rispondente dopo Passo box arancio: Contro=descriviti 7/8+pt. Surlicita=manche+. Colore nuovo=forzante. "
            "6) Box rosso: Non saltare a 2NT con 18-20, basta 1NT con fermo! " + STYLE
        )
    },
]


def generate_image(lesson_data, retry_count=0):
    lesson_id = lesson_data["id"]
    title = lesson_data["title"]
    prompt = lesson_data["prompt"]

    sep = "=" * 60
    print()
    print(sep)
    print("[%d] Generazione infografica: %s" % (lesson_id, title))
    print(sep)

    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}
    }).encode("utf-8")

    req = urllib.request.Request(
        ENDPOINT,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, context=ssl_ctx, timeout=180) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else "no body"
        print("  HTTP Error %d: %s" % (e.code, error_body[:500]))
        if retry_count < 2:
            print("  Retry %d/2 in 10 seconds..." % (retry_count + 1))
            time.sleep(10)
            return generate_image(lesson_data, retry_count + 1)
        return False
    except Exception as e:
        print("  Error: %s" % str(e))
        if retry_count < 2:
            print("  Retry %d/2 in 10 seconds..." % (retry_count + 1))
            time.sleep(10)
            return generate_image(lesson_data, retry_count + 1)
        return False

    candidates = data.get("candidates", [])
    if not candidates:
        print("  ERRORE: Nessun candidato nella risposta")
        print("  Response keys: %s" % str(list(data.keys())))
        if "promptFeedback" in data:
            print("  Prompt feedback: %s" % str(data["promptFeedback"]))
        if retry_count < 2:
            print("  Retry %d/2 in 10 seconds..." % (retry_count + 1))
            time.sleep(10)
            return generate_image(lesson_data, retry_count + 1)
        return False

    parts = candidates[0].get("content", {}).get("parts", [])
    image_saved = False

    for part in parts:
        if "inlineData" in part:
            img_data = part["inlineData"]
            b64 = img_data["data"]
            mime = img_data.get("mimeType", "image/png")
            if "png" in mime:
                ext = "png"
            elif "jpeg" in mime or "jpg" in mime:
                ext = "jpg"
            else:
                ext = "png"
            filename = "lezione-%d-junior.%s" % (lesson_id, ext)
            filepath = OUTPUT_DIR / filename
            with open(filepath, "wb") as f:
                f.write(base64.b64decode(b64))
            size_kb = os.path.getsize(filepath) / 1024
            print("  SALVATA: %s" % str(filepath))
            print("  Formato: %s, Dimensione: %.1f KB" % (mime, size_kb))
            image_saved = True
            break

    if not image_saved:
        for part in parts:
            if "text" in part:
                print("  Testo ricevuto: %s..." % part["text"][:300])
        if retry_count < 2:
            print("  Nessuna immagine. Retry %d/2 in 10 seconds..." % (retry_count + 1))
            time.sleep(10)
            return generate_image(lesson_data, retry_count + 1)
        print("  FALLITA dopo %d tentativi" % (retry_count + 1))
        return False

    return True


def create_pdfs():
    from PIL import Image

    sep = "=" * 60
    print()
    print(sep)
    print("Creazione PDF...")
    print(sep)

    images_info = []
    for lesson in LESSONS:
        lid = lesson["id"]
        for ext in ["png", "jpg"]:
            fpath = OUTPUT_DIR / ("lezione-%d-junior.%s" % (lid, ext))
            if fpath.exists():
                images_info.append((lid, fpath, lesson["title"]))
                break

    if not images_info:
        print("  Nessuna immagine trovata per creare PDF!")
        return

    print("  Trovate %d immagini" % len(images_info))

    for lid, img_path, title in images_info:
        pdf_path = OUTPUT_DIR / ("lezione-%d-junior.pdf" % lid)
        img = Image.open(img_path)
        if img.mode == "RGBA":
            bg = Image.new("RGB", img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[3])
            img = bg
        elif img.mode != "RGB":
            img = img.convert("RGB")
        img.save(pdf_path, "PDF", resolution=150)
        print("  PDF individuale: %s" % str(pdf_path))

    combined_path = OUTPUT_DIR / "corso-cuori-licita-junior.pdf"
    pil_images = []
    for lid, img_path, title in images_info:
        img = Image.open(img_path)
        if img.mode == "RGBA":
            bg = Image.new("RGB", img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[3])
            img = bg
        elif img.mode != "RGB":
            img = img.convert("RGB")
        pil_images.append(img)

    if len(pil_images) > 1:
        pil_images[0].save(
            combined_path, "PDF", resolution=150,
            save_all=True, append_images=pil_images[1:]
        )
    elif len(pil_images) == 1:
        pil_images[0].save(combined_path, "PDF", resolution=150)

    print()
    print("  PDF COMBINATO: %s" % str(combined_path))
    print("  Contiene %d pagine" % len(pil_images))


def main():
    print("=" * 60)
    print("FIGB Corso Cuori Licita - Generazione Infografiche Junior")
    print("Output: %s" % str(OUTPUT_DIR))
    print("Lezioni: %d" % len(LESSONS))
    print("=" * 60)

    successes = 0
    failures = 0

    for i, lesson in enumerate(LESSONS):
        print("\n--- Immagine %d/%d ---" % (i + 1, len(LESSONS)))
        ok = generate_image(lesson)
        if ok:
            successes += 1
        else:
            failures += 1

        if i < len(LESSONS) - 1:
            print("  Pausa 3 secondi...")
            time.sleep(3)

    print()
    print("=" * 60)
    print("RISULTATO: %d successi, %d fallimenti su %d lezioni" % (successes, failures, len(LESSONS)))
    print("=" * 60)

    if successes > 0:
        create_pdfs()

    print("\nFINE!")


if __name__ == "__main__":
    main()
