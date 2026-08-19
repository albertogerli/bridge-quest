# Riorganizzazione contenuti BridgeLab — Impara / Gioca / Scuola

> Avvio 2026-05-29. Non distruttivo: nessuna route eliminata. Decisioni prese:
> nav = **Hub Impara + Gioca + Scuola**; XP pratica = **ogni partita con tetto giornaliero**;
> Percorso = **guidato ma non bloccante**.

## Problema
Tre porte d'ingresso beginner sovrapposte (Prima Mano onboarding, Mano Guidata="Prima Presa",
MiniBridge) + Lezioni che ripartono dalle basi; `/gioca` è un cassetto di ~18 modalità mischiate;
Dispense è voce di nav a sé; XP del MiniBridge non agganciati (awardGameXp è one-time per gameId).

## Architettura target
- **🎓 Impara** (hub): Percorso beginner (Prima Mano → MiniBridge → Corso Fiori → Mano Guidata →
  Quadri/Cuori) + Strumenti di studio (Dispense, Glossario, Ripasso, Obiettivi).
- **🎮 Gioca** (hub): 3 gruppi — Pratica / Sfide / Gioco libero.
- **👨‍🏫 Scuola**: portale istruttori + Le mie classi (già fatto).

### Gruppi /gioca
- Pratica: MiniBridge, Mano Guidata, Dichiara!, Conta Veloce, Quiz Lampo, Trova l'Errore, Impasse, Memory
- Sfide: Sfida del Giorno, Torneo Settimanale, Mano del Giorno, Sfida Amico, Sfida via Link, Sfida IMP
- Gioco libero: Tutte le Smazzate, Pratica libera, Analisi AI

## XP unificato
- **Milestone** (una tantum): moduli/lezioni, badge, prima volta di una mano specifica → `awardGameXp`.
- **Pratica ripetibile** (ogni volta, cap giornaliero per modalità) → `awardPracticeXp(gameKey, xp, cap)`.
- Mostrare sempre l'XP guadagnato nel risultato.

## Fasi
1. **XP fix** — ✅ FATTA 2026-05-29. `awardPracticeXp` in `src/lib/xp-utils.ts`; MiniBridge usa
   `awardPracticeXp("minibridge", xp, 250)` e mostra "+X XP" nel ResultCard.
2. **Hub Gioca** — ✅ FATTA 2026-05-29. `/gioca` con 4 header di sezione: Inizia da qui · Sfide ·
   Pratica · Gioco libero (solo intestazioni, nessuna route spostata).
3. **Hub Impara + Percorso** — ✅ FATTA 2026-05-29. Nuova `/impara`: Percorso (Prima Mano → MiniBridge
   → Corso Fiori con progresso moduli → Mano Guidata), "prossimo passo" evidenziato, non bloccante;
   + Strumenti di studio (Lezioni, Dispense, Glossario, Ripasso, Obiettivi). Flag `bq_minibridge_played`.
4. **Nav semplificata** — ✅ PARZIALE 2026-05-29. Top nav e bottom nav: "Lezioni"+"Dispense" sostituite
   da "Impara" (route /lezioni e /dispense restano, raggiungibili da Impara). TODO residuo: voce
   "Scuola" in nav (oggi le classi sono solo in sidebar) + eventuale cleanup banner Prima Mano in home.

## Mappatura (niente si perde)
Lezioni/Dispense → Impara; Prima Mano → Impara/Percorso step 1; tutte le /gioca/* → Gioca (3 gruppi);
MiniBridge+Mano Guidata → doppia presenza (Percorso + Gioca·Pratica); Glossario/Ripasso/Obiettivi → Impara.
Nessuna route cancellata: si aggiunge un layer di organizzazione sopra l'esistente.
