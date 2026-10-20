# Feedback Trevissoi 6 e considerazioni finali (20/10/2026)

Risposta di Trevissoi alla mail «BridgeLab — risposta al Feedback 5», con Frola in
copia. Allegati: i 12 test «Barion» (Moduli Google, uno per lezione del Corso
Fiori) e i due moduli di Amici del Bridge Bari, «Manifestazione di interesse
alla Lezione Zero» e «Iscrizione al corso».

## La linea che dà

1. **Contenuti del Modulo 1 (Gioco della carta) subito**, anche nelle
   videolezioni, per la presentazione di Salso. Il resto entro fine anno.
2. **Aula e gioco virtuale in Fase 2.** Molti insegnanti sono poco pratici di
   informatica; nella Fase 1 solo le funzioni base del Bridge 5.0. Lo ripete due
   volte. → L'aula resta com'è: nessuno sviluppo nuovo, solo correzioni di
   difetti. L'ingresso degli esterni approvato uno per uno («OK») slitta con lei.
3. **Grafica e uso degli spazi** sono sostanza: se l'insegnante non trova lo
   strumento funzionale e piacevole non lo usa.
4. **Fase 1 solo sul primo corso**: l'allievo non deve accedere ai corsi
   successivi. Già così: i contenuti didattici si aprono con le lezioni
   assegnate (`permessi-allievo.ts`).
5. Organizzative (non software): 5-6 insegnanti sponsor e formatori per
   macroarea da scegliere con Luca; riunione con l'avv. Carnicelli; presentazione
   di Salso «a due mani».

## Piano

| # | Cosa | Come | Stato |
|---|------|------|-------|
| T1 | **Test 1–6 come esercizi delle lezioni Fiori 1–6** | I test Barion n corrispondono alle lezioni Fiori n (stessi titoli). Il formato quiz delle lezioni c'è già (`ContentBlock` `quiz`: opzioni, risposta, spiegazione). I moduli Google non hanno le soluzioni: trascrizione + risposte proposte → **validazione di Trevissoi** → caricamento nel DB come modulo «📝 Test della lezione». Prima della validazione non va online niente. Trascritti il 20/10: 144 domande (16, 27, 40, 26, 23, 12), quasi tutte con un diagramma; i diagrammi spesso non hanno né seme né posizioni, e su una trentina di domande la risposta non si ricava con certezza. I moduli sono in modalità quiz («1 punto»), quindi le soluzioni esistono già in Google Moduli: **chiedere a Trevissoi l'accesso da collaboratore** invece di indovinarle. | in attesa delle soluzioni |
| T2 | **Fine del corso** | «Il resto del portale» si apre solo con il cursore dell'insegnante oppure quando l'insegnante archivia il corso («Archiviata — corso finito»), non alla data di fine. Difetto trovato: una classe **chiusa** (niente nuovi iscritti, chi c'è continua) usciva dai corsi attivi, e l'allievo perdeva la home del corso. Ora conta come attiva; solo l'archiviazione chiude il percorso e toglie i limiti. | fatto (0867fc4) |
| T3 | **Percorso dei menù ovunque** | `Briciole` dove mancava: Le mie classi, tavolo della classe, lavagna. Le altre pagine del corso l'avevano già, o hanno il loro «Torna a…». Proiezione e aula ospiti restano senza (schermo pieno, Fase 2). | fatto (0867fc4) |
| T4 | **Condividere senza WhatsApp** | Dove c'è «Manda su WhatsApp» (codice d'aula, compiti, invito): anche «Copia il messaggio» ed «Email», in un menu unico (`manda-messaggio.tsx`). | fatto (0867fc4) |
| T5 | **Programma del corso** | Calendario delle lezioni scritto e aggiornato dall'insegnante, visibile agli allievi nel benvenuto. Trevissoi cita un esempio «in allegato» che non è arrivato: chiederlo. Obbligatorietà: no, si aggiunge quando si sa. | attesa esempio |
| T6 | **Dati degli allievi scaricabili** | Presenti e passati, per corso o tutti. Dipende dai campi dei moduli (sotto) e dalla riunione con Carnicelli: codice fiscale, data di nascita, minori 14-20 anni. | dopo Carnicelli |
| T7 | **Libreria fra insegnanti** | La tabella `libreria` ha già `stato` e `nota_curatore` (moderazione). Decidere chi pubblica e chi modera. Candidabile alla Fase 1. | da decidere |
| T8 | **«Divisioni dei semi»** | «Devo capire meglio»: nasconderlo nella Fase 1 o spiegarlo nella formazione. | da decidere |

Già a posto, da dire nella risposta:
- il promemoria di scadenza va solo a chi non ha finito (`bersagli_email_compiti`: `fatte < n_mani`);
- WhatsApp automatico: archiviato su sua indicazione;
- «Registrati gratis»: lo lascia decidere a noi.

## I campi dei due moduli (per T6 e Lezione Zero)

**Manifestazione di interesse alla Lezione Zero**: email, consenso privacy, nome,
cognome, cellulare, fascia d'età (14-20 … 61+), professione, come ha saputo
dell'iniziativa, perché è interessato, conosce giocatori (nomi), conosce altri
aderenti (nomi), comune di residenza.

**Iscrizione al corso**, in più: presa d'atto di giorno e ora, luogo e data di
nascita, residenza, codice fiscale, agevolazione (under 35/studente, coniuge,
nessuna), autorizzazione al tesseramento FIGB, ha partecipato alla Lezione
Zero, gradimento della Lezione Zero (5 voti 1-5), disponibilità sui turni,
compagni con cui stare al tavolo.

Codice fiscale, data di nascita e minori: niente si costruisce prima della
riunione con Carnicelli.
