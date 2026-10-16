-- ============================================================================
-- BridgeLab: il torneo di licita lo gestisce il server — parte 1 di 2
--
-- DA APPLICARE su Supabase -> SQL Editor. Idempotente. Solo aggiunte: il
-- torneo come funziona oggi non se ne accorge.
--
-- ORDINE
--   1. questo script;
--   2. il deploy del codice che usa `/api/licita/torneo`;
--   3. `torneo-licita-server-2-2026-10.sql`, che toglie al browser gli accessi
--      che il nuovo codice non usa più.
-- Eseguire il 3 prima del 2 fermerebbe il torneo per tutta la durata del
-- deploy; eseguire solo questo non cambia niente.
--
-- PERCHÉ
-- Il browser riceveva le quattro mani della smazzata in corso, la tabella
-- double dummy (quante prese fa ogni contratto) e le distribuzioni del valore
-- atteso, e poi scriveva lui contratto, punteggio e stelle. Chiunque aprisse
-- gli strumenti di sviluppo poteva vedere le carte degli avversari, o
-- scriversi tre stelle su ogni mano. Adesso l'asta vive sul server: al
-- browser arriva solo la mano di Sud, e il risultato lo calcola e lo scrive
-- il server a asta chiusa.
-- ============================================================================

begin;

-- ── L'asta in corso ─────────────────────────────────────────────────────────
-- Una riga per giocatore e mano finché l'asta è aperta; si cancella quando il
-- risultato è scritto. Il browser non la legge né la scrive: passa tutto da
-- `/api/licita/torneo`, con la chiave di servizio.
create table if not exists public.aste_torneo_in_corso (
  torneo_id     uuid not null references public.tornei(id) on delete cascade,
  mano_id       uuid not null references public.mani_generate(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  asta          text[] not null default '{}',
  aggiornata_at timestamptz not null default now(),
  primary key (torneo_id, mano_id, user_id),
  constraint aste_torneo_in_corso_dimensione
    check (array_ndims(asta) is null or (array_ndims(asta) = 1 and cardinality(asta) <= 319))
);

alter table public.aste_torneo_in_corso enable row level security;
revoke all on table public.aste_torneo_in_corso from public, anon, authenticated;
grant select, insert, update, delete on table public.aste_torneo_in_corso to service_role;

comment on table public.aste_torneo_in_corso is
  'Asta di torneo in corso, per giocatore. Solo server (/api/licita/torneo).';

-- ── La mano da dichiarare, per il server ───────────────────────────────────
-- La stessa scelta di `torneo_mano`, con l'utente passato esplicitamente: il
-- server chiama con la chiave di servizio, dove `auth.uid()` è vuoto. Per
-- questo è eseguibile SOLO da `service_role`: aperta agli utenti, chiunque
-- potrebbe chiedere la mano di un altro passando il suo id.
create or replace function public.torneo_mano_per(p_torneo uuid, p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  SELECT to_jsonb(m) || jsonb_build_object('numero', tm.numero)
  FROM public.torneo_mani tm
  JOIN public.mani_generate m ON m.id = tm.mano_id
  WHERE tm.torneo_id = p_torneo
    AND p_user IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.risultati_torneo r
      WHERE r.torneo_id = p_torneo AND r.mano_id = tm.mano_id AND r.user_id = p_user
    )
    AND EXISTS (SELECT 1 FROM public.tornei t WHERE t.id = p_torneo AND now() < t.chiude_at)
  ORDER BY tm.numero
  LIMIT 1;
$function$;

revoke execute on function public.torneo_mano_per(uuid, uuid) from public, anon, authenticated;
grant execute on function public.torneo_mano_per(uuid, uuid) to service_role;

insert into public.script_applicati (nome) values ('torneo-licita-server-1-2026-10.sql')
on conflict (nome) do nothing;

commit;
