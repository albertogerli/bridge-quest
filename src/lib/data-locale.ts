/**
 * La data di oggi in Italia, come `AAAA-MM-GG`.
 *
 * PERCHÉ NON `toISOString().slice(0, 10)`. Quella dà il giorno in UTC, e
 * `profiles.last_login` è una colonna `date`: scriverci dentro un istante ISO
 * funziona — Postgres tiene la parte davanti e butta il resto — ma la parte
 * davanti è il giorno UTC. Un accesso all'una e mezza di notte italiana è
 * mezzanotte e mezza in UTC del giorno prima, e finiva contato il giorno
 * prima. Il pannello degli accessi giornalieri lo mostrava come tale.
 *
 * Non è un caso di scuola: l'ora in cui si gioca a bridge online è la sera, e
 * la sera che va per le lunghe passa la mezzanotte.
 *
 * `en-CA` è il modo breve di ottenere `AAAA-MM-GG` da `Intl`: quel locale
 * formatta le date proprio così. Il fuso è fissato a Europe/Rome e non preso
 * dal dispositivo, perché la domanda a cui la colonna risponde — «quanti
 * accessi il tal giorno» — è una domanda sui giorni italiani, non sui giorni
 * di chi in quel momento è in vacanza altrove.
 */
export function oggiInItalia(adesso: Date = new Date()): string {
  return adesso.toLocaleDateString("en-CA", { timeZone: "Europe/Rome" });
}
