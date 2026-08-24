"""
Verifica della guardia davanti a BEN, senza BEN.

Al posto del motore c'è un finto server che risponde sempre 200: qui non
interessa cosa gioca BEN, ma CHI riesce a parlargli. Le due proprietà da non
perdere sono che senza il segreto non si passa, e che il segreto da solo non
apre i percorsi che l'app non usa — `/claim`, `/explain`, `/bids` costano molto
più di una carta da giocare e non c'è motivo di offrirli a Internet.

  python3 test_guard.py     (dalla cartella deploy/ben-railway)

Non gira con `npm test`: è Python, e la suite del progetto è Vitest.
"""

import os, sys, threading, time, urllib.request, urllib.error
os.environ["BEN_API_TOKEN"] = "T" * 32
os.environ["BEN_INTERNAL_PORT"] = "18085"
sys.path.insert(0, ".")
import guard  # noqa: E402
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer  # noqa: E402

class FintoBen(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        # `/lento` non risponde entro il tempo della guardia: serve a
        # distinguere «BEN c'è ma tarda» da «BEN non c'è», che prima erano lo
        # stesso 502 e mandavano a cercare il guasto nel posto sbagliato.
        if self.path.startswith("/bid?lento"):
            time.sleep(3)
        corpo = b'{"card":"SA"}'
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers(); self.wfile.write(corpo)

threading.Thread(target=lambda: ThreadingHTTPServer(("127.0.0.1", 18085), FintoBen).serve_forever(), daemon=True).start()
srv = ThreadingHTTPServer(("127.0.0.1", 18080), guard.Guardia)
threading.Thread(target=srv.serve_forever, daemon=True).start()

def chiama(percorso, token=None):
    req = urllib.request.Request(f"http://127.0.0.1:18080{percorso}")
    if token: req.add_header("X-BEN-Token", token)
    try:
        with urllib.request.urlopen(req, timeout=5) as r: return r.status
    except urllib.error.HTTPError as e: return e.code
    except Exception as e: return f"errore {e}"

buono = "T" * 32
casi = [
    ("/play?hand=x senza segreto", chiama("/play?hand=x"), 404),
    ("/play?hand=x segreto sbagliato", chiama("/play?hand=x", "X"*32), 404),
    ("/play?hand=x segreto giusto", chiama("/play?hand=x", buono), 200),
    ("/lead segreto giusto", chiama("/lead", buono), 200),
    ("/autoplay segreto giusto", chiama("/autoplay", buono), 200),
    ("/bid segreto giusto", chiama("/bid", buono), 200),
    ("/ (sonda dell'app) segreto giusto", chiama("/", buono), 200),
    ("/explain NON ammesso, pur col segreto", chiama("/explain", buono), 404),
    ("/claim NON ammesso, pur col segreto", chiama("/claim", buono), 404),
    ("/bids NON ammesso, pur col segreto", chiama("/bids", buono), 404),
    ("/healthz senza segreto", chiama("/healthz"), 200),
]

# ── BEN lento contro BEN assente ───────────────────────────────────────────
# La piattaforma decide dal messaggio se offrire «riprova»: con l'attesa serve
# (succede al risveglio del contenitore, e subito dopo risponde in mezzo
# secondo), con il server spento no. Confonderli toglieva all'utente l'unica
# mossa utile.
guard.TIMEOUT = 1.0
casi.append(("BEN che tarda -> 504, non 502", chiama("/bid?lento=1", buono), 504))

upstream_vero = guard.UPSTREAM
guard.UPSTREAM = "http://127.0.0.1:18099"  # nessuno in ascolto
casi.append(("BEN assente -> 502", chiama("/bid", buono), 502))
guard.UPSTREAM = upstream_vero
falliti = 0
for nome, avuto, atteso in casi:
    esito = "OK  " if avuto == atteso else "FAIL"
    if avuto != atteso: falliti += 1
    print(f"  {esito} {nome}: {avuto} (atteso {atteso})")
print("tutti passati" if not falliti else f"{falliti} FALLITI")
sys.exit(1 if falliti else 0)
