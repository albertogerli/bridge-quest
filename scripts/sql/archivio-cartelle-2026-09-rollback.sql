-- Rollback di archivio-cartelle-2026-09.sql.
-- Le mani restano tutte; si perdono solo la cartella e la stella.
-- Prima di eseguirlo: togliere dal codice l'uso di `cartella` e `preferita`
-- (git revert), altrimenti l'archivio chiede colonne che non esistono più.

drop index if exists public.saved_hands_owner_cartella_idx;
alter table public.saved_hands drop constraint if exists saved_hands_cartella_lunghezza;
alter table public.saved_hands drop column if exists preferita;
alter table public.saved_hands drop column if exists cartella;
