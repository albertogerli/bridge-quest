// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMyClasses, getMyEnrolledClasses } from "@/lib/instructors";
import { useClassesStore, useEnrolledClasses, useMyClasses } from "./use-classes-store";

vi.mock("@/lib/instructors", () => ({
  getMyClasses: vi.fn(),
  getMyEnrolledClasses: vi.fn(),
}));

const auth = vi.hoisted(() => ({ user: { id: "u1" } as { id: string } | null }));
vi.mock("@/contexts/auth-provider", () => ({ useSharedAuth: () => ({ user: auth.user }) }));

beforeEach(() => {
  vi.resetAllMocks();
  auth.user = { id: "u1" };
  useClassesStore.setState({
    utenteId: "u1",
    myClasses: [], myLoading: false, myLoaded: false, myError: null,
    enrolledClasses: [], enrolledLoading: false, enrolledLoaded: false, enrolledError: null,
  });
});
afterEach(cleanup);

describe.each([
  { label: "allievo", hook: useEnrolledClasses, load: vi.mocked(getMyEnrolledClasses) },
  { label: "insegnante", hook: useMyClasses, load: vi.mocked(getMyClasses) },
])("caricamento classi $label", ({ hook, load }) => {
  it("si ferma sull'errore e consente un nuovo tentativo esplicito", async () => {
    // The second unresolved result bounds the OLD infinite retry loop, so a
    // regression fails the assertion without freezing the test runner.
    load.mockRejectedValueOnce(new Error("Non autenticato"));
    load.mockImplementation(() => new Promise(() => {}));
    const { result, rerender } = renderHook(() => hook());
    await waitFor(() => expect(result.current.error).toBe("Non autenticato"));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoaded).toBe(false);
    rerender();
    expect(load).toHaveBeenCalledTimes(1);

    load.mockResolvedValue([]);
    await act(() => result.current.refresh());
    expect(load).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoaded).toBe(true);
  });

  it("condivide una sola richiesta tra più componenti di navigazione", async () => {
    let finish!: (value: []) => void;
    load.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const { result } = renderHook(() => [hook(), hook()]);
    expect(load).toHaveBeenCalledTimes(1);
    await act(async () => { finish([]); });
    expect(result.current.every(value => value.isLoaded && !value.isLoading)).toBe(true);
  });

  it("non scarta un refresh esplicito richiesto dopo una modifica", async () => {
    let finishFirst!: (value: []) => void;
    load.mockImplementationOnce(() => new Promise((resolve) => { finishFirst = resolve; }));
    load.mockResolvedValue([]);
    const { result } = renderHook(() => hook());
    await act(() => result.current.refresh());
    expect(load).toHaveBeenCalledTimes(2);
    await act(async () => { finishFirst([]); });
  });
});

it("non cerca le iscrizioni quando il caricamento è disabilitato", () => {
  renderHook(() => useEnrolledClasses(false));
  expect(getMyEnrolledClasses).not.toHaveBeenCalled();
});

describe("cambio di account senza ricaricare la pagina", () => {
  it("dimentica le classi del precedente e rilegge quelle del nuovo", async () => {
    // Trevissoi, 14/10/2026: uscito come insegnante e rientrato come allievo,
    // la home restava quella di chi non ha classi.
    const load = vi.mocked(getMyEnrolledClasses);
    load.mockResolvedValueOnce([]);
    const { result, rerender } = renderHook(() => useEnrolledClasses());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.classes).toEqual([]);

    load.mockResolvedValueOnce([{ id: "c1" } as never]);
    auth.user = { id: "u2" };
    rerender();
    await waitFor(() => expect(result.current.classes).toHaveLength(1));
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("non riprende un errore «Non autenticato» del caricamento precedente", async () => {
    const load = vi.mocked(getMyEnrolledClasses);
    auth.user = null;
    useClassesStore.setState({ utenteId: null, enrolledError: "Non autenticato" });
    const { result, rerender } = renderHook(() => useEnrolledClasses());
    expect(load).not.toHaveBeenCalled();

    load.mockResolvedValueOnce([{ id: "c1" } as never]);
    auth.user = { id: "u1" };
    rerender();
    await waitFor(() => expect(result.current.classes).toHaveLength(1));
  });

  it("scarta la risposta arrivata per l'account di prima", async () => {
    const load = vi.mocked(getMyEnrolledClasses);
    let finisciVecchia!: (v: never[]) => void;
    load.mockImplementationOnce(() => new Promise((ok) => { finisciVecchia = ok; }));
    load.mockResolvedValueOnce([]);
    const { result, rerender } = renderHook(() => useEnrolledClasses());
    auth.user = { id: "u2" };
    rerender();
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    await act(async () => { finisciVecchia([{ id: "vecchia" } as never]); });
    expect(result.current.classes).toEqual([]);
  });
});
