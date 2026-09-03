-- ============================================================================
-- ROLLBACK di `presenze-e-date-2026-09.sql`
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
--
-- ----------------------------------------------------------------------------
-- LEGGERE PRIMA DI ESEGUIRE
--
-- Questo script CANCELLA le presenze già registrate e le date di uscita già
-- calcolate. Non è un `git revert`: quei dati non stanno in nessun file, e
-- rifare l'appello di una lezione passata non è possibile — nessuno si ricorda
-- chi c'era il 14 ottobre.
--
-- La parte 0 mette da parte quello che si sta per buttare. Non è cerimoniale:
-- è l'unica cosa che rende questa operazione reversibile. Se si è sicuri di
-- non volere i dati, si può saltare — ma allora lo si sta decidendo, non
-- subendo.
--
-- Motivi legittimi per eseguirlo:
--   · lo schema è sbagliato e va rifatto diversamente, prima che la stagione
--     cominci e le tabelle si riempiano;
--   · si è deciso di non registrare le presenze.
--
-- Motivo NON legittimo: «l'applicazione dà errore». In quel caso il problema è
-- nell'applicazione, e cancellare il registro non lo risolve.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0 · La rete di sicurezza — eseguire questa PRIMA del resto
--
-- Copia le presenze e le uscite in due tabelle che il rollback non tocca. Se
-- lo schema verrà rifatto, i dati si travasano da lì invece di essere persi.
-- Le copie restano finché non si cancellano a mano: è voluto.
-- ----------------------------------------------------------------------------
create table if not exists public.presenze_salvate_2026_09 as
  select * from public.presenze;

create table if not exists public.uscite_salvate_2026_09 as
  select class_id, student_id, status, uscito_il
    from public.class_members
   where uscito_il is not null;

-- Quante righe si stanno per perdere. Guardare il risultato PRIMA di andare
-- avanti: se è un numero grande, vale la pena fermarsi a pensarci.
select
  (select count(*) from public.presenze_salvate_2026_09) as presenze_messe_da_parte,
  (select count(*) from public.uscite_salvate_2026_09)   as uscite_messe_da_parte;

-- ----------------------------------------------------------------------------
-- 1 · Da qui in poi si disfa. Eseguire solo dopo aver letto i numeri sopra.
-- ----------------------------------------------------------------------------
begin;

-- Le date del corso: si tolgono i vincoli prima delle colonne, altrimenti il
-- vincolo resta orfano e la riesecuzione dello script principale fallisce.
alter table public.classes drop constraint if exists classes_periodo_coerente;
alter table public.classes drop column if exists fine_corso;
alter table public.classes drop column if exists inizio_corso;

-- L'uscita dalla classe: prima il trigger, poi la funzione, poi la colonna.
-- Invertire l'ordine lascia una funzione che nessuno chiama o un trigger che
-- punta al vuoto.
drop trigger if exists class_members_segna_uscita on public.class_members;
drop function if exists public.segna_uscita_da_classe();
alter table public.class_members drop column if exists uscito_il;

-- Le presenze. Le policy e gli indici cadono con la tabella: elencarli
-- servirebbe solo a poterli dimenticare.
drop table if exists public.presenze;

commit;

-- ============================================================================
-- VERIFICA (dopo l'esecuzione)
--
--   select to_regclass('public.presenze');                   -- deve dare null
--   select to_regclass('public.presenze_salvate_2026_09');   -- deve ESISTERE
--   select column_name from information_schema.columns
--    where table_schema='public' and table_name='classes'
--      and column_name in ('inizio_corso','fine_corso');     -- nessuna riga
--
-- Poi: node scripts/dump-schema.mjs   e committare 000-schema-baseline.sql,
-- altrimenti il file da cui il database si ricostruisce da zero resta con
-- dentro tabelle che non esistono più.
--
-- Quando si è certi di non aver più bisogno delle copie:
--   drop table public.presenze_salvate_2026_09;
--   drop table public.uscite_salvate_2026_09;
-- ============================================================================
