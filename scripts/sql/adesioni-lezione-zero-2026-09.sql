-- ============================================================================
-- Le adesioni alla Lezione Zero
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `adesioni-lezione-zero-2026-09-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- ----------------------------------------------------------------------------
-- IL PRIMO GRADO, E SOLO QUELLO
--
-- Chi inquadra il cartello e dice «vengo» lascia un nome e un recapito. Basta
-- questo: il codice fiscale serve al tesseramento, non alla Lezione Zero, e un
-- campo che esiste si riempie — quindi qui non c'è.
--
-- NON RICHIEDE UN ACCOUNT. È il punto: «uno si può iscrivere alla Lezione Zero
-- pure in diretta, può arrivare in aula come capita, senza essersi registrato».
-- `user_id` resta nullo finché quella persona non ne ha uno, che è il caso
-- normale di chi aderisce alle otto di sera davanti a una bacheca.
--
-- NON SI CANCELLA, SI ARCHIVIA. «Quanti hanno aderito e quanti sono venuti» è
-- il tasso di conversione della Lezione Zero, cioè uno degli indicatori che
-- vanno in Consiglio: quel dato non è amministrativo, è la misura del metodo.
-- ============================================================================

begin;

create table if not exists public.adesioni (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references public.classes(id) on delete cascade,
  nome          text not null,
  -- Un campo solo per telefono O email: nel modulo si chiede così, perché
  -- «contatto» a chi ha sessant'anni fa perdere tempo a capire cosa vogliamo.
  contatto      text not null,
  note          text,
  /** Da dove arriva: locandina, aula, passaparola. A novembre la domanda
      «da dove vengono» avrà una risposta invece di un'impressione. */
  fonte         text not null default 'locandina',
  /** Si valorizza quando la persona ottiene un account. Lo collega
      L'INSEGNANTE con un tocco, non un algoritmo sui nomi: in una classe ci
      sono due Maria Rossi, e chi le conosce è lui. */
  user_id       uuid references auth.users(id) on delete set null,
  creata_il     timestamptz not null default now(),
  archiviata_il timestamptz,

  constraint adesioni_nome_non_vuoto check (length(trim(nome)) between 2 and 120),
  constraint adesioni_contatto_non_vuoto check (length(trim(contatto)) between 3 and 160)
);

create index if not exists adesioni_per_classe on public.adesioni (class_id, creata_il desc);

alter table public.adesioni enable row level security;

-- L'insegnante della classe le vede e le gestisce. Nessun altro: un'adesione è
-- un nome e un recapito di una persona che non si è ancora registrata.
drop policy if exists "L'insegnante gestisce le adesioni della sua classe" on public.adesioni;
create policy "L'insegnante gestisce le adesioni della sua classe"
  on public.adesioni for all
  using (public.is_instructor_of_class(class_id))
  with check (public.is_instructor_of_class(class_id));

-- Chi ha un account collegato vede la propria, e basta.
drop policy if exists "Ognuno vede la propria adesione" on public.adesioni;
create policy "Ognuno vede la propria adesione"
  on public.adesioni for select using (user_id = auth.uid());

comment on table public.adesioni is
  'Chi ha detto «vengo» a una Lezione Zero. Primo grado della raccolta: nome e '
  'recapito, niente di piu''. Non richiede un account.';

-- ----------------------------------------------------------------------------
-- L'invio dalla pagina pubblica
--
-- `security definer` perché chi aderisce NON HA UN ACCOUNT: nessuna RLS può
-- lasciarlo passare, e la porta dev'essere stretta e sola. Accetta solo se il
-- codice esiste, la classe ha una locandina e le iscrizioni sono aperte — le
-- stesse condizioni della pagina che ha appena letto.
--
-- NON RIFIUTA I DOPPIONI, ed è deliberato: il caso più frequente non è il
-- buontempone, è la moglie che aderisce e poi iscrive anche il marito con il
-- PROPRIO numero. Bloccare sullo stesso recapito romperebbe quel caso, che è
-- legittimo e comune. I doppioni si mostrano all'insegnante, che sa chi sono.
-- ----------------------------------------------------------------------------
create or replace function public.adesione_invia(
  p_codice text, p_nome text, p_contatto text, p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_class uuid;
begin
  if length(trim(coalesce(p_nome, ''))) < 2 then
    return jsonb_build_object('esito', 'nome-mancante');
  end if;
  if length(trim(coalesce(p_contatto, ''))) < 3 then
    return jsonb_build_object('esito', 'contatto-mancante');
  end if;

  select c.id into v_class
    from public.classes c
   where upper(c.invite_code) = upper(trim(p_codice))
     and c.invite_active
     and c.locandina <> '{}'::jsonb
     and (c.invite_expires_at is null or c.invite_expires_at > now());

  if v_class is null then
    return jsonb_build_object('esito', 'evento-chiuso');
  end if;

  insert into public.adesioni(class_id, nome, contatto, note, fonte, user_id)
  values (v_class, trim(p_nome), trim(p_contatto), nullif(trim(coalesce(p_note,'')), ''),
          'locandina', auth.uid());

  return jsonb_build_object('esito', 'ricevuta');
end $$;

revoke all on function public.adesione_invia(text, text, text, text) from public;
grant execute on function public.adesione_invia(text, text, text, text) to anon, authenticated;

comment on function public.adesione_invia(text, text, text, text) is
  'Adesione dalla pagina pubblica dell''evento, senza account. Non rifiuta i '
  'doppioni: la moglie che iscrive anche il marito usa il proprio numero, e '
  'bloccarli romperebbe il caso legittimo piu'' comune.';

commit;
