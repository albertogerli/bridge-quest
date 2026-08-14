-- ============================================================================
-- BridgeLab: codice amico (profiles.friend_code + accettazione per codice)
-- ============================================================================
--
-- PERCHÉ
-- Oggi per aggiungere un amico bisogna cercarlo per nome e sperare di
-- riconoscerlo fra gli omonimi. È attrito, e l'attrito qui costa caro: tutta
-- la pratica di coppia — licita a due, sfide, compiti condivisi — comincia da
-- «ho un amico sulla piattaforma». Senza un invito che si manda su WhatsApp,
-- quella parte del prodotto non decolla.
--
-- Sei caratteri, come fa Cuebids: si dettano al telefono, si scrivono su un
-- foglietto al circolo, stanno in un QR.
--
-- L'ALFABETO ESCLUDE LE LETTERE AMBIGUE. Niente O/0, I/1, L, S/5: un codice
-- che si detta a voce fra persone di sessant'anni in una sala rumorosa deve
-- essere trascrivibile senza chiedere «la o o lo zero?».
--
-- COSA NON ESPONE. Il codice serve solo a mandare la richiesta: chi lo ha non
-- vede nulla del profilo finché l'altro non accetta. `friend_by_code` torna
-- solo id e nome visualizzato — quanto basta a mostrare «vuoi aggiungere
-- Mario?» e nient'altro.
--
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

alter table public.profiles
  add column if not exists friend_code text;

create unique index if not exists profiles_friend_code_key
  on public.profiles (friend_code)
  where friend_code is not null;

/** Sei caratteri senza lettere che si confondono a voce. */
create or replace function public.genera_codice_amico()
returns text
language plpgsql
volatile
set search_path to 'public'
as $function$
DECLARE
  alfabeto text := 'ABCDEFGHJKMNPQRTUVWXYZ2346789';
  codice   text;
  i        int;
BEGIN
  LOOP
    codice := '';
    FOR i IN 1..6 LOOP
      codice := codice || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE friend_code = codice);
  END LOOP;
  RETURN codice;
END
$function$;

/**
 * Il proprio codice, creandolo alla prima richiesta.
 *
 * Non si genera per tutti in anticipo: la maggior parte degli iscritti non lo
 * userà mai, e un codice inutilizzato è comunque un identificatore in più che
 * gira.
 */
create or replace function public.mio_codice_amico()
returns text
language plpgsql
volatile
security definer
set search_path to 'public'
as $function$
DECLARE v_codice text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;

  SELECT friend_code INTO v_codice FROM public.profiles WHERE id = auth.uid();
  IF v_codice IS NOT NULL THEN RETURN v_codice; END IF;

  v_codice := public.genera_codice_amico();
  UPDATE public.profiles SET friend_code = v_codice WHERE id = auth.uid();
  RETURN v_codice;
END
$function$;

revoke execute on function public.mio_codice_amico() from public;
revoke execute on function public.mio_codice_amico() from anon;
grant execute on function public.mio_codice_amico() to authenticated;

/**
 * Chi c'è dietro un codice: solo id e nome, e solo per chi è autenticato.
 *
 * Serve a mostrare «vuoi aggiungere Mario?» prima di mandare la richiesta.
 * Nient'altro esce: non il circolo, non gli XP, non l'email. Un codice
 * indovinato non deve diventare una finestra sul profilo di uno sconosciuto.
 */
create or replace function public.amico_da_codice(p_codice text)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN NULL
    ELSE (
      SELECT jsonb_build_object('id', p.id, 'nome', p.display_name)
      FROM public.profiles p
      WHERE upper(btrim(p.friend_code)) = upper(btrim(p_codice))
        AND p.id <> auth.uid()
      LIMIT 1
    )
  END;
$function$;

revoke execute on function public.amico_da_codice(text) from public;
revoke execute on function public.amico_da_codice(text) from anon;
grant execute on function public.amico_da_codice(text) to authenticated;
