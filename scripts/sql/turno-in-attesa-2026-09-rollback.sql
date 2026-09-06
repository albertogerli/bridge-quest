-- ROLLBACK di `turno-in-attesa-2026-09.sql`
--
-- Perde il conteggio delle mani giocate per tavolo e chi era in coda. Sono dati
-- di una serata in corso: se l'aula è aperta mentre si esegue, chi aspettava
-- sparisce dalla coda senza che nessuno glielo dica. Farlo ad aula chiusa.

create table if not exists public.attese_salvate_2026_09 as
  select id, class_id, in_attesa, partecipazioni from public.live_tables
   where in_attesa <> '[]'::jsonb or partecipazioni <> '{}'::jsonb;

select count(*) as tavoli_con_coda_o_conteggio from public.attese_salvate_2026_09;

begin;
drop function if exists public.aula_ruota(uuid);
drop function if exists public.aula_aspetta(uuid);
drop function if exists public.aula_prossimo_a_uscire(uuid);
drop function if exists public.aula_mani_al_turno(uuid, uuid);
alter table public.live_tables
  drop column if exists in_attesa,
  drop column if exists partecipazioni;
commit;

-- Prima di eseguire: togliere dal codice la coda, altrimenti l'allievo che
-- tocca «mettiti in attesa» riceve un errore. Nell'ordine: `git revert`, poi
-- questo script. Poi `node scripts/dump-schema.mjs` e il baseline.
