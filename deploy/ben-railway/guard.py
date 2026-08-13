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

# Timeout più corto di quello del proxy di BridgeLab (15 s): meglio un errore
# netto che una richiesta appesa che occupa un lavoratore.
TIMEOUT = float(os.environ.get("BEN_TIMEOUT", "12"))

# I soli percorsi usati da src/app/api/ben/*. `/` è la sonda di salute.
CONSENTITI = {"/", "/play", "/lead", "/autoplay"}

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
            _log(f"upstream non raggiungibile: {e}")
            self._rispondi(502, b'{"error":"ben unavailable"}')

    # BEN espone anche delle POST (`/cuebid`, `/cuebidscores`): l'app non le
    # usa e non vengono inoltrate.
    def do_POST(self) -> None:  # noqa: N802
        self._rispondi(404, b'{"error":"not found"}')


def avvia_ben() -> subprocess.Popen:
    """BEN in ascolto solo su localhost: da fuori si passa da qui o da nulla."""
    cmd = [
        sys.executable,
        "gameapi.py",
        "--host", "127.0.0.1",
        "--port", str(PORTA_BEN),
    ]
    conf = os.environ.get("BEN_CONFIG")
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
