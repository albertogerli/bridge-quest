/** Only an explicitly selected loopback test backend may add HTTP/WS to CSP. */
export function localTestCspSources(configured, confirmed, hosted = false) {
  if (hosted || !configured || configured !== confirmed) return [];
  try {
    const url = new URL(configured);
    if (!['127.0.0.1','localhost','[::1]'].includes(url.hostname)
      || !['http:','https:'].includes(url.protocol) || url.username || url.password
      || url.pathname !== '/' || url.search || url.hash) return [];
    return [url.origin, url.origin.replace(/^http/, 'ws')];
  } catch { return []; }
}
