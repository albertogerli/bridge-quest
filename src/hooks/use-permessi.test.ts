// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useNascosti } from "./use-permessi";

const fixtures = vi.hoisted(() => ({
  auth: { user: null as { id: string } | null, loading: true },
  enrolled: vi.fn(() => ({ classes: [], isLoaded: false })),
}));
vi.mock("@/contexts/auth-provider", () => ({ useSharedAuth: () => fixtures.auth }));
vi.mock("@/store/use-classes-store", () => ({ useEnrolledClasses: fixtures.enrolled }));
beforeEach(() => {
  fixtures.auth = { user: null, loading: true };
  fixtures.enrolled.mockClear();
});
afterEach(cleanup);

it("aspetta l'autenticazione e non interroga le classi dei visitatori anonimi", () => {
  const { result, rerender } = renderHook(() => useNascosti());
  expect(fixtures.enrolled).toHaveBeenLastCalledWith(false);
  fixtures.auth.loading = false;
  rerender();
  expect(fixtures.enrolled).toHaveBeenLastCalledWith(false);
  expect(result.current.nascosti.size).toBe(0);
  fixtures.auth.user = { id: "synthetic-user" };
  rerender();
  expect(fixtures.enrolled).toHaveBeenLastCalledWith(true);
});
