#!/usr/bin/env python3
"""
Genera infografiche FIGB per Corso Quadri - Profilo Junior (Maestro Franci)
Usa Gemini 3 Pro Image (Nano Banana Pro) API
"""

import json
import base64
import urllib.request
import urllib.parse
import ssl
import os
import time

API_KEY = "AIzaSyAB_VB1vU6eqJLf5OE_5OYeE5Gr571wUKs"
MODEL = "gemini-3-pro-image-preview"
BASE_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

OUTPUT_DIR = "/Users/albertogiovannigerli/Desktop/Personale/Bridge/bridgequest/public/infografiche/quadri"

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
        "id": "1",
        "titolo": "Tempi e Comunicazioni nel Gioco a Senza",
        "contenuto": """
Visualizza questi concetti chiave:
1. CORSA ALL'AFFRANCAMENTO: affrancare le proprie prese PRIMA degli avversari
2. SCEGLIERE LA SORGENTE DI PRESE: colore a 1 tempo vs colore a 2 tempi
3. PERCENTUALI importanti (diagramma visivo):
   → Divisione 3-3 = 36% (meno di 1 su 3)
   → Divisione 3-2 = 68% (2 su 3)
   → Impasse = 50% (1 su 2)
4. AVVERSARIO PERICOLOSO: il difensore che NON deve entrare in presa
5. LISCIARE L'ATTACCO: tagliare i collegamenti tra i difensori
6. Esempio: se Ovest ha il colore lungo, NON far prendere Ovest!
7. Schema decisionale: "Chi e' pericoloso? Come lo evito?"
"""
    },
    {
        "id": "2",
        "titolo": "Valutazioni sull'Apertura",
        "contenuto": """
Visualizza questi concetti chiave:
1. I 5 DIFETTI delle mani da 11 punti (lista con icone):
   → Poche carte di testa (non concentrate)
   → Impurita' negli onori (onori isolati)
   → Colori non competitivi (troppo corti)
   → Posizione sfavorevole (onori dietro all'apertore)
   → Pessima seconda dichiarazione
2. REGOLA: con 2 o piu' difetti su 11 punti → PASSO!
3. BARRAGE (aperture di sbarramento):
   → Apertura a livello 3: 7+ carte onorate, messaggio "3 prese in meno"
   → Apertura a livello 4: 8+ carte, messaggio ancora piu' aggressivo
4. VALUTARE LA DISTRIBUZIONE:
   → 4432 = molto meglio di 4333
   → Piu' la mano e' distribuita, piu' vale
5. Schema: "11 punti: apro o passo?" con checklist difetti
"""
    },
    {
        "id": "3",
        "titolo": "Contratti ad Atout - Tempo e Controllo",
        "contenuto": """
Visualizza questi concetti chiave:
1. SCARTARE SU VINCENTI LATERALI: farlo PRIMA di battere atout!
2. URGENZA di affrancare il colore laterale: se non lo fai subito, perdi il controllo
3. ATOUT LEGITTIMA vs ILLEGITTIMA:
   → Legittima: atout giocata per battere le atout avversarie
   → Illegittima: atout usata per tagliare (presa supplementare)
4. TAGLIARE DALLA PARTE CORTA: solo cosi' si ottengono prese supplementari
   → Diagramma: mano lunga (5 atout) + mano corta (3 atout) → taglia dalla corta!
5. IL FIT 4-4: il piu' potente nel bridge!
   → Perche': entrambe le mani possono tagliare nell'altro seme
   → Genera piu' prese di un fit 5-3
6. Schema: "Prima scarto, poi batto atout, poi incasso"
"""
    },
    {
        "id": "4",
        "titolo": "Il Capitanato e la Replica dell'Apertore",
        "contenuto": """
Visualizza questi concetti chiave:
1. CAPITANO vs SUBORDINATO (diagramma con 2 figure):
   → Capitano: chi conosce la forza combinata della coppia → DECIDE
   → Subordinato: chi NON conosce ancora → DESCRIVE
2. REGOLA D'ORO:
   → Se il Capitano INDAGA → il Subordinato descrive
   → Se il Capitano DECIDE → il Subordinato passa!
3. REVER dell'apertore (3 livelli con barre di forza):
   → Rever = 15-17 punti
   → Gran Rever = 16-20 punti
   → Piccoli Rever = 18-20 punti
4. REPLICHE ELASTICHE: l'apertore si adatta alla risposta del compagno
5. Schema: frecce Apertore ↔ Rispondente con flusso decisionale
6. Esempio: "1♠ - 2♣ - ?" → l'apertore replica in base alla sua forza
"""
    },
    {
        "id": "5",
        "titolo": "I Colori Bucati - Come Muovere le Figure",
        "contenuto": """
Visualizza questi concetti chiave:
1. CHI MUOVE PER PRIMO E' SVANTAGGIATO: giocare verso le figure, non da esse
2. FIGURE SPECIFICHE (diagrammi carte):
   → AQ54 + J632: impasse verso la Donna
   → KQ5 + 432: giocare verso KQ
   → AJ642 + K53: combinare impasse e lunghezza
3. GRADINO DI INGRESSO: servono rientri per ripetere l'impasse
   → Diagramma: frecce che mostrano il percorso di andata e ritorno
4. REGOLA AUREA:
   → Manca 1 onore + 2-3 cartine = IMPASSE
   → Manca 1 onore + solo 1 cartina = gioca di TESTA
5. COLPO DI SONDA: giocare per scoprire la posizione degli onori avversari
6. Schema riassuntivo: "Quando fare impasse vs giocare di testa"
"""
    },
    {
        "id": "6",
        "titolo": "Le Aperture Oltre il Livello 1",
        "contenuto": """
Visualizza questi concetti chiave:
1. APERTURE A LIVELLO 2 (tabella con colori):
   → 2♦/2♥/2♠: forzanti fino a 3 nel colore aperto
   → Significato: 6+ carte buone, 16-20 punti circa
2. APERTURA 2♣ (la piu' forte!):
   → Contenitore ambiguo: puo' essere bilanciata 23+ punti OPPURE base fiori fortissima
   → Risposta 2♦ D'ATTESA: "Non ho niente di speciale, descrivi tu"
3. ROMAN KEY CARD BLACKWOOD (4NT):
   → Chiede le 5 CHIAVI: 4 Assi + Re di atout
   → Risposte: 5♣=0/3, 5♦=1/4, 5♥=2/5 senza Donna, 5♠=2/5 con Donna
4. BARRAGE GAMBLING 3NT:
   → Colore minore solido (AKQxxxx), senza prese laterali
5. Schema: livelli di apertura dal piu' debole al piu' forte
"""
    },
    {
        "id": "7",
        "titolo": "Attacchi e Segnali di Controgioco",
        "contenuto": """
Visualizza questi concetti chiave:
1. IL BUSSO (diagramma con carte):
   → Carta PICCOLA = ho un onore nel colore
   → Carta ALTA = NON ho onori nel colore
2. IL CONTO (ordine delle carte):
   → PARI (alta poi bassa) = numero pari di carte nel colore
   → DISPARI (bassa poi alta) = numero dispari di carte
3. GRADIMENTO PARI-DISPARI:
   → Carta pari = gradimento (continua!)
   → Carta dispari = rifiuto (cambia colore!)
4. PRIMO SCARTO ALL'ITALIANA:
   → Carta DISPARI = chiama quel colore (lo vuoi!)
   → Carta PARI = rifiuta quel colore (non lo vuoi!)
5. GERARCHIA DEI SEGNALI:
   → Le SEQUENZE prevalgono sempre sul conto
6. Schema: "Quale segnale uso? Quando?" con albero decisionale
"""
    },
    {
        "id": "8",
        "titolo": "L'Accostamento a Manche",
        "contenuto": """
Visualizza questi concetti chiave:
1. TERZO COLORE (diagramma con esempio):
   → Forzante 1 giro oppure forcing manche
   → Usato quando non c'e' fit e si cerca la denominazione giusta
2. QUARTO COLORE:
   → Forcing MANCHE (tranne a livello 1)
   → Convenzionale: non promette carte nel colore
3. COMPORTAMENTO APERTORE SUL QUARTO COLORE (priorita'):
   → 1° Mostra fit nobile (3 carte)
   → 2° Dichiara Senza Atout con fermo
   → 3° Mostra lunghezze aggiuntive
4. CAMBIO COLORE A FIT TROVATO:
   → Indagini per manche o slam
   → Non e' un rifiuto del fit!
5. 2NT COME INVITO GENERICO:
   → Mostra 11 punti circa, bilanciata
6. Schema: percorso dichiarativo dall'apertura alla manche
"""
    },
    {
        "id": "9",
        "titolo": "Ricevere l'Attacco",
        "contenuto": """
Visualizza questi concetti chiave:
1. DEDUZIONI DALLA CARTA DI ATTACCO (tabella):
   → Piccola = ha un onore | Alta = nessun onore | Onore = sequenza
2. REGOLA FONDAMENTALE: nessuno attacca sotto Asso ad atout!
   → Se attaccano piccola, l'Asso NON ce l'hanno
3. LISCIARE FIGURE SPECIFICHE (diagrammi carte):
   → 654 / AJ3 → attacco K: liscia! (lascia vincere il Re)
   → A65 / J73 → attacco K: liscia! (proteggi l'Asso-Fante)
4. LISCIARE PER PIANO DI GIOCO:
   → A volte lisci per mantenere il controllo del colore
   → Lisci per tagliare i collegamenti difensivi
5. PROTEGGERE L'ASSO DAL TAGLIO:
   → Se rischi che taglino, prendi subito con l'Asso
6. Schema decisionale: "Prendo o liscio?" con albero di scelte
"""
    },
    {
        "id": "10",
        "titolo": "Il Contro e la Surlicita",
        "contenuto": """
Visualizza questi concetti chiave:
1. CONTRO vs SURLICITA (2 riquadri a confronto):
   → CONTRO: cerca il fit nel colore migliore
   → SURLICITA: promette fit gia' trovato + forza
2. COMPAGNO DELL'APERTORE:
   → Contro = cerca fit con il rispondente
   → Surlicita = fit trovato + forza per manche
3. COMPAGNO DELL'INTERVENIENTE:
   → Surlicita con 11+ punti e fit
   → Con 14+ punti anche senza fit
4. COMPAGNO DEL CONTRANTE:
   → Surlicita OBBLIGATORIA con 11+ punti
   → Sotto 11 punti: dichiara al minimo
5. CONTRO E SURLICITA DELL'APERTORE:
   → L'apertore puo' contrare o surlicitare dopo l'intervento
6. Schema: tabella riassuntiva "Chi fa cosa e quando"
"""
    },
    {
        "id": "11",
        "titolo": "Controgioco - Ragionare e Dedurre",
        "contenuto": """
Visualizza questi concetti chiave:
1. RICORDARE LA DICHIARAZIONE:
   → Ricostruire la mano del giocante dalla licita
   → Punti mostrati + distribuzione promessa
2. ANALIZZARE LA PRIMA PRESA:
   → Quale carta ha giocato il compagno? (segnale)
   → Quale carta ha giocato il giocante? (deduzione)
3. NON AFFRANCARE CARTE AL GIOCANTE:
   → Non giocare Assi su carte piccole
   → Aspettare il momento giusto per prendere
4. CAPIRE IL PIANO DI GIOCO E CONTRASTARLO:
   → Se il giocante vuole tagliare → gioca atout!
   → Se il giocante vuole affrancare → taglia i collegamenti!
5. MANTENERE STESSA LUNGHEZZA DEL MORTO:
   → Se il morto ha 4 cuori, mantieni 4 cuori
   → "Tieni quello che tiene il morto"
6. Schema: "I 5 passi del difensore pensante"
"""
    },
    {
        "id": "12",
        "titolo": "Interventi e Riaperture",
        "contenuto": """
Visualizza questi concetti chiave:
1. CONTRO INFORMATIVO + RIMOZIONE (diagramma):
   → Con 18+ punti: Contro poi ridichiara (rimozione)
   → Mostra mano troppo forte per semplice intervento
2. INTERVENTO A SALTO A LIVELLO 2:
   → 6 carte buone (almeno 2 onori)
   → 11-15 punti
   → Esempio: 1♣ - 2♥ = 6 cuori buone, forza media
3. 2NT BICOLORE MINORE 5-5:
   → Mostra almeno 5♦ e 5♣
   → Forza variabile, dipende dalla vulnerabilita'
4. PASSO FORTE + RIAPERTURA DEL COMPAGNO:
   → Passo con mano forte = trappola!
   → Il compagno DEVE riaprire con Contro
5. RIAPRIRE A COLORE vs CONTRO:
   → A colore: 5+ carte, pochi punti
   → Contro: distribuzione adatta, 10+ punti
6. Schema riassuntivo: "Tipi di intervento e quando usarli"
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
    print("FIGB - Generazione Infografiche Corso Quadri")
    print("Profilo: Junior (8-17) - Maestro Franci")
    print(f"Modello: {MODEL}")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 60)

    success = 0
    failed = 0

    for i, lezione in enumerate(LEZIONI):
        print(f"\n[{i+1}/12] Lezione {lezione['id']}: {lezione['titolo']}")
        if generate_infographic(lezione):
            success += 1
        else:
            failed += 1
        # Rate limiting
        if i < len(LEZIONI) - 1:
            time.sleep(3)

    print(f"\n{'=' * 60}")
    print(f"RISULTATO: {success}/12 generate, {failed} fallite")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
