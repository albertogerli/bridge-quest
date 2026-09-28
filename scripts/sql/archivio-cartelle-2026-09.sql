-- Le mani salvate si raccolgono in cartelle, e alcune si segnano come preferite.
--
-- Dipendenze: saved_hands — presente dalla baseline.
-- Rollback: archivio-cartelle-2026-09-rollback.sql (toglie le due colonne:
-- le mani restano, perdono solo cartella e stella).
--
-- PERCHÉ. L'archivio era un elenco unico: dopo un corso intero sono decine di
-- posizioni in fila, e «le mani sulle transfer» si cercano a occhio. L'archivio
-- di BridgeChamp, indicato il 28/09/2026 come quello da copiare, è a cartelle
-- («corso fiori lez08», «mani sulle transfer») con i preferiti in cima.
--
-- UNA COLONNA E NON UNA TABELLA. Una cartella è il nome che hanno in comune
-- alcune mani: esiste finché ne contiene almeno una. Una tabella a parte
-- servirebbe per le cartelle vuote e per rinominarle in un colpo solo; la
-- seconda si fa con un UPDATE, la prima non serve a nessuno.
--
-- Le regole d'accesso non cambiano: la policy «Own saved hands» copre già
-- ogni colonna della riga per il suo proprietario.

alter table public.saved_hands add column if not exists cartella text;
alter table public.saved_hands add column if not exists preferita boolean not null default false;

-- Il nome della cartella non è libero all'infinito: ottanta caratteri bastano
-- a «Corso Fiori — lezione 8 — mani con la transfer», e un testo lunghissimo
-- romperebbe l'elenco.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'saved_hands_cartella_lunghezza'
  ) then
    alter table public.saved_hands
      add constraint saved_hands_cartella_lunghezza
      check (cartella is null or char_length(cartella) between 1 and 80);
  end if;
end $$;

create index if not exists saved_hands_owner_cartella_idx
  on public.saved_hands (owner_id, cartella);
