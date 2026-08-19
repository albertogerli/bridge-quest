-- ============================================================================
-- BridgeLab: convivere con Zoom e Meet
-- ============================================================================
--
-- Intervento 27 del terzo lotto. IDEMPOTENTE.
--
-- Abbiamo deciso di non costruire video e audio nel portale, ed è la decisione
-- giusta. Ma la lezione online si fa su Zoom o su Meet, e ignorarlo vuol dire
-- che l'insegnante incolla il link in chat a mano prima di ogni lezione — cioè
-- che il portale gli sta accanto invece che dentro.
--
-- Due campi e non uno: la classe ha la sua stanza fissa, la singola lezione può
-- averne un'altra. Chi non la mette usa quella del corso.
-- ============================================================================

alter table public.classes
  add column if not exists link_video text;
alter table public.assignments
  add column if not exists link_video text;

comment on column public.classes.link_video is
  'Zoom, Meet o altro: la stanza fissa del corso. Compare all''allievo accanto al materiale.';
comment on column public.assignments.link_video is
  'Il link della singola lezione, quando cambia. Se vuoto vale quello della classe.';
