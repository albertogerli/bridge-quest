-- ============================================================================
-- «Corso Fiori» diventa «Corso di Primo Livello»
--
-- ESEGUIRE A MANO su Supabase → SQL Editor. Solo contenuti: lo schema non
-- cambia e il baseline non va rigenerato.
--
-- PERCHÉ. Il nome del corso, ovunque, è «Corso di Primo Livello» (Trevissoi
-- per la Commissione Insegnamento, 29/10/2026). Il nome che compare nel
-- percorso e nelle lezioni viene da `courses.name`, non dal codice.
--
-- I nomi delle classi («Corso Fiori 2026» e simili) li hanno scelti gli
-- insegnanti e restano come sono.
-- ============================================================================

begin;

update public.courses
   set name = 'Corso di Primo Livello',
       name_en = 'First Level Course',
       updated_at = now()
 where id = 'fiori'
   and name is distinct from 'Corso di Primo Livello';

insert into public.script_applicati (nome) values ('nome-corso-primo-livello-2026-10.sql')
on conflict (nome) do nothing;

commit;

-- Rollback:
-- update public.courses set name = 'Corso Fiori', name_en = 'Clubs Course', updated_at = now() where id = 'fiori';
-- delete from public.script_applicati where nome = 'nome-corso-primo-livello-2026-10.sql';
