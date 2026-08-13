-- ============================================================================
-- BridgeLab: bacheca del circolo (club_posts)
-- ============================================================================
--
-- COSA FA
-- Gli avvisi di un circolo ai propri soci: un torneo, un cambio d'orario, una
-- comunicazione. Oggi finiscono in messaggi sparsi e email; qui stanno dove
-- i soci già guardano.
--
-- CHI PUÒ PARLARE A NOME DI UN CIRCOLO
-- È la domanda che tiene in piedi tutto il resto, e non esisteva un ruolo
-- «amministratore di circolo» da cui dedurla. La regola scelta usa quello che
-- c'è già ed è la più stretta possibile:
--
--   scrive  chi ha `role in (instructor, admin)` E il proprio `asd_code`
--           uguale a quello della bacheca. Un istruttore non può quindi
--           pubblicare per un circolo che non è il suo;
--   legge   chi ha quel circolo nel proprio profilo. Gli avvisi sono per i
--           soci, non per il pubblico: chi non è del circolo non li vede.
--
-- Gli amministratori della piattaforma scrivono ovunque: servono per aiutare
-- un circolo che sbaglia, e per cancellare un avviso inopportuno.
--
-- PERCHÉ UNA FUNZIONE PER IL PROPRIO CIRCOLO
-- La policy deve leggere `profiles.asd_code` di chi chiama, ma su `profiles`
-- ci sono privilegi di colonna e altre policy: una sottoquery dentro la policy
-- girerebbe con i diritti del chiamante e potrebbe non vedere nulla, negando
-- l'accesso a tutti senza un errore. `my_asd_code()` è SECURITY DEFINER e
-- legge la SOLA riga di chi chiama: non espone il circolo di nessun altro.
--
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

create or replace function public.my_asd_code()
returns text
language sql
stable
security definer
set search_path to 'public'
as $function$
  SELECT asd_code FROM public.profiles WHERE id = auth.uid();
$function$;

comment on function public.my_asd_code() is
  'Il codice circolo di chi chiama. Legge solo la propria riga.';

revoke execute on function public.my_asd_code() from public;
revoke execute on function public.my_asd_code() from anon;
grant execute on function public.my_asd_code() to authenticated;

create or replace function public.can_post_for_asd(p_asd_code text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('instructor', 'admin')
      AND (role = 'admin' OR asd_code = p_asd_code)
  );
$function$;

revoke execute on function public.can_post_for_asd(text) from public;
revoke execute on function public.can_post_for_asd(text) from anon;
grant execute on function public.can_post_for_asd(text) to authenticated;

create table if not exists public.club_posts (
  id uuid primary key default gen_random_uuid(),
  asd_code text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  titolo text not null check (char_length(btrim(titolo)) between 1 and 120),
  corpo text not null check (char_length(btrim(corpo)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists club_posts_asd_idx
  on public.club_posts (asd_code, created_at desc);

alter table public.club_posts enable row level security;

drop policy if exists "Members read own club posts" on public.club_posts;
create policy "Members read own club posts" on public.club_posts
  for select to authenticated
  using (asd_code = public.my_asd_code() or public.can_post_for_asd(asd_code));

drop policy if exists "Instructors write for own club" on public.club_posts;
create policy "Instructors write for own club" on public.club_posts
  for insert to authenticated
  with check (author_id = auth.uid() and public.can_post_for_asd(asd_code));

-- Cancellazione: l'autore, oppure un amministratore della piattaforma.
-- Un avviso sbagliato deve poter sparire senza aspettare chi l'ha scritto.
drop policy if exists "Author or admin deletes" on public.club_posts;
create policy "Author or admin deletes" on public.club_posts
  for delete to authenticated
  using (author_id = auth.uid() or is_admin());
