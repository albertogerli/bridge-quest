-- ============================================================================
-- BridgeLab: il minibridge come modalità di un compito
-- ============================================================================
--
-- Intervento 16 del secondo lotto.
--
-- DIPENDENZE: `instructor_portal.sql`.
-- IDEMPOTENTE.
--
-- Le prime lezioni del Corso Fiori si fanno senza dichiarazione. Finora l'unico
-- posto dove giocare così era `/gioca/minibridge`, una pagina a sé: un compito
-- assegnato alla prima lezione portava comunque l'allievo davanti a una
-- cassetta delle dichiarazioni, cioè a una cosa che non gli è ancora stata
-- spiegata.
--
-- È un flag e non un tipo di compito perché tutto il resto resta identico —
-- stesse mani, stessi risultati, stessa pagina, stesso conteggio di
-- completamento. Cambia solo come si arriva al contratto.
alter table public.assignments
  add column if not exists minibridge boolean not null default false;

comment on column public.assignments.minibridge is
  'Il compito si gioca senza dichiarazione: chi ha piu punti gioca, il livello viene dalla tabella delle decisioni. Serve alle prime lezioni del Corso Fiori.';
