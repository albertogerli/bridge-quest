# BridgeQuest - Aggiornamento per il Consiglio

Ciao a tutti,

vi giro il link al prototipo della piattaforma per imparare il bridge che stiamo costruendo per la FIGB:

👉 **https://bridge-quest.vercel.app**

Potete registrarvi oppure cliccare "Prova senza account" per dare un'occhiata.

---

## Cosa c'è dentro (già funzionante)

### Lezioni e corsi
- 4 corsi FIGB integrati: Fiori (13 lezioni), Quadri (12), Cuori Gioco della carta (10), Cuori Licita (14)
- In totale **49 lezioni** organizzate in 16 mondi, con percorso progressivo tipo Duolingo
- 6 tipi diversi di quiz per ogni lezione (scelta multipla, vero/falso, abbinamento, ordinamento...)
- 49 brevi video-lezioni con avatar AI del maestro (per ora è un mio clone vocale come segnaposto)
- Sistema di ripasso intelligente: le domande sbagliate tornano nei giorni successivi

### Gioco della carta
- Motore di gioco completo: giochi trick per trick contro un'AI
- 3 livelli di difficoltà dell'AI (Base, Intermedio, Esperto), selezionabili dalle impostazioni
- L'AI non gioca a caso: gestisce aperture in sequenza, seconda in bassa, terza in alta, tagli intelligenti, scarti ragionati, conta le carte giocate
- Dopo ogni mano c'è la **pagella**: voto da 1 a 5 stelle con analisi Double-Dummy (calcola il gioco perfetto e confronta con il tuo), commento su come hai giocato, riepilogo della mano
- Puoi anche **rivedere la mano** trick per trick dopo la pagella
- Tutorial interattivo per chi non ha mai giocato una mano nell'app

### Mini-giochi (9 in totale)
- **Sfida del Giorno** — una mano al giorno, uguale per tutti
- **Mano del Giorno** — mano casuale da giocare
- **Conta Veloce** — ti mostrano una mano, devi contare i punti onore in fretta
- **Dichiara!** — ti mostrano una mano, devi trovare l'apertura giusta
- **Pratica Licita** — 20 scenari di dichiarazione (Texas, Stayman, 2C Forte, cue bid, splinter) su 3 difficoltà
- **Quiz Lampo** — domande a tempo dalla teoria
- **Impasse** — scenari di impasse da risolvere
- **Memory Bridge** — memory con le carte
- **Trova l'Errore** — trova la giocata sbagliata

### Sfide e competizione
- **Torneo settimanale**: 5 mani identiche per tutti, classifica, bonus 150 XP
- **Sfida un Amico**: mandi un link, l'amico gioca la tua stessa mano, confrontate i risultati

### Gamification
- XP, livelli, streak giornaliera (come Duolingo)
- Obiettivi giornalieri e settimanali con bonus XP
- Badge e achievement da sbloccare
- Bauli premio ogni tot moduli completati
- Carte collezionabili e fiches
- 4 profili utente che cambiano tono e ritmo dell'app: Explorer (8-17 anni), Dinamico (18-35), Classico (36-55), Rilassato (55+)

### Parte tecnica
- Login e registrazione con sincronizzazione progressi su tutti i dispositivi
- Tema chiaro e scuro
- Notifiche push (promemoria streak, torneo del lunedì)
- Condivisione social dei risultati ("Ho fatto 4♠ con un overtrick!")
- Installabile come app su telefono (PWA)
- Dashboard admin per monitorare gli utenti registrati

---

## Cosa manca o va migliorato

1. **Video lezioni** — Ora ogni video dura circa 30 secondi ed è un segnaposto con il mio avatar AI. Vanno rifatti più lunghi con contenuto didattico vero. Va scelto il personaggio definitivo (maestro, maestra, stile grafico)

2. **Design grafico** — Il layout funziona ma va rifinito: colori definitivi, icone, illustrazioni, coerenza visiva. Adesso è funzionale ma non ancora all'altezza di una cosa ufficiale FIGB

3. **Nome e branding** — "BridgeQuest" è un nome di lavoro. Serve il nome definitivo, il logo, il tono di comunicazione FIGB

4. **Revisione contenuti** — Quiz e spiegazioni sono stati generati dai PDF dei corsi FIGB con l'aiuto dell'AI. Vanno rivisti e validati da un istruttore per assicurarsi che sia tutto corretto

5. **Classifica** — La struttura c'è ma serve popolarla con utenti veri. Ora mostra dati di esempio

6. **Forum** — La pagina esiste ma il contenuto è ancora segnaposto

7. **Modalità offline** — La struttura per funzionare senza connessione c'è, ma va completata

8. **Dominio definitivo** — Ora è su un indirizzo di test (Vercel). Va configurato il dominio ufficiale FIGB

---

Qualsiasi feedback è benvenuto, anche "non mi piace il colore del bottone" va benissimo.
