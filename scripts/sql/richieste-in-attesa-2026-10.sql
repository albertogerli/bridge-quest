-- ============================================================================
-- L'allievo vede le proprie richieste di iscrizione in attesa
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `richieste-in-attesa-2026-10-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- Con l'approvazione manuale, chi inserisce il codice riceve «Richiesta
-- inviata a “Test 1”»: ma basta ricaricare `/classi` e la pagina dice «Non sei
-- ancora iscritto a nessuna classe», come se non fosse successo niente. La
-- riga c'è (`class_members.status = 'pending'`), ma il nome della classe non
-- si può leggere: la policy di `classes` lo concede solo agli iscritti ATTIVI
-- (`is_member_of_class`). Feedback del 07/10/2026: l'allievo ha riprovato il
-- codice pensando che non fosse partito niente.
--
-- Una funzione stretta invece di allargare la policy: restituisce soltanto le
-- richieste in attesa di chi chiama, con il nome della classe e quello
-- dell'insegnante — niente codice invito, niente altri iscritti.
-- ============================================================================

begin;

create or replace function public.mie_richieste_in_attesa()
returns table (class_id uuid, nome text, insegnante text, dal timestamptz)
language sql
stable
security definer
set search_path to ''
as $$
  select c.id, c.name, p.display_name, m.joined_at
  from public.class_members m
  join public.classes c on c.id = m.class_id
  left join public.profiles p on p.id = c.instructor_id
  where m.student_id = (select auth.uid())
    and m.status = 'pending'
  order by m.joined_at desc;
$$;

revoke all on function public.mie_richieste_in_attesa() from public, anon;
grant execute on function public.mie_richieste_in_attesa() to authenticated;

insert into public.script_applicati (nome) values ('richieste-in-attesa-2026-10.sql')
on conflict (nome) do nothing;

commit;
