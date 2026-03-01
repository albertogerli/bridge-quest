#!/usr/bin/env python3
"""
Genera infografiche FIGB per Corso Fiori - Profilo Junior (Maestro Franci)
Usa Gemini 3 Pro Image (Nano Banana Pro) API
"""

import json
import base64
import urllib.request
import urllib.parse
import ssl
import os
import time

API_KEY = os.environ.get("GEMINI_API_KEY", "")
if not API_KEY:
    raise SystemExit("Set GEMINI_API_KEY environment variable")
MODEL = "gemini-3-pro-image-preview"
BASE_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

OUTPUT_DIR = "/Users/albertogiovannigerli/Desktop/Personale/Bridge/bridgequest/public/infografiche/fiori"

# Stile comune per tutte le infografiche
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
        "id": "00",
        "titolo": "Il Bridge - Un Gioco di Prese",
        "contenuto": """
Visualizza questi concetti chiave:
1. Un tavolo da bridge verde dall'alto con le 4 posizioni: NORD, SUD, EST, OVEST
2. I 4 semi delle carte con simboli: Picche (♠), Cuori (♥), Quadri (♦), Fiori (♣)
3. La gerarchia delle dichiarazioni: NT > ♠ > ♥ > ♦ > ♣
4. Cos'è una PRESA: 4 carte giocate (1 per giocatore), vince la più alta
5. Il CONTRATTO: impegno della coppia a fare X prese (es: "3NT" = 9 prese)
6. I ruoli: GIOCANTE (gioca le sue carte + quelle del MORTO), DIFENSORI (gli altri 2)
7. Punteggio base: Manche = 3NT, 4♥, 4♠, 5♣, 5♦
"""
    },
    {
        "id": "01",
        "titolo": "Vincenti e Affrancabili",
        "contenuto": """
Visualizza questi concetti chiave:
1. CARTA VINCENTE (franca): se giocata ora, vince sicuro (es: l'Asso)
2. CARTA AFFRANCABILE: diventerà vincente dopo una manovra
3. CARTE EQUIVALENTI: carte contigue formano sequenza (KQJ = tutte equivalenti)
4. Esempio visivo: AKQ = 3 vincenti; KQJ10 = 0 vincenti ma 3 affrancabili (dopo che cade l'Asso)
5. Regola del LATO LUNGO: il max di prese = carte del lato più lungo
6. Diagramma: mano Nord con J109 e mano Sud con AKQ -> solo 3 prese (non 6!)
7. STRATEGIA: prima sviluppa le affrancabili, poi incassa le vincenti
"""
    },
    {
        "id": "02",
        "titolo": "Il Punto di Vista dei Difensori",
        "contenuto": """
Visualizza questi concetti chiave:
1. Obiettivo difensori: battere il contratto (raggiungere complemento a 14)
2. ATTACCO a Senza Atout: scegliere il colore più lungo
3. Regola 1 - ATTACCO DALL'ALTO (con sequenza): KQJ→Re, QJ9→Donna, J1094→Fante
4. Regola 2 - ATTACCO DAL BASSO (senza sequenza): K10543→il 3, AJ952→il 2
5. Il TERZO DI MANO: gioca la più bassa delle equivalenti (KQJ→Fante, AKQ→Donna)
6. Regola SECONDA POSIZIONE: piccola su piccola, copri onore con onore
7. Diagramma visivo con frecce che mostrano l'ordine di gioco in una presa
"""
    },
    {
        "id": "03",
        "titolo": "Affrancamenti di Lunga e di Posizione",
        "contenuto": """
Visualizza questi concetti chiave:
1. Tre tipi di affrancamento: DI FORZA, DI LUNGA, DI POSIZIONE
2. AFFRANCAMENTO DI LUNGA: con molte carte, dopo alcuni giri le piccole diventano vincenti
3. Esempio: AKQ43 + 762 → dopo 3 giri, le ultime 2 carte sono franche
4. COMUNICAZIONI: servono rientri per incassare le carte affrancate
5. IMPASSE: giocare VERSO un onore protetto (es: AQ verso la Donna, sperando Re a sinistra) = 50%
6. EXPASSE: giocare VERSO un onore non protetto (es: K85, giocare verso il Re sperando Asso a sinistra)
7. TENUTA (difesa): figura che impedisce l'affrancamento avversario
"""
    },
    {
        "id": "04",
        "titolo": "Piano di Gioco a Senza Atout",
        "contenuto": """
Visualizza questi concetti chiave:
1. LE 3 DOMANDE del piano di gioco (diagramma a frecce):
   → Quante vincenti ho?
   → Quante me ne mancano?
   → Da quale colore le trovo?
2. SALVAGUARDARE GLI INGRESSI: non sprecare carte alte vicino alla lunga
3. IL DUCK (Colpo in Bianco): cedere subito una presa per mantenere comunicazioni
4. Esempio: AK6 + 86532 → gioca il 2 (duck), poi A, K → le ultime 2 sono franche
5. COLORI BLOCCATI: onori del lato corto prima! (es: K2 + AQJ43 → Re prima!)
6. CORSA ALL'AFFRANCAMENTO: chi sviluppa per primo vince
7. Schema riassuntivo del piano di gioco con i passi numerati
"""
    },
    {
        "id": "05",
        "titolo": "Il Gioco con l'Atout",
        "contenuto": """
Visualizza questi concetti chiave:
1. IL FIT: 8+ carte in un colore tra le 2 mani → quel colore diventa ATOUT
2. Priorità: ♠/♥ (nobili) > NT > ♣/♦ (minori)
3. I 3 POTERI dell'atout (diagramma con 3 icone):
   → CONTROLLO: tagliare le vincenti avversarie
   → ALLUNGAMENTO: ottenere più prese tagliando dalla mano corta
   → AFFRANCAMENTO: tagliare per affrancare un colore lungo
4. BATTERE LE ATOUT: togliere le atout avversarie prima di incassare le lunghe
5. RIVALUTAZIONE: con fit, aggiungi punti (atout - colore più corto = punti extra)
6. Esempio visivo di taglio: mano con 0 carte nel seme → taglia con l'atout
"""
    },
    {
        "id": "06",
        "titolo": "Piano di Gioco ad Atout",
        "contenuto": """
Visualizza questi concetti chiave:
1. Due scenari (diagramma a bivio):
   → HAI LUNGHE da incassare? → BATTI LE ATOUT prima!
   → HAI TAGLI da fare? → NON battere subito le atout!
2. Come COSTRUIRE I TAGLI: cedere prese per creare la possibilità di taglio
3. URGENZA: a volte anche un solo giro di atout sarebbe fatale
4. Regola: "Decidi di battere atout ≠ farlo subito" (prima le cose urgenti!)
5. DIFESA contro contratti ad atout:
   → Cercare PRESE RAPIDE
   → Attacco da SEQUENZA (bastano 2 onori: KQ, QJ, J10)
   → Attacco da CORTO (singolo o doubleton → sperare nel taglio)
   → MAI attaccare sotto Asso ad atout!
"""
    },
    {
        "id": "07",
        "titolo": "La Valutazione della Mano",
        "contenuto": """
Visualizza questi concetti chiave:
1. PUNTI ONORI (Milton Work) - grande tabella visiva:
   Asso = 4, Re = 3, Donna = 2, Fante = 1 (Totale mazzo = 40)
2. SOGLIA APERTURA: 12+ punti → APRI; 0-11 → PASSO
3. Regola d'oro: "11 punti NON ESISTONO: o sono 10 o sono 12"
4. PUNTI COPPIA per contratti:
   20-24 = Parziale | 25-31 = Manche | 32-36 = Slam
5. FORZA → determina il LIVELLO (1, 2, 3...)
6. DISTRIBUZIONE → determina il TIPO (quale colore aprire):
   → Colore più lungo
   → Due quinti: il più alto di rango
   → Due/tre quarti: il più basso di rango
7. 1NT = 15-17 bilanciata (4333, 4432, 5332)
"""
    },
    {
        "id": "08",
        "titolo": "L'Apertura e la Risposta 1NT/2NT",
        "contenuto": """
Visualizza questi concetti chiave:
1. APERTURA 1NT: 15-17 punti, bilanciata (4333, 4432, 5332)
2. Il CAPITANO: chi risponde decide il contratto (sa i punti dell'apertore!)
3. Tabella RISPOSTE su 1NT:
   Passo (0-7) | 2♦/♥/♠ (0-7, parziale) | 2NT (8-9, invitante)
   3♥/♠ (8-9, invitante) | 3NT (10+, manche) | 4♥/♠ (10+, manche)
4. STAYMAN 2♣: "Hai una quarta nobile?" (serve 8+ punti + 4 carte nobile)
   Risposte: 2♦ = no nobili | 2♥ = 4 cuori | 2♠ = 4 picche | 2NT = entrambi
5. APERTURA 2NT: 21-23 punti, bilanciata
6. Stayman su 2NT = 3♣ (stesse risposte scalate di 1 livello)
"""
    },
    {
        "id": "09",
        "titolo": "Apertura 1 a Colore - Le Risposte",
        "contenuto": """
Visualizza questi concetti chiave:
1. PASSO: 0-4 punti → manche impossibile
2. APPOGGI (con fit):
   Livello 2 (5-9 pt) = limitativo
   Livello 3 (10-11 pt) = invitante
   Livello 4 (fit 4+, max 11 pt) = conclusivo
3. COLORI NUOVI livello 1: 5+ punti, 4+ carte, FORZANTE
4. COLORI NUOVI livello 2: 12+ punti, FORZANTE A MANCHE
5. Risposte a NT: 1NT (5-10) non forzante | 2NT (11) invitante | 3NT (12-15) conclusiva
6. LEGGE DI RIVALUTAZIONE: con fit 4+, aggiungi (carte atout - colore più corto)
7. Con 5+ punti: DEVI SEMPRE RISPONDERE!
"""
    },
    {
        "id": "10",
        "titolo": "L'Apertore Descrive",
        "contenuto": """
Visualizza questi concetti chiave:
1. Due fasce di forza (diagramma):
   DIRITTO = 12-15 punti | ROVESCIO = 16-20 punti
2. LIVELLO DI GUARDIA (LDG): ultimo contratto "sicuro"
3. DIRITTO bilanciato: resta sotto 1NT
4. DIRITTO sbilanciato: resta sotto "2 nel suo colore"
5. ROVESCIO: SUPERA SEMPRE il Livello di Guardia
   → Salto di livello (es: 1♣-1♦ → 2♠ = rovescio!)
   → Appoggio a livello 3
   → Bilanciata 18-20: salto a 2NT
6. Dopo risposta 2 su 1: descrive SOLO distribuzione (manche già garantita)
7. Schema: frecce che collegano risposte → ridichiarazioni dell'apertore
"""
    },
    {
        "id": "11",
        "titolo": "L'Intervento",
        "contenuto": """
Visualizza questi concetti chiave:
1. Tre tipi di INTERVENTO (3 riquadri):
   → CONTRO INFORMATIVO: 12-16 pt, chiede al compagno di scegliere un colore
   → 1NT: 15-17 bilanciata + FERMO nel colore avversario
   → A COLORE: 8-16 pt, 5+ carte con 1+ Onore
2. CONTRO su 1♣/1♦: garantisce 4♥ e 4♠
   CONTRO su 1♥: garantisce 4♠
   CONTRO su 1♠: garantisce 4♥
3. Compagno del contrante: OBBLIGATO a parlare (anche con 0 punti!)
4. Compagno dell'interveniente: con 9+ punti NON passare mai
5. Regola d'oro: "Se il compagno ci attaccherà nel tuo colore e ti fa rizzare i capelli → intervento sbagliato!"
"""
    },
    {
        "id": "12",
        "titolo": "Sviluppi dopo l'Intervento Avversario",
        "contenuto": """
Visualizza questi concetti chiave:
1. OBBLIGATE vs LIBERE: con intervento avversario, non sei più obbligato a parlare
2. Su CONTRO avversario:
   → SURCONTRO = 11+ punti (unica dichiarazione forte)
   → Colore nuovo = NON forzante, buon colore 5-6 carte, < 11 pt
   → Appoggi = come prima, ma < 11 pt
3. Su COLORE avversario:
   → Colore nuovo = FORZANTE e almeno QUINTO (5+ carte)
   → CONTRO = cerca fit 4-4, promette 8+ punti
   → Senza = promettono FERMO nel colore avversario
4. Il QUARTO DI MANO: l'apertore può passare se il compagno ha risposto
5. Tabella: 1NT (7-10) | 2NT (11-12) | 3NT (13-14) - tutti con fermo
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


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 60)
    print("FIGB - Generazione Infografiche Corso Fiori")
    print("Profilo: Junior (8-17) - Maestro Franci")
    print(f"Modello: {MODEL}")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 60)

    success = 0
    failed = 0

    for i, lezione in enumerate(LEZIONI):
        print(f"\n[{i+1}/13] Lezione {lezione['id']}: {lezione['titolo']}")
        if generate_infographic(lezione):
            success += 1
        else:
            failed += 1
        # Rate limiting
        if i < len(LEZIONI) - 1:
            time.sleep(3)

    print(f"\n{'=' * 60}")
    print(f"RISULTATO: {success}/13 generate, {failed} fallite")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
