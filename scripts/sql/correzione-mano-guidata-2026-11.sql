-- ============================================================================
-- Mano guidata n. 3: «Battezza le cuori» → «Batti le atout»
-- ============================================================================
--
-- 26/11/2026. Revisione dei giochi. «Battezzare» non è il termine: le atout
-- si «battono». Solo contenuti, nessuna modifica di schema.
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

update public.guided_hands
set description = $t$Batti le atout (cuori) e poi incassa i vincenti laterali.$t$,
    updated_at = now()
where id = 3
  and description is distinct from $t$Batti le atout (cuori) e poi incassa i vincenti laterali.$t$;

insert into public.script_applicati (nome) values ('correzione-mano-guidata-2026-11.sql')
on conflict (nome) do nothing;
