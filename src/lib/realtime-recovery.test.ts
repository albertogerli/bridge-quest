import { describe, expect, it, vi } from 'vitest';
import { createPostgresRecovery } from './realtime-recovery';
function setup() {
  const actions = { refresh: vi.fn(), ready: vi.fn(), pending: vi.fn(), protocolError: vi.fn() };
  return { actions, recovery: createPostgresRecovery(actions) };
}
const ready = { extension: 'postgres_changes', status: 'ok' };
describe('Postgres subscription recovery', () => {
  it('does not mistake the channel join for database readiness', () => {
    const { actions, recovery } = setup();
    recovery.status('SUBSCRIBED');
    expect(actions.ready).not.toHaveBeenCalled();
    expect(actions.refresh).not.toHaveBeenCalled();
    recovery.system(ready);
    expect(actions.ready).toHaveBeenCalledOnce();
    expect(actions.refresh).toHaveBeenCalledOnce();
  });
  it('rereads a change lost between the first SELECT and CDC readiness', () => {
    let remote = 0, visible = remote;
    const recovery = createPostgresRecovery({ refresh: () => { visible = remote; }, ready: vi.fn(), pending: vi.fn(), protocolError: vi.fn() });
    recovery.status('SUBSCRIBED');
    remote = 1; // No event: subscription is not ready yet.
    expect(visible).toBe(0);
    recovery.system(ready);
    expect(visible).toBe(1);
  });
  it('handles a readiness notification before the join callback', () => {
    const { actions, recovery } = setup();
    recovery.system(ready);
    expect(actions.refresh).not.toHaveBeenCalled();
    recovery.status('SUBSCRIBED');
    expect(actions.refresh).toHaveBeenCalledOnce();
  });
  it('does not refetch for duplicate acknowledgements', () => {
    const { actions, recovery } = setup();
    recovery.status('SUBSCRIBED'); recovery.system(ready);
    recovery.status('SUBSCRIBED'); recovery.system(ready);
    expect(actions.refresh).toHaveBeenCalledOnce();
  });
  it('rereads after reconnection, without a stale readiness flag', () => {
    const { actions, recovery } = setup();
    recovery.status('SUBSCRIBED'); recovery.system(ready);
    recovery.status('CLOSED'); recovery.status('SUBSCRIBED');
    expect(actions.pending).toHaveBeenCalledOnce();
    expect(actions.refresh).toHaveBeenCalledTimes(1);
    recovery.system(ready);
    expect(actions.refresh).toHaveBeenCalledTimes(2);
  });
  it('reports a database error once even after a healthy channel', () => {
    const { actions, recovery } = setup();
    recovery.status('SUBSCRIBED'); recovery.system(ready);
    const error = { extension: 'postgres_changes', status: 'error', message: 'private filter details' };
    recovery.system(error); recovery.system(error);
    expect(actions.protocolError.mock.calls).toEqual([[]]);
    recovery.system(ready);
    expect(actions.refresh).toHaveBeenCalledTimes(2);
    recovery.system(error);
    expect(actions.protocolError).toHaveBeenCalledTimes(2);
  });
  it('ignores unrelated/malformed messages', () => {
    const { actions, recovery } = setup();
    recovery.status('SUBSCRIBED');
    for (const message of [null, 'ok', {}, { extension: 'system', status: 'ok' }, { extension: 'postgres_changes', status: 'unknown' }]) recovery.system(message);
    expect(actions.ready).not.toHaveBeenCalled();
    expect(actions.protocolError).not.toHaveBeenCalled();
  });
  it('ignores callbacks after unmount', () => {
    const { actions, recovery } = setup();
    recovery.dispose(); recovery.status('SUBSCRIBED'); recovery.system(ready); recovery.status('CLOSED');
    expect(actions.refresh).not.toHaveBeenCalled();
    expect(actions.pending).not.toHaveBeenCalled();
  });
});
