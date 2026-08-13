# BEN (Bridge Engine Neural) per Railway, con guardia davanti.
#
# BEN non sta in questo repository: viene clonato da monte a un commit fissato,
# così resta aggiornabile senza fork da mantenere e senza copiare 200 MB di
# modelli qui dentro.
#
# La base è ubuntu:jammy come nel Dockerfile ufficiale di BEN, perché serve
# `libdds-dev`: il solver double dummy è una libreria C che `ddsolver/dds.py`
# carica come `libdds.so` dal sistema.

FROM docker.io/ubuntu:jammy

# Commit di lorserker/ben. Fissato apposta: un `--depth 1` sul ramo renderebbe
# la ricostruzione non riproducibile, e un aggiornamento di BEN arriverebbe
# insieme a un deploy che pensavi identico al precedente.
ARG BEN_COMMIT=a5ef8866e0884a3c064581a276b79693185579f7

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    # I modelli sono indicati nel conf come `models/TF2models/...` e vengono
    # risolti rispetto a BEN_HOME (in mancanza, rispetto a `..`).
    BEN_HOME=/app \
    TF_CPP_MIN_LOG_LEVEL=2

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3.10 python3-pip python-is-python3 \
      libdds-dev libboost-thread-dev \
      git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Checkout parziale: il repository di BEN pesa oltre 2 GB fra storia, partite
# di esempio e script di addestramento. Qui servono solo il sorgente, i modelli,
# l'elenco delle dipendenze e `bin/`.
#
# `bin/` non è opzionale, anche se sembra: all'avvio BEN stampa «Disabling
# PIMC/BBA/SuitC as platform is not win32» e subito dopo prova comunque a
# caricare `bin/libsuitc.so`, e senza muore. Scoperto accendendo l'immagine —
# leggendo il Dockerfile ufficiale non si vedeva, perché lì il repository viene
# copiato intero.
RUN git init -q . \
 && git remote add origin https://github.com/lorserker/ben.git \
 && git config core.sparseCheckout true \
 && git sparse-checkout set src models/TF2models bin requirements.txt \
 && git fetch --depth 1 -q origin "${BEN_COMMIT}" \
 && git checkout -q FETCH_HEAD \
 && rm -rf .git

# `pythonnet` serve a EPBot, che gira su mono e nel container non c'è (lo salta
# anche il Dockerfile ufficiale). `jupyter` e `matplotlib` sono per i taccuini
# di analisi. Toglierli evita una compilazione che può fallire e alcune
# centinaia di MB che non verrebbero mai importate.
#
# Il `pip` di jammy è il 22.0.2 e non riconosce i pacchetti già compilati per
# questa piattaforma: prova a costruire `gevent` e `psutil` dai sorgenti e si
# ferma, perché nell'immagine non c'è un compilatore. Aggiornarlo prima è
# sufficiente — più sensato che installare mezzo `build-essential` per
# ricompilare cose che esistono già pronte.
RUN pip3 install --no-cache-dir --upgrade "pip>=24" setuptools wheel \
 && grep -vE '^(pythonnet|jupyter|matplotlib)\s*$' requirements.txt > /tmp/req.txt \
 && pip3 install --no-cache-dir -r /tmp/req.txt \
 && rm -rf /root/.cache/pip

# La guardia: autenticazione, elenco dei percorsi ammessi, riavvio se BEN cade.
COPY guard.py /app/guard.py

# Railway assegna la porta in PORT. BEN resta su 127.0.0.1:8085, raggiungibile
# solo dalla guardia.
EXPOSE 8080
CMD ["python3", "/app/guard.py"]
