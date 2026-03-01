#!/usr/bin/env python3
"""
Genera infografiche FIGB per Corso Cuori Gioco - Profilo Junior (Maestro Franci)
Usa Gemini 3 Pro Image API
10 lezioni (ID 100-109): Gioco della Carta avanzato
"""

import json
import base64
import urllib.request
import ssl
import os
import time

API_KEY = os.environ.get("GEMINI_API_KEY", "")
if not API_KEY:
    raise SystemExit("Set GEMINI_API_KEY environment variable")
MODEL = "gemini-3-pro-image-preview"
BASE_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

OUTPUT_DIR = "/Users/albertogiovannigerli/Desktop/Personale/Bridge/bridgequest/public/infografiche/cuori-gioco"

STYLE_PROMPT = """
Stile grafico OBBLIGATORIO:
- Infografica educativa verticale, stile vettoriale pulito e moderno
- Sfondo bianco con accenti azzurro FIGB (#0098D4) e dettagli colorati per i semi
- In alto: logo FIGB (4 losanghe azzurri con i simboli dei 4 semi: picche nero, cuori rosso, quadri rosso, fiori verde, sotto la scritta "FIGB" in azzurro)
- In basso a destra: "Maestro Franci" in corsivo azzurro
- Tavolo da bridge: panno verde visto dall'alto, forma rettangolare con bordi arrotondati, 4 posizioni (NORD, SUD, EST, OVEST)
- Semi delle carte: Picche (spade nero), Cuori (cuore rosso), Quadri (diamante rosso), Fiori (trifoglio nero/verde)
- Testo TUTTO in italiano, leggibile, font sans-serif pulito
- Layout adatto a stampa come dispensa A4
- NO scritte in inglese, NO "BridgeQuest"
- Icone e diagrammi semplici, chiari, educativi
- Target: ragazzi 8-17 anni, colorato e accattivante ma non infantile
- Usa colori vivaci per evidenziare concetti importanti (rosso per attenzione, verde per corretto, blu per info)
"""

LEZIONI = [
    {
        "id": "100",
        "titolo": "La Prima Presa",
        "contenuto": """
Visualizza questi concetti chiave:
1. Un grande segnale STOP rosso con la scritta "FERMATI E PENSA! La maggior parte dei contratti si perde alla prima carta!"
2. Le 7 REGOLE DI ATTACCO (lista numerata con icone colorate):
   (1) Non attaccare sotto Asso ad atout
   (2) Rispettare le sequenze di attacco
   (3) Preferire AK a qualunque altro attacco
   (4) Attaccare nel colore dichiarato dal partner
   (5) Attaccare nel colore di appoggio della coppia
   (6) Se nessuno ha parlato: attaccare nel colore non detto
   (7) Non attaccare per fare tagli se si ha presa di lunga in atout
3. SBLOCCO ALLA PRIMA PRESA: mostra esempio Q2 sopra K43 con freccia "Gioca la Donna!" (sblocco onore catturabile)
4. Esercizi visivi sulla prima presa a Senza Atout:
   J3 sopra A102 -> piccola (preservare tenuta)
   Q2 sopra K43 -> la Donna (sblocco)
5. IL BLUFF: icona maschera - "Sospetta attacchi in colori dove hai molte carte: cercano il taglio!"
6. Box riassunto: "Prima di giocare, analizza l'attacco, conta i punti, e fai un piano!"
"""
    },
    {
        "id": "101",
        "titolo": "Fit 5-3 e Fit 4-4",
        "contenuto": """
Visualizza questi concetti chiave:
1. CONFRONTO VISIVO tra due tipi di fit:
   - FIT 5-3 (colonna sinistra): 5 carte + 3 carte, scritta "Delicatezza e Controllo", icona scudo
   - FIT 4-4 (colonna destra): 4 carte + 4 carte, scritta "Potenza e Taglio Totale", icona fulmine
2. MANO BASE: tavolo da bridge dall'alto con Nord-Sud che hanno un fit 4-4 ad atout, frecce che mostrano il flusso del gioco
3. CROSS-RUFF (Taglio Incrociato): diagramma con frecce incrociate tra Nord e Sud che tagliano a turno nei colori corti, carte atout evidenziate in rosso
4. QUANDO USARE QUALE? (due box):
   - Fit 5-3: "Gioca con calma, sviluppa i colori laterali, batti le atout"
   - Fit 4-4: "Taglia da entrambe le parti, piu prese potenziali!"
5. REGOLA: "Il fit 4-4 produce spesso 1 PRESA IN PIU rispetto al 5-3!" evidenziato con freccia grande
6. Esempio: con fit 4-4, se tagli 2 volte da un lato e 2 dall'altro, fai fino a 8 prese di atout!
"""
    },
    {
        "id": "102",
        "titolo": "Segnali: Conto e Preferenziali",
        "contenuto": """
Visualizza questi concetti chiave:
1. Grande semaforo colorato in alto come icona del tema "Segnali"
2. SEGNALE DI CONTO (box azzurro con due sotto-sezioni):
   - ALTO poi BASSO = PARI (es: gioco 7 poi 3 = ho un numero pari di carte, 2 o 4)
   - BASSO poi ALTO = DISPARI (es: gioco 3 poi 7 = ho un numero dispari, 3 o 5)
   Con frecce colorate: verde per alto-basso, arancione per basso-alto
3. SEGNALE PREFERENZIALE (box rosso):
   - CARTA ALTA = "Preferisco il seme di rango piu alto tra i due possibili"
   - CARTA BASSA = "Preferisco il seme di rango piu basso tra i due possibili"
4. Gerarchia dei semi: Picche (alto) > Cuori > Quadri > Fiori (basso) - schema visivo orizzontale
5. Esempio pratico: Ovest gioca il 9 di fiori come preferenziale = "Voglio picche!" (seme alto)
6. TABELLA RIASSUNTIVA chiara:
   Conto: ALTO-BASSO = Pari | BASSO-ALTO = Dispari
   Preferenziale: ALTO = Seme alto | BASSO = Seme basso
7. Box attenzione: "I segnali funzionano solo se il partner li capisce! Accordatevi prima!"
"""
    },
    {
        "id": "103",
        "titolo": "I Colori da Muovere in Difesa",
        "contenuto": """
Visualizza questi concetti chiave:
1. Icona scudo con spada per il tema "Difesa Attiva"
2. TEMPO E CONTROLLO (box con orologio): "In difesa il TEMPO e fondamentale! Incassa le tue prese PRIMA che il dichiarante sviluppi le sue"
3. SEMAFORO DI URGENZA a 3 livelli:
   - ROSSO (urgente): "Il dichiarante sta per fare scarti - attacca SUBITO il tuo colore forte!"
   - GIALLO (attenzione): "Valuta se cambiare colore o continuare"
   - VERDE (calma): "Nessun scarto imminente - puoi difendere passivamente"
4. IMMAGINARE LE POSIZIONI: tavolo con carte coperte e punti interrogativi - "Dalla licita, calcola i punti del dichiarante e immagina dove sono gli onori"
5. REGOLA IMPORTANTE con grande X rossa: "Non giocare SOTTO l'Asso in un colore ad atout!"
6. QUANDO CAMBIARE COLORE - 3 situazioni:
   - "Il tuo colore e bloccato" -> cambia
   - "Il partner ha segnalato preferenza" -> segui il segnale
   - "Il dichiarante sta per fare scarti" -> attacca urgente!
7. Box trucco: "Pensa come un detective: ogni carta giocata e un indizio!"
"""
    },
    {
        "id": "104",
        "titolo": "I Giochi di Sicurezza",
        "contenuto": """
Visualizza questi concetti chiave:
1. Icona lucchetto e scudo protettivo per il tema "Sicurezza"
2. CONCETTO CENTRALE con bilancia: "Rinuncia VOLONTARIA a 1 presa per non rischiare di perderne 2!" - bilancia che pesa 1 presa ceduta vs 2 prese perse
3. ESEMPIO CLASSICO - diagramma carte:
   Nord: K-9-2 / Sud: A-J-7-6-5
   Freccia: "Gioca piccola verso il 9! Se il 9 perde, hai ancora A-K-J per gestire 4-0"
4. L'EXPASSE di sicurezza:
   Sud: A-10-x-x / Nord: K-x-x
   "Gioca il Re e poi piccola verso il 10: proteggi dalla Q-J-x-x in Est!"
5. QUANDO SERVONO I GIOCHI DI SICUREZZA?
   - "Hai prese in abbondanza" -> puoi cederne una
   - "Una brutta divisione ti farebbe crollare" -> proteggiti!
6. TABELLA COMBINAZIONI UTILI:
   - A-J-10-x-x vs K-x = piccola verso J (sicurezza 4-1)
   - A-K-10-x-x vs x-x-x = piccola dall'alto poi piccola (sicurezza 4-1)
   - K-9-2 + A-J-7-6-5 = piccola verso il 9
7. Box motto: "Meglio perdere 1 presa sicura che rischiare il contratto!"
"""
    },
    {
        "id": "105",
        "titolo": "Probabilita e Percentuali",
        "contenuto": """
Visualizza questi concetti chiave:
1. Icona dado e grafico a torta per il tema "Probabilita"
2. TABELLA PRINCIPALE COLORATA con barre proporzionali "Divisione delle carte mancanti":
   Mancano 2: 1-1 (52%) / 2-0 (48%)
   Mancano 3: 2-1 (78%) / 3-0 (22%)
   Mancano 4: 3-1 (50%) / 2-2 (40%) / 4-0 (10%)
   Mancano 5: 3-2 (68%) / 4-1 (28%) / 5-0 (4%)
   Mancano 6: 4-2 (48%) / 3-3 (36%) / 5-1 (15%) / 6-0 (1%)
   Mancano 7: 4-3 (62%) / 5-2 (31%) / 6-1 (7%) / 7-0 (meno di 1%)
3. SUCCESSIVE vs ALTERNATIVE:
   - SUCCESSIVE (AND): P(A) x P(B) - "Due impasse: 50% x 50% = 25%"
   - ALTERNATIVE (OR): P(A) + P(B) - P(entrambi) - "Almeno un impasse su due: 75%!"
4. IMPASSE vs DROP:
   - Con 9 carte: "Drop della Donna (52%) batte l'impasse (50%)!"
   - Con 8 carte: "Impasse (50%) batte il drop (34%)"
5. REGOLA D'ORO evidenziata: "Con 8 carte: impassa. Con 9 carte: batti!"
6. Grafico a torta: divisione 5 carte mancanti (3-2 verde 68%, 4-1 giallo 28%, 5-0 rosso 4%)
"""
    },
    {
        "id": "106",
        "titolo": "Coprire o Non Coprire",
        "contenuto": """
Visualizza questi concetti chiave:
1. Grande punto interrogativo con due carte sovrapposte come icona
2. REGOLA PRINCIPALE in box dorato: "ONORE SU ONORE... ma solo se puo PROMUOVERE una carta tua o del partner!"
3. BASSO SU BASSO (box verde):
   "Se dal morto esce una cartina, gioca basso anche tu!"
   Esempio: dal morto esce il 4, tu con K-x-x giochi il 3
4. ECCEZIONE: SEQUENZA SOLIDA (box rosso):
   "Se il morto ha Q-J-10, NON coprire! La copertura non promuove nulla"
   Esempio: morto Q-J-10-x, tu hai K-x-x - NON mettere il Re!
5. QUANDO COPRIRE - 3 esempi con diagrammi:
   - Onore SINGOLO dal morto (J sola, Q sola) -> COPRI! promuovi il 10 del partner
   - Due onori NON in sequenza (Q...10) -> Copri il SECONDO onore
   - Q esce, tu K-x-x, partner 10-x-x -> coprendo promuovi il 10!
6. REGOLA DEI 2 ONORI:
   "Se vedi 2 onori al morto in sequenza: copri il SECONDO!"
   Q-J dal morto: lascia passare la Q, copri la J con il K
7. Box trucco: "Chiediti: coprendo, promuovo qualcosa? Se SI copri, se NO non coprire!"
"""
    },
    {
        "id": "107",
        "titolo": "I Giochi di Eliminazione",
        "contenuto": """
Visualizza questi concetti chiave:
1. Icona forbici che tagliano e trappola per il tema "Eliminazione"
2. CONCETTO CENTRALE: "TAGLIO E SCARTO: forza l'avversario a fare una giocata che ti favorisce!"
3. LE 3 FASI schema a passi con frecce grandi:
   FASE 1 "ELIMINA" (icona cestino): "Taglia via i colori laterali, elimina le uscite sicure"
   FASE 2 "METTI IN PRESA" (icona trappola): "Forza l'avversario a prendere la presa"
   FASE 3 "GUADAGNA" (icona trofeo): "L'avversario deve giocare un colore che ti aiuta o dare taglio-e-scarto!"
4. FIGURE DELICATE: combinazioni K-x e Q-x dove non vuoi giocare per primo
   "Il segreto: fai giocare l'avversario VERSO le tue figure!"
5. ESEMPIO COMPLETO su tavolo da bridge:
   Sud ha K-x in un colore, Nord ha x-x
   Dopo eliminazione, Ovest DEVE giocare verso il Re o dare taglio-e-scarto
6. Box ricorda: "Preparazione = successo! Elimina PRIMA di mettere in presa!"
"""
    },
    {
        "id": "108",
        "titolo": "Giocare Come Se",
        "contenuto": """
Visualizza questi concetti chiave:
1. Icona lampadina accesa e cervello che pensa
2. CONCETTO CENTRALE (box giallo grande): "Se il contratto FALLISCE con una distribuzione... GIOCA COME SE quella distribuzione non esistesse! Concentrati su dove puoi vincere."
3. I 3 PASSI delle CONDIZIONI NECESSARIE (con icone colorate):
   Passo 1 (lente): "Analizza: di cosa hai BISOGNO per mantenere il contratto?"
   Passo 2 (puzzle): "Ipotizza: quale distribuzione avversaria ti permette di vincere?"
   Passo 3 (carta): "Gioca COME SE quella distribuzione fosse vera!"
4. SCARTARE LE IPOTESI PERDENTI:
   Diagramma a imbuto: "Tutte le distribuzioni" -> filtro -> "Solo quelle dove puoi vincere"
   Esempio: "Se la Donna e in Ovest perdi comunque -> gioca COME SE fosse in Est!"
5. ORDINE DI GIOCO ottimale:
   Schema: 1 Incassa atout -> 2 Gioca colori sicuri -> 3 Conta le carte -> 4 Decidi il colore chiave
6. Box motto: "Non sperare nel meglio: PIANIFICA per il meglio possibile!"
"""
    },
    {
        "id": "109",
        "titolo": "Le Deduzioni del Giocante",
        "contenuto": """
Visualizza questi concetti chiave:
1. Icona detective con lente d'ingrandimento
2. DEDUZIONI DALL'ATTACCO (due box affiancati):
   - "A SENZA ATOUT": attacco di cartina = onore nel colore. Regola dell'11: 11 - carta attaccata = carte superiori nelle altre 3 mani
   - "AD ATOUT": attacco anomalo in colore forte = cerca taglio! Attacco di Re = AK
3. DEDUZIONI DALLA LICITA (box con fumetti):
   "Se avversario ha aperto 1 Picche: almeno 12 punti e 5 picche"
   "Se ha passato: NON ha 12+ punti - gli onori mancanti sono dall'altra parte!"
4. CONTEGGIO PUNTI (calcolatrice stilizzata):
   Formula: 40 - (tua mano + morto) = punti avversari
   "Se ne vedi 26 tra mano e morto, loro ne hanno 14. Se uno ha mostrato 11, l'altro ha 3!"
5. CONTEGGIO DISTRIBUZIONE (schema a griglia):
   4 mani con carte note e incognite, frecce che collegano le informazioni
   "Ogni carta giocata e un indizio!"
6. REGOLA DELL'11 (esempio numerico):
   Attacco del 4: 11-4=7 carte sopra il 4 nelle altre 3 mani
7. Box finale: "Il bridge e un gioco di LOGICA: ogni carta racconta una storia. Ascoltala!"
"""
    },
]


def generate_infographic(lezione, retry=0):
    prompt = f"""Genera un'infografica educativa per la FIGB (Federazione Italiana Gioco Bridge).
Corso: Cuori Gioco (Gioco della Carta)
Titolo: "Lezione {lezione['id']}: {lezione['titolo']}"

{lezione['contenuto']}

{STYLE_PROMPT}
"""
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(BASE_URL, data=data, headers={"Content-Type": "application/json"})
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
                        print(f"  OK {filename} ({size_kb:.0f} KB)")
                        return True
        print(f"  FAIL Nessuna immagine nella risposta")
        if 'candidates' in result:
            for cand in result['candidates']:
                for part in cand.get('content', {}).get('parts', []):
                    if 'text' in part:
                        print(f"  Text: {part['text'][:200]}...")
        if retry < 2:
            print(f"  Retry {retry+1}...")
            time.sleep(5)
            return generate_infographic(lezione, retry + 1)
        return False
    except Exception as e:
        print(f"  ERRORE: {e}")
        if retry < 2:
            print(f"  Retry {retry+1}...")
            time.sleep(10)
            return generate_infographic(lezione, retry + 1)
        return False


def create_pdfs():
    from PIL import Image
    print(f"\nCreazione PDF...")
    images = []
    for lezione in LEZIONI:
        lid = lezione['id']
        for ext in ['png', 'jpg']:
            fpath = os.path.join(OUTPUT_DIR, f"lezione-{lid}-junior.{ext}")
            if os.path.exists(fpath):
                images.append((lid, fpath, lezione['titolo']))
                break
    if not images:
        print("  Nessuna immagine trovata per i PDF!")
        return
    print(f"  Trovate {len(images)} immagini")
    for lid, fpath, title in images:
        try:
            img = Image.open(fpath)
            if img.mode == 'RGBA':
                bg = Image.new('RGB', img.size, (255, 255, 255))
                bg.paste(img, mask=img.split()[3])
                img = bg
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            pdf_path = os.path.join(OUTPUT_DIR, f"lezione-{lid}-junior.pdf")
            img.save(pdf_path, 'PDF', resolution=150)
            pdf_size = os.path.getsize(pdf_path) / 1024
            print(f"  PDF lezione-{lid}-junior.pdf ({pdf_size:.0f} KB)")
        except Exception as e:
            print(f"  ERRORE PDF lezione {lid}: {e}")
    try:
        all_imgs = []
        for lid, fpath, title in images:
            img = Image.open(fpath)
            if img.mode == 'RGBA':
                bg = Image.new('RGB', img.size, (255, 255, 255))
                bg.paste(img, mask=img.split()[3])
                img = bg
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            all_imgs.append(img)
        if all_imgs:
            combined_path = os.path.join(OUTPUT_DIR, "corso-cuori-gioco-junior.pdf")
            first = all_imgs[0]
            rest = all_imgs[1:] if len(all_imgs) > 1 else []
            first.save(combined_path, 'PDF', resolution=150, save_all=True, append_images=rest)
            combined_size = os.path.getsize(combined_path) / 1024
            print(f"\n  COMBINATO corso-cuori-gioco-junior.pdf ({combined_size:.0f} KB) - {len(all_imgs)} pagine")
    except Exception as e:
        print(f"  ERRORE PDF combinato: {e}")


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
        if i < len(LEZIONI) - 1:
            time.sleep(3)
    print(f"\n{'=' * 60}")
    print(f"IMMAGINI: {success}/10 generate, {failed} fallite")
    print(f"{'=' * 60}")
    if success > 0:
        create_pdfs()
    print(f"\n{'=' * 60}")
    print(f"RIEPILOGO FINALE")
    print(f"{'=' * 60}")
    files = sorted(os.listdir(OUTPUT_DIR))
    total_size = 0
    for f in files:
        fp = os.path.join(OUTPUT_DIR, f)
        size = os.path.getsize(fp) / 1024
        total_size += size
        print(f"  {f} ({size:.0f} KB)")
    print(f"\n  Totale: {len(files)} file, {total_size/1024:.1f} MB")
    print(f"  Directory: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
