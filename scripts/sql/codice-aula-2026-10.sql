-- ============================================================================
-- Il codice numerico dell'aula
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `alter table public.inviti_aula drop column if exists codice;`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
-- Dipende da: `ingresso-ospite-2026-08.sql` (crea `inviti_aula`).
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- Feedback Trevissoi 5 (19/10/2026): in aula ci sono allievi che non sanno
-- inquadrare un QR, o non hanno un'app per farlo, e il link di quaranta
-- caratteri non si detta. Sei cifre si leggono dalla lavagna e si scrivono su
-- bridgelab.it/aula.
--
-- Il codice non sostituisce il gettone: lo trova. `/api/aula/codice` cerca
-- l'invito attivo con quel codice (con il service role: la tabella resta
-- leggibile solo all'insegnante) e rimanda al solito `/aula/<gettone>`, dove
-- valgono le stesse guardie di sempre — scadenza, revoca, tetto di ospiti.
--
-- NIENTE INDICE UNICO. Un vincolo di unicità sui codici «attivi» non si può
-- scrivere (la scadenza dipende da `now()`), e uno su tutti i codici non
-- revocati esaurirebbe lo spazio di un milione in qualche anno. L'unicità la
-- controlla chi crea l'invito, fra quelli ancora validi; la rotta, se mai ne
-- trovasse due, prende il più recente.
-- ============================================================================

begin;

alter table public.inviti_aula
  add column if not exists codice text;

alter table public.inviti_aula
  drop constraint if exists inviti_aula_codice_sei_cifre;
alter table public.inviti_aula
  add constraint inviti_aula_codice_sei_cifre check (codice is null or codice ~ '^[0-9]{6}$');

create index if not exists inviti_aula_codice_idx
  on public.inviti_aula (codice)
  where revocato = false and codice is not null;

insert into public.script_applicati (nome) values ('codice-aula-2026-10.sql')
on conflict (nome) do nothing;

commit;
