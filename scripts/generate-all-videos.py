#!/usr/bin/env python3
"""
BridgeQuest - HeyGen Video Generator (Python)
Generates all lesson videos for Quadri, Cuori Gioco, Cuori Licita
Two-pass: submit all, then download all
"""

import json
import os
import ssl
import time
import urllib.request

API_KEY = os.environ.get("HEYGEN_API_KEY", "")
if not API_KEY:
    raise SystemExit("Set HEYGEN_API_KEY environment variable")
AVATAR_ID = "8734f8e7c55647498a62a88d6810f2ea"
VOICE_ID = "915ddcfeebea4e86a94d48a6e142fb8a"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "videos")
STATE_FILE = os.path.join(os.path.dirname(__file__), "video-jobs.json")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# ===== VIDEO SCRIPTS =====
# Format: (filename, script_text)

VIDEOS = [
    # Quadri
    ("maestro-quadri-lezione1.mp4", "Benvenuto a BridgeQuest! Sono il tuo Maestro. Oggi parliamo del Corso Quadri, Lezione 1: Tempi e comunicazioni nel gioco a Senza. Il gioco a Senza Atout pone una domanda fondamentale: posso affrancare le prese che mi servono prima che gli avversari ne affranchino abbastanza per battere il mio contratto? I tempi sono essenziali, il gioco a Senza e una corsa."),
    ("maestro-quadri-lezione2.mp4", "Benvenuto a BridgeQuest! Oggi parliamo di Valutazioni sull'apertura. Impariamo quando aprire la dichiarazione e con che cosa. Mani di 12-19 punti, mani bilanciate e sbilanciate, aperture nei nobili e nei minori. La regola fondamentale: si apre con 12 o piu punti onori."),
    ("maestro-quadri-lezione3.mp4", "Benvenuto a BridgeQuest! Oggi parliamo dei Contratti ad atout: tempo e controllo. Vedremo come gestire il colore di atout, quando battere gli atout avversari e quando ritardare. Il tempo e il controllo sono i concetti chiave del gioco ad atout."),
    ("maestro-quadri-lezione4.mp4", "Benvenuto a BridgeQuest! Oggi parliamo del Capitanato e la replica dell'apertore. Chi comanda nella coppia? Come deve replicare chi ha aperto dopo la risposta del compagno? Vedremo le priorita nella scelta della replica."),
    ("maestro-quadri-lezione5.mp4", "Benvenuto a BridgeQuest! Oggi parliamo dei Colori bucati: come muovere le figure. Impariamo le combinazioni di carte e come sviluppare prese con onori incompleti. L'impasse, il surimpasse e altre manovre fondamentali."),
    ("maestro-quadri-lezione6.mp4", "Benvenuto a BridgeQuest! Oggi parliamo delle Aperture oltre il livello 1. Aperture di 1 Senza Atout, aperture a livello 2 e le convenzioni speciali per mani forti. Quando non basta aprire a livello uno."),
    ("maestro-quadri-lezione7.mp4", "Benvenuto a BridgeQuest! Oggi parliamo di Attacchi e segnali di controgioco. L'attacco e il momento piu importante per la difesa. Impariamo gli attacchi standard e i segnali con cui i difensori comunicano."),
    ("maestro-quadri-lezione8.mp4", "Benvenuto a BridgeQuest! Oggi parliamo dell'Accostamento a manche. Il Terzo e il Quarto colore forzante, le dichiarazioni invitanti e forzanti per trovare il contratto migliore. Come arrivare a manche in modo scientifico."),
    ("maestro-quadri-lezione9.mp4", "Benvenuto a BridgeQuest! Oggi parliamo di Ricevere l'attacco. Deduzioni sulla distribuzione avversaria dall'attacco ricevuto. Come sfruttare le informazioni che ci da l'avversario con la sua prima carta."),
    ("maestro-quadri-lezione10.mp4", "Benvenuto a BridgeQuest! Oggi parliamo del Contro e la Surlicita. Il Contro informativo, il Contro punitivo e la Surlicita sono strumenti essenziali per intervenire nella dichiarazione avversaria."),
    ("maestro-quadri-lezione11.mp4", "Benvenuto a BridgeQuest! Oggi parliamo di Controgioco: ragionare e dedurre. Ricostruire la mano del dichiarante, collaborare col compagno e trovare la difesa vincente usando la logica."),
    ("maestro-quadri-lezione12.mp4", "Benvenuto a BridgeQuest! Oggi parliamo di Interventi e riaperture. Il Contro informativo, l'intervento a colore e a Senza Atout. Quando e come inserirsi nella dichiarazione avversaria."),
    # Cuori Gioco
    ("maestro-cuori-gioco-lezione100.mp4", "Benvenuto al Corso Cuori Gioco avanzato! Oggi parliamo della Prima Presa. Deduzioni dalla carta di attacco e riflessi immediati. La prima presa e cruciale: da essa possiamo dedurre la distribuzione e pianificare il gioco."),
    ("maestro-cuori-gioco-lezione101.mp4", "Benvenuto al Corso Cuori Gioco! Oggi parliamo di Fit 5-3 e Fit 4-4. Come gestire diversamente i due tipi di fit e sfruttare al meglio le risorse di entrambe le mani. Il fit 4-4 produce spesso una presa in piu."),
    ("maestro-cuori-gioco-lezione102.mp4", "Benvenuto al Corso Cuori Gioco! Oggi parliamo di Conto e Preferenziali. I segnali di conteggio e preferenziali sono fondamentali per la comunicazione difensiva. Impariamo quando e come usarli."),
    ("maestro-cuori-gioco-lezione103.mp4", "Benvenuto al Corso Cuori Gioco! Oggi parliamo dei Colori da Muovere in Difesa. Non tutti i colori sono uguali per i difensori. Impariamo a scegliere il colore giusto da attaccare e da continuare."),
    ("maestro-cuori-gioco-lezione104.mp4", "Benvenuto al Corso Cuori Gioco! Oggi parliamo dei Giochi di Sicurezza. A volte conviene rinunciare alla presa massima per garantire il contratto. I safety play proteggono da distribuzioni sfavorevoli."),
    ("maestro-cuori-gioco-lezione105.mp4", "Benvenuto al Corso Cuori Gioco! Oggi parliamo di Probabilita e Percentuali. Le tabelle di distribuzione, i principi combinatori e come calcolare la linea di gioco con le probabilita piu alte."),
    ("maestro-cuori-gioco-lezione106.mp4", "Benvenuto al Corso Cuori Gioco! Oggi parliamo di Coprire o Non Coprire. Quando giocare alto su un onore avversario e quando lasciar correre. La regola del coprire e le sue eccezioni."),
    ("maestro-cuori-gioco-lezione107.mp4", "Benvenuto al Corso Cuori Gioco! Oggi parliamo dei Giochi di Eliminazione. La messa in mano forzata, lo strip and endplay. Eliminare le uscite dell'avversario per costringerlo a giocare a nostro favore."),
    ("maestro-cuori-gioco-lezione108.mp4", "Benvenuto al Corso Cuori Gioco! Oggi parliamo di Giocare Come Se. Ipotesi necessarie e supposizioni utili. Quando la distribuzione avversaria sembra sfavorevole, assumiamo quella che ci permette di fare il contratto."),
    ("maestro-cuori-gioco-lezione109.mp4", "Benvenuto al Corso Cuori Gioco! Oggi parliamo delle Deduzioni del Giocante. Leggere la distribuzione dalla dichiarazione e dal gioco, contare i punti e ricostruire le mani avversarie."),
    # Cuori Licita
    ("maestro-cuori-licita-lezione200.mp4", "Benvenuto al Corso Cuori Licita avanzato! Oggi parliamo della Legge delle Prese Totali. Dichiarare in base al numero di atout in linea. Questa legge e la base delle dichiarazioni competitive moderne."),
    ("maestro-cuori-licita-lezione201.mp4", "Benvenuto al Corso Cuori Licita! Oggi parliamo di Valutazioni: le lunghe e le corte. Superare il semplice conteggio dei punti onori per valutare distribuzione, fit e potenziale di presa."),
    ("maestro-cuori-licita-lezione202.mp4", "Benvenuto al Corso Cuori Licita! Oggi parliamo delle Texas su apertura 1NT e 2NT. Le Jacoby Transfer permettono di trasferire la dichiarazione all'apertore, preservando il vantaggio della mano forte coperta."),
    ("maestro-cuori-licita-lezione203.mp4", "Benvenuto al Corso Cuori Licita! Oggi parliamo degli Sviluppi dopo le risposte 2 su 1. Il sistema forzante a manche, le priorita nella replica e come descrivere la mano con precisione."),
    ("maestro-cuori-licita-lezione204.mp4", "Benvenuto al Corso Cuori Licita! Oggi parliamo dell'Accostamento a Slam: fissare l'atout. Prima di cercare lo Slam bisogna concordare il colore di atout. Vediamo come e quando farlo."),
    ("maestro-cuori-licita-lezione205.mp4", "Benvenuto al Corso Cuori Licita! Oggi parliamo delle Cue Bid per l'accostamento a Slam. Controllare gli Assi, mostrare i controlli e decidere se lo Slam e raggiungibile."),
    ("maestro-cuori-licita-lezione206.mp4", "Benvenuto al Corso Cuori Licita! Oggi parliamo delle Sottoaperture. Le aperture deboli di 2 Cuori, 2 Picche e 3 a colore. Quando e perche aprire con mani deboli ma distribuite."),
    ("maestro-cuori-licita-lezione207.mp4", "Benvenuto al Corso Cuori Licita! Oggi parliamo dell'apertura di 2 Fiori forte indeterminata. La dichiarazione piu forte del sistema, riservata alle mani con 22 o piu punti o potenziale di gioco enorme."),
    ("maestro-cuori-licita-lezione208.mp4", "Benvenuto al Corso Cuori Licita! Oggi parliamo di dichiarazioni competitive, costruttive e interdittive. Come distinguere questi tre tipi e usarli per comunicare col compagno."),
    ("maestro-cuori-licita-lezione209.mp4", "Benvenuto al Corso Cuori Licita! Oggi parliamo delle Mani di fit nel nobile: approccio standard. Come gestire l'appoggio diretto, i salti e le dichiarazioni invitanti dopo l'apertura in un nobile."),
    ("maestro-cuori-licita-lezione210.mp4", "Benvenuto al Corso Cuori Licita! Oggi parliamo delle Mani di fit nel nobile: il sistema Bergen. Un approccio moderno all'appoggio dei nobili che usa risposte a livello 3 per descrivere la forza dell'appoggio."),
    ("maestro-cuori-licita-lezione211.mp4", "Benvenuto al Corso Cuori Licita! Oggi parliamo delle Mani di fit nel nobile: appoggi costruttivi. Il Contro costruttivo e le dichiarazioni dopo intervento avversario quando abbiamo il fit."),
    ("maestro-cuori-licita-lezione212.mp4", "Benvenuto al Corso Cuori Licita! Oggi parliamo di Interventi speciali e difese. Il Michaels, il Landy, il Lebensohl e altre convenzioni difensive contro le aperture avversarie."),
    ("maestro-cuori-licita-lezione213.mp4", "Benvenuto al Corso Cuori Licita! Oggi parliamo dei Casi particolari dopo le risposte 1 su 1. Come gestire la replica quando il rispondente offre un cambio di colore a livello 1."),
]

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return json.load(f)
    return {}

def save_state(state):
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

def api_request(url, data=None):
    headers = {"X-Api-Key": API_KEY}
    if data:
        headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers, method='POST')
    else:
        req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
        return json.loads(resp.read().decode())

def submit_video(script_text):
    payload = {
        "video_inputs": [{
            "character": {"type": "avatar", "avatar_id": AVATAR_ID, "avatar_style": "normal"},
            "voice": {"type": "text", "input_text": script_text, "voice_id": VOICE_ID, "speed": 1.0},
            "background": {"type": "color", "value": "#f0fdf4"}
        }],
        "dimension": {"width": 1280, "height": 720}
    }
    result = api_request("https://api.heygen.com/v2/video/generate", payload)
    return result.get("data", {}).get("video_id")

def check_status(video_id):
    result = api_request(f"https://api.heygen.com/v1/video_status.get?video_id={video_id}")
    data = result.get("data", {})
    return data.get("status", "unknown"), data.get("video_url")

def download(url, filepath):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=120, context=ctx) as resp:
        data = resp.read()
        with open(filepath, 'wb') as f:
            f.write(data)
        return len(data)

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    state = load_state()

    print(f"\n{'='*50}")
    print(f"  BridgeQuest Video Generator")
    print(f"  {len(VIDEOS)} videos total")
    print(f"{'='*50}\n")

    # Phase 1: Submit all videos that haven't been submitted yet
    print("PHASE 1: Submitting videos...\n")
    for filename, script in VIDEOS:
        filepath = os.path.join(OUTPUT_DIR, filename)
        if os.path.exists(filepath):
            print(f"  SKIP {filename} (already downloaded)")
            continue
        if filename in state and state[filename].get("video_id"):
            print(f"  SKIP {filename} (already submitted: {state[filename]['video_id']})")
            continue

        try:
            video_id = submit_video(script)
            state[filename] = {"video_id": video_id, "status": "submitted"}
            save_state(state)
            print(f"  OK {filename} -> {video_id}")
            time.sleep(1)  # Rate limit
        except Exception as e:
            print(f"  FAIL {filename}: {e}")
            time.sleep(3)

    # Phase 2: Poll and download
    print("\nPHASE 2: Downloading videos...\n")
    pending = {fn: s for fn, s in state.items() if s.get("video_id") and s.get("status") != "done"}

    max_rounds = 60  # 10 minutes max
    round_num = 0
    while pending and round_num < max_rounds:
        round_num += 1
        for filename in list(pending.keys()):
            filepath = os.path.join(OUTPUT_DIR, filename)
            if os.path.exists(filepath):
                state[filename]["status"] = "done"
                del pending[filename]
                continue

            vid = state[filename]["video_id"]
            try:
                status, url = check_status(vid)
                if status == "completed" and url:
                    size = download(url, filepath)
                    state[filename]["status"] = "done"
                    save_state(state)
                    del pending[filename]
                    print(f"  DONE {filename} ({size // 1024}KB)")
                elif status == "failed":
                    print(f"  FAILED {filename}")
                    state[filename]["status"] = "failed"
                    del pending[filename]
                else:
                    state[filename]["status"] = status
            except Exception as e:
                print(f"  ERR {filename}: {e}")

        if pending:
            remaining = len(pending)
            print(f"  ... {remaining} remaining, waiting 10s (round {round_num})...")
            save_state(state)
            time.sleep(10)

    save_state(state)

    # Summary
    done = sum(1 for s in state.values() if s.get("status") == "done")
    failed = sum(1 for s in state.values() if s.get("status") == "failed")
    downloaded = len([f for f in os.listdir(OUTPUT_DIR) if "quadri" in f or "cuori" in f])
    print(f"\n{'='*50}")
    print(f"  DONE: {done} | FAILED: {failed} | FILES: {downloaded}")
    print(f"{'='*50}\n")

if __name__ == "__main__":
    main()
