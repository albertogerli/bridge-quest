-- ============================================================================
-- ROLLBACK di `rubinetto-e-livello-2026-09.sql`
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
--
-- ----------------------------------------------------------------------------
-- LEGGERE PRIMA DI ESEGUIRE
--
-- Questo rollback è MENO grave di quello delle presenze, ma non è innocuo.
--
-- Le presenze erano dati che nessuno può ricostruire. Qui invece si perdono
-- delle DECISIONI: quali insegnanti hanno chiuso o aperto il rubinetto, e con
-- che livello hanno etichettato le classi. Sono ricostruibili — basta
-- richiederle — ma richiederle vuol dire scrivere a venti persone e ammettere
-- di aver perso quello che avevano impostato.
--
-- E c'è un effetto immediato da mettere in conto: **cancellando la colonna,
-- ogni classe torna ad avere accesso libero**, perché senza il rubinetto non
-- c'è niente che restringa. Un insegnante che aveva chiuso il percorso si
-- ritrova gli allievi liberi senza essere stato avvisato. È il contrario
-- esatto della promessa che gli abbiamo fatto — «il percorso lo gestisci tu al
-- 100%» — quindi se questo rollback viene eseguito con delle classi già
-- configurate, gli insegnanti vanno avvisati.
--
-- Se si sta tornando indietro perché il modello è sbagliato e va rifatto, la
-- parte 0 conserva le impostazioni e si travasano nel modello nuovo.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0 · La rete di sicurezza — eseguire PRIMA del resto
-- ----------------------------------------------------------------------------
create table if not exists public.rubinetto_salvato_2026_09 as
  select id, name, livello, accesso_libero, permessi
    from public.classes;

-- Guardare questi numeri prima di proseguire. Se «configurate_a_mano» è
-- maggiore di zero, qualcuno ha già preso delle decisioni che si stanno per
-- buttare: vale la pena avvisarlo prima, non dopo.
select
  count(*)                                                   as classi_salvate,
  count(*) filter (where accesso_libero <> 'tutto-aperto')   as configurate_a_mano,
  count(*) filter (where livello is not null)                as con_livello
from public.rubinetto_salvato_2026_09;

-- ----------------------------------------------------------------------------
-- 1 · Da qui si disfa. Solo dopo aver letto i numeri sopra.
-- ----------------------------------------------------------------------------
begin;

-- I vincoli prima delle colonne: altrimenti restano orfani e la riesecuzione
-- dello script principale fallisce su un `add constraint` che esiste già.
alter table public.classes drop constraint if exists classes_accesso_libero_valido;
alter table public.classes drop constraint if exists classes_livello_breve;

alter table public.classes drop column if exists permessi;
alter table public.classes drop column if exists accesso_libero;
alter table public.classes drop column if exists livello;

commit;

-- ============================================================================
-- VERIFICA (dopo l'esecuzione)
--
--   select column_name from information_schema.columns
--    where table_schema='public' and table_name='classes'
--      and column_name in ('livello','accesso_libero','permessi');   -- vuoto
--   select to_regclass('public.rubinetto_salvato_2026_09');          -- ESISTE
--
-- Poi: node scripts/dump-schema.mjs e committare 000-schema-baseline.sql
--
-- ATTENZIONE: il codice dell'applicazione che legge `accesso_libero` va tolto
-- o reso tollerante PRIMA di eseguire questo rollback, altrimenti ogni lettura
-- della classe fallisce con «column does not exist» e l'area insegnanti smette
-- di funzionare. Nell'ordine giusto: prima il `git revert` del codice, poi
-- questo script.
--
-- Quando le copie non servono più:
--   drop table public.rubinetto_salvato_2026_09;
-- ============================================================================
