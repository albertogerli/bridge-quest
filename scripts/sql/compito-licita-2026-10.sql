-- ============================================================================
-- Il compito di licita: gli allievi dichiarano le mani dell'insegnante
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `compito-licita-2026-10-rollback.sql`.
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
-- Dipende da: `minibridge-compiti-2026-08.sql` (stessa tabella, stesso schema
-- di flag), `registro-script-2026-10.sql` (`script_applicati`).
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- Un'insegnante (22/10/2026) ha spiegato i transfer, ha generato otto mani con
-- il vincolo sulla linea e le ha assegnate alla classe per farle dichiarare.
-- Gli allievi le hanno solo giocate: un compito arrivava sempre con il
-- contratto già deciso, e la casella «Solo gioco della carta» decideva
-- soltanto se mostrare la licita che ci portava.
--
-- È un flag e non un tipo di compito, come `minibridge`: stesse mani, stessa
-- pagina, stessi risultati in `game_results`, stesso conteggio di
-- completamento e di promemoria. Cambia che cosa fa l'allievo con la mano:
-- la dichiara da Sud con BEN come compagno, e il voto è il contratto
-- raggiunto rispetto al par.
--
-- `compito_per_allievo` restituisce `to_jsonb(a)`: la colonna arriva alla
-- pagina dell'allievo senza toccare la funzione.
-- ============================================================================

begin;

alter table public.assignments
  add column if not exists licita boolean not null default false;

comment on column public.assignments.licita is
  'Il compito si dichiara invece di giocarsi: l''allievo e Sud, BEN dichiara per gli altri tre, il voto e il contratto raggiunto rispetto al par.';

insert into public.script_applicati (nome) values ('compito-licita-2026-10.sql')
on conflict (nome) do nothing;

commit;
