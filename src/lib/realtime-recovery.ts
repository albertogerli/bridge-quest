/** Channel join is not PostgreSQL readiness. Recover changes made between the
 * initial SELECT and the actual CDC subscription (and during reconnects).
 * Source: supabase/realtime v2.130.0 realtime_channel.ex, system notification.
 */
export function createPostgresRecovery(actions: {
  refresh: () => void;
  ready: () => void;
  pending: () => void;
  protocolError: () => void;
}) {
  let joined = false;
  let postgres = false;
  let recovered = false;
  let reported = false;
  let disposed = false;
  function recover() {
    if (!disposed && joined && postgres && !recovered) {
      recovered = true;
      reported = false;
      actions.ready();
      actions.refresh();
    }
  }
  return {
    status(status: string) {
      if (disposed) return;
      if (status === 'SUBSCRIBED') {
        joined = true;
        recover();
      } else {
        joined = postgres = recovered = false;
        actions.pending();
      }
    },
    system(payload: unknown) {
      if (disposed || !payload || typeof payload !== 'object') return;
      const message = payload as Record<string, unknown>;
      if (message.extension !== 'postgres_changes') return;
      if (message.status === 'ok') {
        postgres = true;
        recover();
      } else if (message.status === 'error') {
        postgres = recovered = false;
        actions.pending();
        // A server-side subscription error is not automatically a network
        // interruption. Never forward raw filters/user IDs to telemetry.
        if (!reported) { reported = true; actions.protocolError(); }
      }
    },
    dispose() { disposed = true; },
  };
}
