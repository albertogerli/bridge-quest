-- ============================================================================
-- Il profilo nasce completo dalla registrazione
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `profilo-da-registrazione-2026-10-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- Alla registrazione il client faceva un `upsert` su `profiles` con nome,
-- utente BBO, associazione, fascia d'età e piattaforma. Da quando `profiles`
-- ha i privilegi per colonna (agosto 2026) quell'upsert fallisce SEMPRE con
-- «permission denied for table profiles»: `INSERT … ON CONFLICT DO UPDATE SET
-- col = EXCLUDED.col` legge le colonne, e `authenticated` non ha SELECT su
-- `platform` e `profile_type`. Il profilo lo creava comunque questo trigger,
-- ma con il solo nome: da agosto i nuovi iscritti hanno perso associazione,
-- utente BBO e fascia d'età scelti nel modulo. Nessuno se n'è accorto perché
-- l'errore non veniva guardato; lo ha mostrato Sentry (BRIDGELAB-21) il
-- 2 ottobre, appena la scrittura ha cominciato a segnalarlo.
--
-- I dati arrivano già al server con `signUp`, nei metadati dell'utente: il
-- trigger li legge da lì, e il client non scrive più niente. Una strada sola.
--
-- I METADATI LI SCRIVE L'UTENTE, quindi si validano: fascia d'età fra le
-- quattro ammesse, testi ripuliti e accorciati. Sono le stesse colonne che
-- l'utente può comunque modificare dal suo profilo (ha UPDATE su tutte), non
-- si apre niente di nuovo. Il ruolo NON si legge mai dai metadati.
--
-- UN DATO SBAGLIATO NON DEVE FAR FALLIRE LA REGISTRAZIONE: se l'inserimento
-- completo non riesce (per esempio un utente BBO già preso da un altro), si
-- ripiega sul profilo con il solo nome, come prima.
-- ============================================================================

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_nome text := coalesce(nullif(left(btrim(m->>'display_name'), 80), ''), 'Bridgista');
  v_tipo text := m->>'profile_type';
begin
  if v_tipo is null or v_tipo not in ('junior', 'giovane', 'adulto', 'senior') then
    v_tipo := 'adulto';
  end if;

  begin
    insert into public.profiles (id, display_name, bbo_username, asd_code, asd_name, profile_type, platform)
    values (
      new.id,
      v_nome,
      nullif(left(btrim(m->>'bbo_username'), 40), ''),
      nullif(left(btrim(m->>'asd_code'), 20), ''),
      nullif(left(btrim(m->>'asd_name'), 120), ''),
      v_tipo,
      nullif(left(btrim(m->>'platform'), 20), '')
    );
  exception when others then
    insert into public.profiles (id, display_name)
    values (new.id, v_nome);
  end;

  return new;
end;
$function$;

revoke all on function public.handle_new_user() from public, anon, authenticated, service_role;
grant execute on function public.handle_new_user() to authenticated;

insert into public.script_applicati (nome) values ('profilo-da-registrazione-2026-10.sql')
on conflict (nome) do nothing;

commit;
