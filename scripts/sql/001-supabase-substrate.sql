-- ============================================================================
-- SOSTRATO SUPABASE — da eseguire PRIMA dello schema, e solo fuori da Supabase
--
-- Su un progetto Supabase tutto questo esiste già: ruoli, schema `auth`,
-- `auth.uid()` e la publication di Realtime sono forniti dalla piattaforma.
--
-- Serve per ricostruire il database ALTROVE: un PostgreSQL locale per provare
-- una migrazione, un ambiente di collaudo, una perizia che debba verificare le
-- policy senza toccare la produzione.
--
-- Verificato il 2026-08-13: con questo file più `000-schema-baseline.sql`, un
-- PostgreSQL 14 vuoto arriva a 35 tabelle, 72 policy, 99 indici e 13 trigger,
-- gli stessi numeri della produzione.
--
-- NOTA: `auth.uid()` qui restituisce sempre NULL. Basta a creare le policy,
-- NON a provarne il comportamento: per quello serve un vero Supabase (vedi
-- `npm run test:rls`).
-- ============================================================================

CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE ROLE authenticator NOINHERIT LOGIN;
GRANT anon, authenticated, service_role TO authenticator;

CREATE SCHEMA IF NOT EXISTS auth;

-- Solo le colonne cui lo schema applicativo fa riferimento.
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY,
  email text
);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text
  LANGUAGE sql STABLE AS $$ SELECT NULL::text $$;

CREATE PUBLICATION supabase_realtime;

-- `supabase_vault` è gestita dalla piattaforma e non esiste altrove: la riga
-- corrispondente in 000-schema-baseline.sql fallirà, ed è previsto.
