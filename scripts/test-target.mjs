/** Fail closed before any user creation, deletion or load test. No production override. */
export function assertTestTarget(target, confirmedTarget, kind = 'Supabase') {
  const url = new URL(target);
  const production = ['mjojjktuhhnycdsikcla.supabase.co', 'bridgelab.it', 'www.bridgelab.it'];
  if (production.includes(url.hostname.toLowerCase())) throw new Error(`${kind}: i test con scritture/carico sono vietati in produzione`);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('URL di test non valido');
  if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return;
  if (!confirmedTarget || new URL(confirmedTarget).href.replace(/\/$/, '') !== url.href.replace(/\/$/, '')) {
    throw new Error(`${kind}: confermare un servizio isolato con BRIDGELAB_TEST_SUPABASE_URL o BRIDGELAB_TEST_BEN_URL`);
  }
}
