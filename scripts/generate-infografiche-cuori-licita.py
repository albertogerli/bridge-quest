#!/usr/bin/env python3
"""
Genera infografiche FIGB per Corso Cuori Licita - Profilo Junior (Maestro Franci)
Usa Gemini 3 Pro Image (Nano Banana Pro) API
14 lezioni (ID 200-213): Licita avanzata
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

OUTPUT_DIR = "/Users/albertogiovannigerli/Desktop/Personale/Bridge/bridgequest/public/infografiche/cuori-licita"

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

LEZIONI = [
    {
        "id": "200",
        "titolo": "La Legge delle Prese Totali",
        "contenuto": """
Visualizza questi concetti chiave:
1. FORMULA CENTRALE in grande box azzurro: "PRESE TOTALI = somma delle atout totali tra le due coppie"
   Esempio: noi 8 atout + loro 8 atout = 16 prese totali (divise tra le due coppie)
2. LIVELLO DI SICUREZZA (tabella con semaforo):
   - 8 atout in linea -> livello 2 (sicuro dichiarare a livello 2)
   - 9 atout in linea -> livello 3 (sicuro dichiarare a livello 3)
   - 10 atout in linea -> livello 4!
3. DISTRIBUZIONI PIATTE (box rosso con segnale ATTENZIONE):
   - 5332, 4333 = distribuzioni SVANTAGGIOSE, serve PRUDENZA
   - Meno prese di quanto la Legge prevede
4. BONUS (box verde con +1):
   - Singolo nel colore avversario = +1 presa extra
   - Doppio fit (fit in due colori) = +1 presa extra
5. Diagramma visivo: tavolo da bridge con Nord-Sud che hanno 9 atout e freccia "Livello 3 sicuro!"
6. Box riassunto: "Conta le atout, controlla la distribuzione, e scegli il livello giusto!"
"""
    },
    {
        "id": "201",
        "titolo": "Valutazioni - Le Lunghe e le Corte",
        "contenuto": """
Visualizza questi concetti chiave:
1. TITOLO GRANDE: "Il FIT non basta! Servono CORTE o LUNGHE laterali"
2. DUE COLONNE con icone:
   - CORTE (icona forbici): Singoli e vuoti = possibilita di TAGLIO
     "I singoli si raccontano al partner, che valuta!"
   - LUNGHE LATERALI (icona freccia lunga): 5+ carte = AFFRANCAMENTO
     "Colori lunghi producono vincenti extra dopo aver battuto atout"
3. MONOCOLORI (box viola con 7+ carte stilizzate):
   "Con 7+ carte in un colore: quel colore DEVE essere atout, ignora i punti!"
   "Con l'ottava carta: i punti non contano piu!"
4. CONTRO SPUTNIK (box giallo attenzione):
   "Non nascondere una lunga dietro al Contro Sputnik!"
   "Se hai 5+ carte nel colore, DICHIARALO direttamente"
5. Esempio visivo: mano con singolo a quadri e fit 4-4 a picche, freccia "Il singolo aggiunge valore!"
6. Box motto: "Fit + Corta = Taglio. Fit + Lunga = Prese extra. Fit da solo = non basta!"
"""
    },
    {
        "id": "202",
        "titolo": "Le Texas su Apertura 1NT e 2NT",
        "contenuto": """
Visualizza questi concetti chiave:
1. TITOLO: "TRANSFER (Jacoby): trasferisci il gioco al partner!"
2. SCHEMA TRANSFER PRINCIPALE (frecce colorate grandi):
   - 2 Quadri -> "Ho 5+ CUORI" (partner dice 2 Cuori)
   - 2 Cuori -> "Ho 5+ PICCHE" (partner dice 2 Picche)
3. SUPER ACCETTAZIONE (box dorato con stella):
   "Partner con FIT QUARTO + MASSIMA -> salta a 3 nel colore transfer!"
   Esempio: 1NT - 2Q - 3C! (fit quarto cuori + 16-17 punti)
4. CONTINUAZIONI dopo il transfer (tabella a 3 livelli):
   - PASSO = debole (0-7 punti, parziale)
   - 2NT = invitante (8-9 punti)
   - 3NT = manche (10+ punti, scelta tra 3NT e 4 nel nobile)
5. TRANSFER MINORI (box grigio):
   - 2 Picche = "Ho le FIORI" (partner dice 3 Fiori)
   - 2NT = "Ho le QUADRI" (partner dice 3 Quadri)
6. STAYMAN A 6 GRADINI su 1NT (diagramma ad albero con 6 risposte possibili)
7. Box ricorda: "Il transfer fa giocare il NT-ista = protegge i suoi onori!"
"""
    },
    {
        "id": "203",
        "titolo": "Sviluppi dopo le Risposte 2 su 1",
        "contenuto": """
Visualizza questi concetti chiave:
1. REGOLA PRINCIPALE (box azzurro grande):
   "2 su 1 = FORZANTE MANCHE (con eccezioni)"
   Esempio: 1 Picche - 2 Fiori = coppia impegnata fino a manche
2. RIDICHIARAZIONI DELL'APERTORE (schema ad albero colorato):
   - 2 Quadri = DIRITTO (12-15 punti, ridichiarazione minima)
   - 2 Cuori / 2 Picche = REVER (16-20 punti, colore nuovo alto)
   - 2 Senza Atout = REVER BILANCIATA (18-20 bilanciata)
3. RIPORTO A 2 NEL SEME (box giallo attenzione):
   "Riportare a 2 nel seme del partner chiede DESCRIZIONE"
   "NON fissa l'atout! E' una domanda, non una risposta!"
4. RIALZO A 3 (box verde con freccia verso alto):
   "Rialzo a 3 nel seme = VELLEITA SLAM (15-16 punti)"
   "Mostra fit + forza extra"
5. QUARTO COLORE FORZANTE (box viola):
   "Dichiarare il 4 colore = CHIEDE IL FERMO per Senza Atout"
   "Non promette carte nel colore!"
6. Box motto: "2 su 1: la manche e garantita. Ora cercate il contratto migliore!"
"""
    },
    {
        "id": "204",
        "titolo": "Accostamento a Slam - Fissare l'Atout",
        "contenuto": """
Visualizza questi concetti chiave:
1. TITOLO: "FISSARE L'ATOUT: il primo passo verso lo Slam!"
2. DUE SCENARI (bivio con frecce):
   - TERRENO SOLIDO (21+ punti in linea, box verde):
     "Fissare SOTTO manche = FORZANTE! La coppia DEVE continuare"
     Esempio: 1P - 2F - 3P = fissare picche, forzante
   - TERRENO NON SOLIDO (box rosso):
     "Fissare sotto manche = INVITANTE (il partner puo passare!)"
3. LE DUE DOMANDE (due fumetti con punto interrogativo):
   Domanda 1: "Il partner poteva accontentarsi di manche?"
   Domanda 2: "Aveva strade piu forti disponibili?"
4. QUARTO COLORE RITARDATO (box viola con orologio):
   "Usa il 4 colore per CREARE terreno solido prima di fissare"
   "Prima stabilisci la forza, poi fissa!"
5. IN COMPETIZIONE (box arancione con X):
   "Fissare in competizione = SOLO competitivo!"
   "Per lo slam, usa la SURLICITA (cue bid del colore avversario)"
6. Diagramma: scala che sale da Parziale -> Manche -> Slam con punto "Fissare" evidenziato
7. Box ricorda: "Fissare = accordo sull'atout. Terreno solido = obbligo a continuare!"
"""
    },
    {
        "id": "205",
        "titolo": "Accostamento a Slam - Le Cue Bid",
        "contenuto": """
Visualizza questi concetti chiave:
1. TITOLO: "CUE BID: mostra i tuoi CONTROLLI al partner!"
2. DEFINIZIONE (box azzurro):
   "Cue bid = dichiarare un CONTROLLO (Asso, vuoto, Re, singolo) in un colore laterale"
3. LE 4 REGOLE (4 box numerati con icone):
   Regola 1: "NON fare cue nel colore atout!" (X rossa)
   Regola 2: "Fai la cue bid PIU ECONOMICA disponibile" (freccia bassa)
   Regola 3: "Cue SALTATA = quel controllo NON c'e!" (buco evidenziato)
   Regola 4: "Cue saltata poi fatta = controllo di TERZO giro" (Re/singolo)
4. SOTTO MANCHE (box verde con punto esclamativo):
   "Le cue bid sotto manche sono OBBLIGATORIE!"
   "NON negare per mano minima - nega solo chi non ha il controllo!"
5. LE 4 FASI DELLO SLAM (schema a passi con frecce):
   Fase 1: FISSARE l'atout
   Fase 2: VERIFICARE i controlli (cue bid)
   Fase 3: RIDEFINIRE la forza
   Fase 4: 4NT (Blackwood) o cue bid finale
6. LIVELLO DI GUARDIA (box giallo):
   "Chi RIPOSA nel livello di guardia = MINIMO. Chi supera = EXTRA forza"
7. Box motto: "Cue bid = dialogo sui controlli. Ogni informazione conta per lo slam!"
"""
    },
    {
        "id": "206",
        "titolo": "Le Sottoaperture",
        "contenuto": """
Visualizza questi concetti chiave:
1. TITOLO: "SOTTOAPERTURE: 2Q, 2C, 2P - interdittive con 6 carte"
2. REQUISITI (box azzurro con checklist):
   - 6 carte nel colore
   - 6-10 punti onori
   - 2 Quadri: ottimo colore, almeno 2 ONORI MAGGIORI (A, K, Q)
3. DIVIETO (box rosso con X grande):
   "MAI sottoaprire con quarta NOBILE a fianco!"
   Esempio: con 6 quadri + 4 cuori -> NON aprire 2Q, rischi di perdere il fit a cuori
4. OGUST (2NT dal rispondente) - Tabella colorata:
   - 3 Fiori = MINIMO + colore BRUTTO
   - 3 Quadri = MINIMO + colore BELLO
   - 3 Cuori = MASSIMO + colore BRUTTO
   - 3 Picche = MASSIMO + colore BELLO
   - 3 Senza = AKQxxx (colore solidissimo!)
5. RIALZO A 3 (box giallo attenzione):
   "Rialzo a 3 nel colore = DECISIONALE"
   "NON e un invito! Il partner DEVE passare!"
6. Esempio mano: AKJ875 con 7 punti -> "Perfetta per 2 Picche!"
7. Box motto: "La sottoapertura ruba spazio agli avversari e descrive una mano precisa!"
"""
    },
    {
        "id": "207",
        "titolo": "L'Apertura di 2F Forte Indeterminata",
        "contenuto": """
Visualizza questi concetti chiave:
1. TITOLO con stella dorata: "2 FIORI: l'unica apertura FORTE! Nessun limite superiore!"
2. CONCETTO (box dorato):
   "2F = mano fortissima, almeno 22-23+ punti o gioco indipendente"
   "E' l'UNICA apertura forte del sistema"
3. RISPOSTE (schema ad albero con 3 rami):
   - 2 QUADRI = "ATTESA" (la risposta piu comune, non dice nulla sulla mano)
   - 2 CUORI / 2 PICCHE = "5+ carte con almeno 1 onore + 5 punti" (FORZANTE MANCHE!)
   - Con mano forte: non fare 2Q, mostra subito il colore!
4. RIDICHIARAZIONI DELL'APERTORE (tabella):
   - 2NT = bilanciata 23+ punti
   - 2C / 2P = NON forzante manche fino a 3 nel colore
   - 3C / 3P = MONOCOLORE CHIUSA, impone l'atout!
5. POSSESSO DEL BOARD (box rosso con martello):
   "Su intervento avversario: O GIOCHIAMO NOI, O CONTRATI!"
   "Il 2F e cosi forte che gli avversari non possono giocare tranquilli"
6. Esempio: AKQJxx AKx Ax Kx -> "2F poi 2 Picche: mano enorme!"
7. Box motto: "2 Fiori = la bomba atomica della licita. Usala con rispetto!"
"""
    },
    {
        "id": "208",
        "titolo": "Competitivo, Costruttivo, Interdittivo",
        "contenuto": """
Visualizza questi concetti chiave:
1. TITOLO: "Tre tipi di dichiarazioni: riconoscili!"
2. TRE COLONNE con semafori colorati:
   COMPETITIVO (giallo, icona scudo):
   - "Senza ambizioni di manche"
   - "Colori da giocare, NON a salto"
   - "Solo per competere sulla parziale"

   COSTRUTTIVO (verde, icona freccia su):
   - "Serio tentativo di manche o slam"
   - "Contro informativo / Surlicita / Cambio colore forzante"
   - "Invita il partner a valutare"

   INTERDITTIVO (rosso, icona esplosione):
   - "Molte prese in attacco + poche in difesa"
   - "SEMPRE a salto!"
   - "Ruba spazio agli avversari"
3. COME RICONOSCERLI (box azzurro con lente):
   - Guarda il SISTEMA (convenzioni)
   - Guarda le ALTERNATIVE FORTI disponibili
   - Guarda l'INTENZIONE gia manifestata
4. REGOLA D'ORO INTERDITTIVA (box rosso grande):
   "Fai l'interdittiva al MASSIMO livello alla PRIMA occasione!"
   "Non aspettare: il secondo turno e troppo tardi!"
5. Esempio: con 7 carte e 5 punti al primo turno -> 3 nel colore subito!
6. Box motto: "Competitivo = difendo, Costruttivo = propongo, Interdittivo = attacco!"
"""
    },
    {
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
"""
    },
    {
        "id": "210",
        "titolo": "Mani di Fit nel Nobile - Bergen e Senza Forzante",
        "contenuto": """
Visualizza questi concetti chiave:
1. TITOLO: "Sistema BERGEN: appoggi piu precisi!"
2. BERGEN RAISES (tabella colorata con fasce):
   - 3 FIORI = fit QUARTO con 7-9 punti (appoggio debole)
   - 3 QUADRI = fit QUARTO con 10-11 punti (appoggio invitante)
   "Bergen usa le minori per descrivere la forza dell'appoggio!"
3. 2NT TRUSCOTT nel Bergen (box dorato):
   "2NT = fit QUARTO + 12+ punti (forzante manche!)"
   "Piu forte che nello Standard!"
4. 1NT FORZANTE (box azzurro con lucchetto):
   "1NT = campo 5-11 punti"
   "Con 4-7: dopo la ridichiarazione, RIPORTO a 2 nel nobile"
   "Con 11: dopo la ridichiarazione, RIPORTO a 3 (invitante)"
5. APPOGGIO A 2 = COSTRUTTIVO (box verde):
   "Appoggio a 2 = 7/8-10 punti (costruttivo, non barrage!)"
   "Nel Bergen l'appoggio a 2 ha un range preciso"
6. L'APERTORE SU 1NT (box rosso attenzione):
   "L'apertore DEVE ridichiarare!"
   "Eccezione: 5332 con 11 punti puo passare"
7. Box motto: "Bergen = precisione negli appoggi. Ogni livello ha un significato!"
"""
    },
    {
        "id": "211",
        "titolo": "Mani di Fit nel Nobile - NT Forzante",
        "contenuto": """
Visualizza questi concetti chiave:
1. TITOLO: "1NT FORZANTE: il sistema moderno per gli appoggi"
2. APPOGGIO A 2 = COSTRUTTIVO (box verde con bilancia):
   "Appoggio a 2 = 8-10 punti con fit TERZO"
   "Costruttivo: il partner valuta se andare a manche"
3. 1NT FORZANTE (box azzurro grande):
   "Campo: 5-11 punti"
   "Le risposte 2 su 1 = FORZANTE MANCHE (12+ punti)"
   "1NT copre tutto il campo debole-medio"
4. 2NT TRUSCOTT (box dorato):
   "Fit QUARTO + invito manche (10-12 punti)"
   "Con fit TERZO: usa 1NT, non 2NT"
5. CON FIT QUINTO (box viola speciale):
   "2NT poi rialzare COMUNQUE = 10 carte in linea!"
   "REGOLA: 10 carte = 10 prese! Vai a manche!"
6. DOPO INTERVENTO AVVERSARIO (box giallo):
   "Appoggio a 2 = tutto campo (5-10 punti)"
   "L'intervento semplifica: non serve piu la precisione"
7. Tabella comparativa:
   Fit 3 + 8-10 = appoggio a 2
   Fit 4 + 10-12 = 2NT Truscott
   Fit 5 + 10 = 2NT poi rialzo
   5-11 qualsiasi = 1NT forzante
"""
    },
    {
        "id": "212",
        "titolo": "Interventi Speciali e Difese",
        "contenuto": """
Visualizza questi concetti chiave:
1. TITOLO: "Convenzioni di Intervento: bicolori e difese"
2. MICHAEL'S CUE BID (box azzurro con 2 frecce):
   "Surlicita dopo 1C o 1P avversario = ALTRO NOBILE + una MINORE"
   "Esempio: (1C) - 2C = Picche + una minore (almeno 5-5!)"
   "Almeno 5-5 carte nei due colori!"
3. GHESTEM (box viola con schema completo):
   "Schema per mostrare bicolori dopo apertura avversaria"
   Tabella con tutti i colori e significati
4. DIFESA SU 1NT AVVERSARIO (box verde):
   - 2F Landy = 5/4+ nelle NOBILI (cuori + picche)
   - 2Q / 2C = TRANSFER (come dopo 1NT del partner)
   - 2NT = le due MINORI (fiori + quadri)
5. DIFESA SU 2Q MULTICOLOR (box rosso):
   "Contro = ho i CUORI (diretto)"
   "Passo poi Contro = ho le PICCHE (ritardato)"
6. REGOLA FONDAMENTALE (box giallo con X):
   "MAI spacciare 5-4 per bicolori!"
   "I bicolori richiedono ALMENO 5-5 carte!"
7. Box motto: "Le convenzioni sono strumenti potenti ma serve accordo col partner!"
"""
    },
    {
        "id": "213",
        "titolo": "Casi Particolari dopo le Risposte 1 su 1",
        "contenuto": """
Visualizza questi concetti chiave:
1. TITOLO: "Dopo 1 su 1: rever, dichiarazioni libere e casi speciali"
2. REVER A SENZA ATOUT (box azzurro con tabella):
   - 2NT = 17-18 punti (distribuzione 5332)
   - 3NT = 19-20 punti (distribuzione 5332)
   "Rever bilanciato: mostra la forza precisa!"
3. DICHIARAZIONI LIBERE DOPO INTERVENTO (box giallo con stella):
   "Libera = dopo che l'avversario ha parlato"
   "Fai dichiarazione libera SOLO con qualcosa di speciale!"
   "Se niente di speciale: PASSO (il partner parlera)"
4. APPOGGIO IMMEDIATO LIBERO (box verde):
   "Appoggio libero = garantisce fit QUARTO!"
   "Senza intervento potrebbe essere fit terzo, con intervento = sempre quarto"
5. SURLICITA LIBERA (box dorato con corona):
   "La SURLICITA libera = il modo PIU FORTE per comunicare fit!"
   "Dichiarare il colore avversario = forza + fit nel colore del partner"
6. CONTRO LIBERO (box rosso):
   "Contro libero = qualsiasi mano 16-20 punti"
   "NON adatta a dichiarazione naturale"
   "Chiede al partner di descrivere"
7. Box motto: "Dopo l'intervento le dichiarazioni diventano piu precise: libere = speciali!"
"""
    },
]


def generate_infographic(lezione, retry=0):
    prompt = f"""Genera un'infografica educativa per la FIGB (Federazione Italiana Gioco Bridge).
Corso: Cuori Licita (Licita Avanzata)
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
            combined_path = os.path.join(OUTPUT_DIR, "corso-cuori-licita-junior.pdf")
            first = all_imgs[0]
            rest = all_imgs[1:] if len(all_imgs) > 1 else []
            first.save(combined_path, 'PDF', resolution=150, save_all=True, append_images=rest)
            combined_size = os.path.getsize(combined_path) / 1024
            print(f"\n  COMBINATO corso-cuori-licita-junior.pdf ({combined_size:.0f} KB) - {len(all_imgs)} pagine")
    except Exception as e:
        print(f"  ERRORE PDF combinato: {e}")


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("=" * 60)
    print("FIGB - Generazione Infografiche Corso Cuori Licita")
    print("Profilo: Junior (8-17) - Maestro Franci")
    print(f"Modello: {MODEL}")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 60)
    success = 0
    failed = 0
    for i, lezione in enumerate(LEZIONI):
        print(f"\n[{i+1}/14] Lezione {lezione['id']}: {lezione['titolo']}")
        if generate_infographic(lezione):
            success += 1
        else:
            failed += 1
        if i < len(LEZIONI) - 1:
            time.sleep(3)
    print(f"\n{'=' * 60}")
    print(f"IMMAGINI: {success}/14 generate, {failed} fallite")
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
