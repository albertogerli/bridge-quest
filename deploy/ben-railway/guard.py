#!/usr/bin/env python3
"""
Guardia davanti a BEN.

PERCHÉ ESISTE
BEN (`gameapi.py`) non ha alcuna autenticazione: è nato per girare su
localhost. Messo su Railway diventa un indirizzo pubblico, e chiunque lo
trovasse potrebbe far girare inferenze TensorFlow sulla macchina che paghiamo
noi — o semplicemente tenerla occupata finché il servizio non risponde più.

Questo processo sta davanti a BEN e fa tre cose:
  1. pretende un segreto condiviso, lo stesso che il proxy di BridgeLab manda;
  2. lascia passare SOLO i quattro percorsi che l'app usa davvero. BEN ne
     espone una dozzina (`/claim`, `/explain_auction`, `/cuebid`, `/bids`…),
     alcuni molto più costosi di una carta da giocare: non c'è motivo di
     offrirli a Internet;
  3. se BEN muore, muore anche lei, così Railway riavvia tutto invece di
     tenere in piedi un servizio che risponde 502 per sempre.

NON MODIFICA BEN. Il sorgente resta quello di lorserker/ben, aggiornabile con
un `git pull` senza conflitti.

Solo libreria standard: BEN ha già le sue dipendenze, aggiungerne altre qui
significherebbe poterle rompere.
"""

import hmac
import os
import re
import subprocess
import sys
import threading
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# Il segreto arriva dall'ambiente. Senza, il processo NON parte: un valore
# vuoto passerebbe il confronto con un header assente e pubblicherebbe BEN
# in chiaro senza che nessuno se ne accorga.
TOKEN = os.environ.get("BEN_API_TOKEN", "").strip()

PORTA = int(os.environ.get("PORT", "8080"))
PORTA_BEN = int(os.environ.get("BEN_INTERNAL_PORT", "8085"))
UPSTREAM = f"http://127.0.0.1:{PORTA_BEN}"

# QUANTO ASPETTARE BEN, e perché dodici secondi erano proprio il numero
# sbagliato.
#
# BEN risponde in due modi diversi, e lo dichiara nel campo `who`:
#   · `NN`         la rete neurale risponde da sola      ~0,35 s
#   · `Simulation` non è sicura e simula in Monte Carlo   6,4 – 10,6 s
#
# Misurato in produzione il 25/08/2026 su 14 aste reali: la correlazione è
# perfetta, ogni risposta oltre i 5 secondi è una `Simulation` e nessuna `NN`
# ci arriva vicino. Con il taglio a 12 secondi le simulazioni finivano
# sull'orlo: bastava un po' di traffico contemporaneo per superarlo, e il
# risultato era un 502 `ben unavailable` — cioè il lavoro buttato via UN
# SECONDO prima che fosse pronto. Riprodotto: otto richieste insieme, due
# uccise a 12,43 s.
#
# Ventidue secondi lasciano finire anche la simulazione più lenta con margine.
# NON è il numero che rende BEN veloce — quello lo decide quanto campiona, e
# si regola più sotto con `MANI_SIMULAZIONE`. Questo è solo la soglia oltre la
# quale si smette di aspettare: tenerla bassa non accorcia il calcolo, lo
# butta via. Resta larga apposta, come rete di sicurezza per il caso in cui
# una simulazione costi più del previsto.
#
# Deve restare SOTTO il timeout della rotta `/api/ben/bid` (26 s), così a
# raccontare cosa è successo è sempre la guardia, che ne sa di più.
TIMEOUT = float(os.environ.get("BEN_TIMEOUT", "22"))

# I soli percorsi usati da src/app/api/ben/*. `/` è la sonda di salute.
# `/bid` è il modello neurale di licita: stessa rete, altro endpoint.
CONSENTITI = {"/", "/play", "/lead", "/autoplay", "/bid"}

INTESTAZIONE = "X-BEN-Token"


def _log(msg: str) -> None:
    print(f"[guard] {msg}", flush=True)


class Guardia(BaseHTTPRequestHandler):
    # Il log di default scrive una riga per richiesta con l'indirizzo del
    # chiamante: rumore, e su un servizio pubblico anche un dato in più
    # conservato senza motivo.
    def log_message(self, *_args):
        pass

    def _rispondi(self, code: int, corpo: bytes, tipo: str = "application/json") -> None:
        self.send_response(code)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def do_GET(self) -> None:  # noqa: N802 (nome imposto da BaseHTTPRequestHandler)
        percorso = self.path.split("?", 1)[0]

        # Sonda di salute SENZA segreto: Railway deve poterla chiamare, e non
        # rivela nulla — solo se il processo dietro è vivo.
        if percorso == "/healthz":
            try:
                with urllib.request.urlopen(f"{UPSTREAM}/", timeout=5) as r:
                    vivo = r.status == 200
            except Exception:
                vivo = False
            self._rispondi(200 if vivo else 503, b'{"ben":%s}' % (b"true" if vivo else b"false"))
            return

        atteso = self.headers.get(INTESTAZIONE, "")
        # Confronto a tempo costante: con `==` il tempo di risposta racconta
        # quanti caratteri iniziali sono giusti.
        if not hmac.compare_digest(atteso, TOKEN):
            # 404 e non 401: a chi non ha il segreto non si conferma nemmeno
            # che qui ci sia qualcosa da indovinare.
            self._rispondi(404, b'{"error":"not found"}')
            return

        if percorso not in CONSENTITI:
            self._rispondi(404, b'{"error":"not found"}')
            return

        try:
            with urllib.request.urlopen(UPSTREAM + self.path, timeout=TIMEOUT) as r:
                corpo = r.read()
                tipo = r.headers.get("Content-Type", "application/json")
                self._rispondi(r.status, corpo, tipo)
        except urllib.error.HTTPError as e:
            self._rispondi(e.code, e.read() or b'{"error":"upstream"}')
        except Exception as e:
            # DUE GUASTI DIVERSI, non uno.
            #
            # «BEN c'è ma non ha finito entro TIMEOUT» e «BEN non c'è» finivano
            # entrambi in `ben unavailable`, e la piattaforma li leggeva come un
            # errore del motore. Il primo invece è un'attesa: succede mentre il
            # contenitore si sveglia, e subito dopo le stesse richieste
            # rispondono in mezzo secondo (misurato in produzione il
            # 24/08/2026). Lì riprovare funziona davvero, ma nessuno lo diceva.
            #
            # `urlopen` la scadenza la segnala in due forme a seconda del punto
            # in cui scatta: `TimeoutError` diretta, oppure dentro `URLError`.
            scaduto = isinstance(e, TimeoutError) or isinstance(
                getattr(e, "reason", None), TimeoutError
            )
            if scaduto:
                _log(f"upstream non ha risposto entro {TIMEOUT}s")
                self._rispondi(504, b'{"error":"ben timeout"}')
            else:
                _log(f"upstream non raggiungibile: {e}")
                self._rispondi(502, b'{"error":"ben unavailable"}')

    # BEN espone anche delle POST (`/cuebid`, `/cuebidscores`): l'app non le
    # usa e non vengono inoltrate.
    def do_POST(self) -> None:  # noqa: N802
        self._rispondi(404, b'{"error":"not found"}')


# Quante mani BEN valuta quando SIMULA, invece di fidarsi della rete.
#
# È il parametro che decide quanto dura una dichiarazione difficile. BEN
# risponde in due modi: `NN` (~0,35 s) quando la rete è sicura, `Simulation`
# quando non lo è — e la simulazione punteggia `sample_hands_auction` mani a
# doppio morto PER OGNI dichiarazione candidata. Il costo è proporzionale a
# questo numero.
#
# SETTANTACINQUE, E NON È UN NUMERO A CASO. Ricavato misurando sul servizio
# vero, in due passaggi, con `scripts/misura-ben-licita.mjs`:
#
#   200 (il valore di BEN)  simulazioni 5,6 – 9,2 s   massimo 9,24 s
#   100                     simulazioni 3,5 – 6,4 s   massimo 6,41 s
#   75                      simulazioni 2,8 – 4,7 s   massimo 4,66 s
#
# La prima stima era 100, calcolata proporzionalmente da 200: ha portato il
# massimo a 6,4 e non bastava. Il secondo giro è partito da lì — 100 × 5/6,4 ≈
# 78 — ed è finito a 75 per avere margine. Tre misure consecutive dopo il
# cambio: nessuna simulazione sopra i cinque secondi.
#
# LA QUALITÀ NON È CROLLATA, per quanto si è potuto vedere: sulle tre aste di
# prova le dichiarazioni sono rimaste le stesse di prima (PASS, 3♠, 1♠) con un
# terzo dei campioni. Resta un compromesso — su altre mani un campione più
# piccolo può decidere diversamente — e va riguardato se qualcuno segnala che
# il compagno dichiara peggio proprio nelle mani difficili.
#
# `sample_boards_for_auction` scende in proporzione: è il tetto di mani
# GENERATE per trovarne 75 buone.
#
# Si regolano senza ricostruire l'immagine, cambiando le variabili su Railway.
MANI_SIMULAZIONE = os.environ.get("BEN_SAMPLE_HANDS_AUCTION", "75").strip()
MANI_GENERATE = os.environ.get("BEN_SAMPLE_BOARDS_AUCTION", "11000").strip()


def prepara_config(
    origine: str = "/app/src/config/default_api.conf",
    destinazione: str = "/tmp/bridgelab-ben.conf",
) -> str | None:
    """
    Il config di BEN con i nostri due valori, derivato dal suo.

    PERCHÉ DERIVATO E NON COPIATO. `default_api.conf` è lungo diciassettemila
    caratteri e appartiene a BEN: copiarlo qui vorrebbe dire congelarlo, e al
    primo aggiornamento di `BEN_COMMIT` ci ritroveremmo a far girare il motore
    nuovo con la configurazione vecchia — senza che niente lo segnali. Qui si
    legge il suo, si cambiano le due righe che ci interessano e si scrive
    altrove: quello che non tocchiamo resta di BEN e si aggiorna con lui.

    I percorsi dei modelli non ne risentono: `gameapi.py` li risolve rispetto
    alla propria cartella di esecuzione, non rispetto al file di configurazione
    (`Models.from_conf(configuration, config_path…)`).
    """
    if not os.path.exists(origine):
        _log(f"config di BEN non trovato in {origine}: parte con il suo.")
        return None
    try:
        with open(origine, encoding="utf8") as f:
            testo = f.read()
        cambi = {
            "sample_hands_auction": MANI_SIMULAZIONE,
            "sample_boards_for_auction": MANI_GENERATE,
        }
        for chiave, valore in cambi.items():
            # `^chiave = ...` e non una sostituzione qualsiasi: nel file la
            # stessa parola compare nei commenti, e `sample_boards_for_auction`
            # è un prefisso di `sample_boards_for_auction_step`, che NON va
            # toccato.
            testo, n = re.subn(
                rf"^{chiave} = .*$", f"{chiave} = {valore}", testo, flags=re.MULTILINE
            )
            if n != 1:
                _log(f"attenzione: '{chiave}' sostituita {n} volte, attese 1.")
        with open(destinazione, "w", encoding="utf8") as f:
            f.write(testo)
        _log(
            f"config derivato: sample_hands_auction={MANI_SIMULAZIONE}, "
            f"sample_boards_for_auction={MANI_GENERATE}"
        )
        return destinazione
    except Exception as e:
        _log(f"config non derivabile ({e}): BEN parte con il suo.")
        return None


def avvia_ben() -> subprocess.Popen:
    """BEN in ascolto solo su localhost: da fuori si passa da qui o da nulla."""
    cmd = [
        sys.executable,
        "gameapi.py",
        "--host", "127.0.0.1",
        "--port", str(PORTA_BEN),
    ]
    # `BEN_CONFIG` esplicito ha la precedenza: è la via d'uscita per provare
    # un'altra configurazione senza toccare questo file.
    conf = os.environ.get("BEN_CONFIG") or prepara_config()
    if conf:
        cmd += ["--config", conf]
    _log(f"avvio BEN: {' '.join(cmd)}")
    return subprocess.Popen(cmd, cwd="/app/src")


def main() -> None:
    if not TOKEN:
        _log(
            "BEN_API_TOKEN non impostata. Mi fermo: senza segreto questo "
            "servizio sarebbe un BEN pubblico e gratuito per chiunque."
        )
        sys.exit(1)
    if len(TOKEN) < 24:
        _log("BEN_API_TOKEN troppo corta (minimo 24 caratteri). Mi fermo.")
        sys.exit(1)

    ben = avvia_ben()

    def sorveglia() -> None:
        codice = ben.wait()
        _log(f"BEN è terminato (codice {codice}). Esco così Railway riavvia tutto.")
        # os._exit: l'interprete non deve aspettare i thread del server HTTP.
        os._exit(1)

    threading.Thread(target=sorveglia, daemon=True).start()

    _log(f"in ascolto su :{PORTA}, inoltro a {UPSTREAM}, percorsi {sorted(CONSENTITI)}")
    ThreadingHTTPServer(("0.0.0.0", PORTA), Guardia).serve_forever()


if __name__ == "__main__":
    main()
