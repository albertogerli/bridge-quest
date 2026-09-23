// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFriends } from '@/hooks/use-friends';
import { useChallenges } from '@/hooks/use-challenges';

const mock = vi.hoisted(() => ({
  from: vi.fn(), rpc: vi.fn(), report: vi.fn(),
  system: undefined as undefined | ((message: unknown) => void),
  status: undefined as undefined | ((status: string) => void),
}));
vi.mock('@/lib/report-error', () => ({ reportError: mock.report }));
vi.mock('@/lib/supabase/client', () => {
  const query = {
    select() { return this; }, eq() { return this; }, in() { return this; },
    or() { return this; }, order() { return this; },
    then(resolve: (value: { data: never[]; error: null }) => unknown) {
      return Promise.resolve({ data: [], error: null }).then(resolve);
    },
  };
  const channel = {
    on(type: string, _filter: unknown, callback: (message: unknown) => void) {
      if (type === 'system') mock.system = callback;
      return this;
    },
    subscribe(callback: (status: string) => void) { mock.status = callback; return this; },
  };
  const client = {
    auth: {
      getUser: async () => ({ data: { user: { id: 'synthetic-recipient' } }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: (...args: unknown[]) => { mock.from(...args); return query; },
    rpc: async (...args: unknown[]) => { mock.rpc(...args); return { data: [], error: null }; },
    channel: () => channel,
    removeChannel: async () => undefined,
  };
  return { createClient: () => client };
});
beforeEach(() => { vi.clearAllMocks(); mock.system = undefined; mock.status = undefined; });
afterEach(cleanup);

for (const { name, useHook } of [{ name: 'friends', useHook: useFriends }, { name: 'challenges', useHook: useChallenges }]) {
  describe(`${name}: real hook subscription recovery`, () => {
    it('refetches on database readiness, not just the WebSocket join', async () => {
      const { result } = renderHook(() => ({ loading: useHook().loading }));
      await waitFor(() => { expect(result.current.loading).toBe(false); expect(mock.system).toBeDefined(); });
      const initialReads = mock.from.mock.calls.length;
      await act(async () => { mock.status?.('SUBSCRIBED'); });
      expect(mock.from).toHaveBeenCalledTimes(initialReads);
      await act(async () => { mock.system?.({ extension: 'postgres_changes', status: 'ok' }); });
      await waitFor(() => expect(mock.from.mock.calls.length).toBeGreaterThan(initialReads));
      expect(mock.report).not.toHaveBeenCalled();
    });
    it('does not refetch or report from a channel disposed on unmount', async () => {
      const { result, unmount } = renderHook(() => ({ loading: useHook().loading }));
      await waitFor(() => { expect(result.current.loading).toBe(false); expect(mock.system).toBeDefined(); });
      unmount();
      const initialReads = mock.from.mock.calls.length;
      await act(async () => {
        mock.status?.('SUBSCRIBED');
        mock.system?.({ extension: 'postgres_changes', status: 'ok' });
        mock.system?.({ extension: 'postgres_changes', status: 'error' });
        mock.status?.('CHANNEL_ERROR');
      });
      expect(mock.from).toHaveBeenCalledTimes(initialReads);
      expect(mock.report).not.toHaveBeenCalled();
    });
  });
}
