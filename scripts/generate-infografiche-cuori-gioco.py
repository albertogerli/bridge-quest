#!/usr/bin/env python3
"""
Genera infografiche FIGB per Corso Cuori Gioco - Profilo Junior (Maestro Franci)
Usa Gemini 3 Pro Image (Nano Banana Pro) API
"""

import json
import base64
import urllib.request
import ssl
import os
import time

API_KEY = "AIzaSyAB_VB1vU6eqJLf5OE_5OYeE5Gr571wUKs"
MODEL = "gemini-3-pro-image-preview"
BASE_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

OUTPUT_DIR = "/Users/albertogiovannigerli/Desktop/Personale/Bridge/bridgequest/public/infografiche/cuori-gioco"

STYLE_PROMPT = """
Stile grafico OBBLIGATORIO:
- Infografica educativa verticale, stile vettoriale pulito e moderno
- Sfondo bianco con accenti azzurro FIGB (#0098D4) e dettagli colorati per i semi
- In alto: logo FIGB (4 diamanti azzurri con i simboli dei 4 semi: picche nero, cuori rosso, quadri rosso, fiori verde, sotto la scritta "FIGB" in azzurro)
- In basso a destra: "Maestro Franci" in corsivo azzurro
- Tavolo da bridge: panno verde visto dall'alto, forma rettangolare con bordi arrotondati, 4 posizioni (NORD, SUD, EST, OVEST)
- Semi delle carte: Picche (♠ nero), Cuori (♥ rosso), Quadri (♦ rosso), Fiori (♣ nero/verde)
- Testo TUTTO in italiano, leggibile, font sans-serif pulito
- Layout adatto a stampa come dispensa A4
- NO scritte in inglese, NO "BridgeQuest"
- Icone e diagrammi semplici, chiari, educativi
- Target: ragazzi 8-17 anni, quindi colorato e accattivante ma non infantile
"""

LEZIONI = [
    {
        "id": "100",
        "titolo": "La Prima Presa",
        "contenuto": """
Visualizza questi concetti chiave:
1. La PAUSA DI RIFLESSIONE alla prima presa è indispensabile - icona di un orologio/cervello che pensa
2. DEDUZIONI dalla carta di attacco e dalla licita - frecce dall'attacco verso un punto interrogativo
3. REGOLE NORMALI DI ATTACCO: non sotto Asso ad atout, da sequenza, colore del compagno
4. SBLOCCARE ONORI alla prima presa: se hai KQ doubleton e l'Asso è al morto, gioca il Re!
5. SOSPETTARE ATTACCHI ANOMALI: quando l'avversario non attacca normalmente, cerca un taglio
6. Diagramma tavolo: mano Nord (morto) con carte visibili, Sud (giocante) che riflette prima di giocare
7. Freccia rossa con "STOP! PENSA!" sopra la prima presa
"""
    },
    {
        "id": "101",
        "titolo": "Fit 5-3 e Fit 4-4",
        "contenuto": """
Visualizza questi concetti chiave:
1. Due modi di giocare ad atout (2 riquadri):
   → CONTROLLO DEL COLPO: battere atout, poi incassare le lunghe
   → TAGLIO TOTALE: tagliare da entrambe le mani
2. MANO BASE: quella che batte le atout avversarie (di solito la più lunga in atout)
3. FIT 5-3: il più delicato - diagramma con 5 atout a Sud e 3 a Nord, dopo 3 battute solo 1 mano taglia
4. FIT 4-4: il più potente - diagramma con 4 atout per parte, nessuna mano predestinata ai tagli
5. DIFESA DALL'ACCORCIAMENTO: rifiutare di tagliare dalla mano lunga!
6. Schema comparativo: Fit 5-3 vs Fit 4-4 con frecce e vantaggi/svantaggi
7. Esempio con carte: come il fit 4-4 produce più prese del fit 5-3
"""
    },
    {
        "id": "102",
        "titolo": "Controgioco - Il Conto e i Preferenziali",
        "contenuto": """
Visualizza questi concetti chiave:
1. IL CONTO DELLA CARTA (grande tabella):
   → ALTA-BASSA (8 poi 3) = numero PARI di carte
   → BASSA-ALTA (3 poi 8) = numero DISPARI di carte
2. SEQUENZE PREVALGONO SUL CONTO: QJ5→gioca Q, 1096→gioca 10
3. MESSAGGIO PREFERENZIALE (2 frecce colorate):
   → Carta ALTA = preferisco il colore di rango ALTO
   → Carta BASSA = preferisco il colore di rango BASSO
4. QUANDO dare il CONTO: quando il compagno ha già deciso cosa fare nel colore
5. QUANDO dare il PREFERENZIALE: quando il compagno deve scegliere quale colore giocare
6. ATTENZIONE: Non dare il conto quando aiuta solo il giocante!
7. Diagramma pratico: difensore che sceglie quale carta giocare con fumetto che spiega il segnale
"""
    },
    {
        "id": "103",
        "titolo": "Difesa - Colori da Muovere con Urgenza",
        "contenuto": """
Visualizza questi concetti chiave:
1. ANTICIPARE colori dove AFFRANCARE PRESE prima che il giocante faccia scarti - icona orologio con urgenza
2. IMMAGINARE LE FIGURE: operazione faticosa ma fondamentale per la difesa
3. COLORE "IN DIVIETO DI SOSTA": va rimosso con urgenza prima che il giocante scarti i perdenti
4. CONTARE LE CARTE del giocante per capire se ha scarti disponibili
5. STILE AGGRESSIVO vs NEUTRO nell'attacco:
   → Aggressivo: quando il tempo stringe, rischiare per affrancare
   → Neutro: quando il contratto non scappa, giocare passivo
6. Diagramma: morto con colore lungo affrancabile = URGENZA per i difensori
7. Esempio: difensore deve attaccare subito il colore debole prima che il morto scarti
"""
    },
    {
        "id": "104",
        "titolo": "Le Giocate di Sicurezza",
        "contenuto": """
Visualizza questi concetti chiave:
1. RINUNCIA VOLONTARIA a una presa per evitarne DUE - icona bilancia 1 vs 2
2. Esempio 1: K92 + AJ765 → Asso, poi piccola verso K9, inserendo il 9
3. Esempio 2: KQ962 + A1073 → onore dalla parte con 2 onori
4. Esempio 3: AJ32 + K954:
   → Per TUTTE le prese = impasse (rischio!)
   → Per max 1 persa = Asso e poi K9 (sicurezza!)
5. Due PIANI DI GIOCO IN SICUREZZA:
   → PROTEZIONE: limitare le perdite nel colore
   → ELIMINAZIONE: evitare distribuzione sfavorevole
6. Diagramma decisionale: "Quante prese ti servono?" → freccia verso giocata sicura o rischiosa
7. Carte disposte su tavolo verde che mostrano l'inserimento del 9
"""
    },
    {
        "id": "105",
        "titolo": "Probabilità e Percentuali",
        "contenuto": """
Visualizza questi concetti chiave:
1. TABELLA DIVISIONI (grande, colorata):
   → 6 mancanti: 3-3 = 36%, 4-2 = 48%, 5-1 = 15%, 6-0 = 1%
   → 5 mancanti: 3-2 = 68%, 4-1 = 28%, 5-0 = 4%
   → 4 mancanti: 3-1 = 50%, 2-2 = 40%, 4-0 = 10%
2. IMPASSE = 50%, DOPPIO IMPASSE (AJ10) = 75%
3. CHANCE SUCCESSIVE si sommano: 68% + 16% = 84% - barra percentuale colorata
4. DUE IMPASSE, ne basta UNO: 75% (non 50+50!)
5. ORDINE GIOCATE: prima la chance che NON BRUCIA l'altra
6. Diagramma a torta colorato con le percentuali delle divisioni
7. Schema: "Prima prova la lunga (non costa nulla), poi l'impasse (brucia!)"
"""
    },
    {
        "id": "106",
        "titolo": "Coprire o Non Coprire",
        "contenuto": """
Visualizza questi concetti chiave:
1. PICCOLA SU PICCOLA: regola generale quando dal morto esce carta bassa
2. ONORE SU ONORE: coprire solo se si spera di AFFRANCARE carta inferiore
3. CON SEQUENZA SOLIDA: inserire la più alta (es: QJ10 → gioca Q)
4. DUE ONORI AL MORTO: NON coprire il PRIMO, coprire il SECONDO!
   → Esempio: QJ al morto, tu hai Kxx → passa sulla Q, copri sul J
5. FATTORE LUNGHEZZA: con carte lunghe sotto l'onore, più motivo per coprire
6. Diagramma: morto gioca Donna, difensore con Re deve decidere - fumetto "Copro o no?"
7. Schema riassuntivo con 3 casi: Sempre coprire / Mai coprire / Dipende
"""
    },
    {
        "id": "107",
        "titolo": "I Giochi di Eliminazione",
        "contenuto": """
Visualizza questi concetti chiave:
1. PRINCIPIO: togliere all'avversario ogni uscita neutra, poi cedergli la presa
2. TAGLIO E SCARTO: il difensore costretto a giocare colore esaurito → giocante taglia e scarta
3. FIGURE DELICATE (3 diagrammi):
   → A103 + J63: elimina poi cedi, avversario deve giocare nel colore
   → AJ3 + K102: eliminazione crea impasse automatica
   → K103 + Q92: l'avversario deve aprire il colore
4. PREPARAZIONE (lista numerata):
   → 1. Eliminare i colori laterali
   → 2. Battere le atout avversarie
   → 3. Tagliare i resti dei colori eliminati
   → 4. Cedere la presa!
5. A 3NT SENZA TAGLIO: forzare l'uscita in colore favorevole
6. Diagramma tavolo: avversario "in gabbia" con frecce che mostrano ogni uscita perdente
7. Sequenza visiva dei passi dell'eliminazione
"""
    },
    {
        "id": "108",
        "titolo": "Giocare Come Se",
        "contenuto": """
Visualizza questi concetti chiave:
1. DARE PER SCONTATE le condizioni necessarie al successo - icona lampadina
2. NON RIMANDARE: se l'impasse DEVE riuscire, farlo SUBITO (non dopo)
3. ORDINE: iniziare dal colore più RISCHIOSO (quello che può andare male)
4. SCARTARE IPOTESI PERDENTI: se una distribuzione ci manda sotto comunque, non preoccuparsene
5. ANALISI DELLE IPOTESI NECESSARIE: "Cosa DEVE essere vero perché il contratto riesca?"
   → Lista delle condizioni
   → Eliminare quelle impossibili
   → Giocare COME SE le rimanenti fossero vere
6. Diagramma: bivio con "Ipotesi A: contratto fatto" e "Ipotesi B: contratto down comunque" → scegli A!
7. Esempio pratico: giocante che assume Re a sinistra e gioca di conseguenza
"""
    },
    {
        "id": "109",
        "titolo": "Deduzioni del Giocante",
        "contenuto": """
Visualizza questi concetti chiave:
1. DEDUZIONI DALL'ATTACCO:
   → A Senza Atout: quarto colore più lungo, attacco alto=sequenza, basso=onore sopra
   → Ad Atout: sequenza, corto per taglio, colore del compagno
2. CHI PASSA NON HA L'APERTURA: se avversario ha passato, ha meno di 12 punti → distribuisci i punti!
3. CONTARE I PUNTI MOSTRATI: ogni volta che un avversario gioca un onore, annotare mentalmente
4. DEDUZIONE SULLA DISTRIBUZIONE:
   → Dal tipo di apertura (1♥ = 5+ cuori, 1NT = bilanciata 15-17)
   → Dal tipo di risposta
   → Dai segnali difensivi
5. IMPASSE DESTINATI AD ANDARE MALE NON SI FANNO: se sai che il Re è a destra, non fare l'impasse a sinistra!
6. Diagramma: giocante con "mappa mentale" dei punti avversari dedotti
7. Esempio: avversario apre, compagno passa → dedurre dove sono gli onori
"""
    }
]


def generate_infographic(lezione, retry=0):
    """Genera una singola infografica via Gemini API"""
    prompt = f"""Genera un'infografica educativa per la FIGB (Federazione Italiana Gioco Bridge).

Titolo: "Lezione {lezione['id']}: {lezione['titolo']}"

{lezione['contenuto']}

{STYLE_PROMPT}
"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"]
        }
    }

    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(BASE_URL, data=data, headers={"Content-Type": "application/json"})

    # SSL fix for macOS
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        response = urllib.request.urlopen(req, context=ctx, timeout=120)
        result = json.loads(response.read().decode('utf-8'))

        if 'candidates' in result:
            for cand in result['candidates']:
                for part in cand.get('content', {}).get('parts', []):
                    if 'inlineData' in part:
                        img_data = base64.b64decode(part['inlineData']['data'])
                        mime = part['inlineData']['mimeType']
                        ext = 'png' if 'png' in mime else 'jpg'
                        filename = f"lezione-{lezione['id']}-junior.{ext}"
                        filepath = os.path.join(OUTPUT_DIR, filename)
                        with open(filepath, 'wb') as f:
                            f.write(img_data)
                        size_kb = len(img_data) / 1024
                        print(f"  ✓ {filename} ({size_kb:.0f} KB)")
                        return True

        print(f"  ✗ Nessuna immagine nella risposta")
        if retry < 2:
            print(f"  Retry {retry+1}...")
            time.sleep(5)
            return generate_infographic(lezione, retry + 1)
        return False

    except Exception as e:
        print(f"  ✗ Errore: {e}")
        if retry < 2:
            print(f"  Retry {retry+1}...")
            time.sleep(10)
            return generate_infographic(lezione, retry + 1)
        return False


def create_pdfs():
    """Crea PDF individuali e combinato dalle infografiche generate"""
    try:
        from PIL import Image
    except ImportError:
        print("\n⚠ PIL/Pillow non installato, skip creazione PDF")
        print("  Installa con: pip3 install Pillow")
        return

    images = sorted([f for f in os.listdir(OUTPUT_DIR) if f.endswith(('.jpg', '.png')) and 'junior' in f])
    if not images:
        print("\n⚠ Nessuna immagine trovata per creare PDF")
        return

    print(f"\n{'=' * 60}")
    print("Creazione PDF...")

    # PDF individuali
    for img_name in images:
        img = Image.open(os.path.join(OUTPUT_DIR, img_name)).convert('RGB')
        pdf_name = img_name.rsplit('.', 1)[0] + '.pdf'
        img.save(os.path.join(OUTPUT_DIR, pdf_name), 'PDF')
        print(f"  ✓ {pdf_name}")

    # PDF combinato
    all_imgs = [Image.open(os.path.join(OUTPUT_DIR, f)).convert('RGB') for f in images]
    if all_imgs:
        all_imgs[0].save(
            os.path.join(OUTPUT_DIR, 'corso-cuori-gioco-junior.pdf'),
            'PDF',
            save_all=True,
            append_images=all_imgs[1:]
        )
        print(f"  ✓ corso-cuori-gioco-junior.pdf ({len(all_imgs)} pagine)")


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 60)
    print("FIGB - Generazione Infografiche Corso Cuori Gioco")
    print("Profilo: Junior (8-17) - Maestro Franci")
    print(f"Modello: {MODEL}")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 60)

    success = 0
    failed = 0

    for i, lezione in enumerate(LEZIONI):
        print(f"\n[{i+1}/10] Lezione {lezione['id']}: {lezione['titolo']}")
        if generate_infographic(lezione):
            success += 1
        else:
            failed += 1
        # Rate limiting
        if i < len(LEZIONI) - 1:
            time.sleep(3)

    print(f"\n{'=' * 60}")
    print(f"RISULTATO: {success}/10 generate, {failed} fallite")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 60)

    # Crea PDF
    create_pdfs()

    # Report dimensioni file
    print(f"\n{'=' * 60}")
    print("DETTAGLIO FILE:")
    total_size = 0
    for f in sorted(os.listdir(OUTPUT_DIR)):
        fpath = os.path.join(OUTPUT_DIR, f)
        if os.path.isfile(fpath):
            size = os.path.getsize(fpath)
            total_size += size
            print(f"  {f}: {size/1024:.0f} KB")
    print(f"\nTotale: {total_size/1024/1024:.1f} MB")
    print("=" * 60)


if __name__ == "__main__":
    main()
