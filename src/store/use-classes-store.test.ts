// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMyClasses, getMyEnrolledClasses } from "@/lib/instructors";
import { useClassesStore, useEnrolledClasses, useMyClasses } from "./use-classes-store";

vi.mock("@/lib/instructors", () => ({
  getMyClasses: vi.fn(),
  getMyEnrolledClasses: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  useClassesStore.setState({
    myClasses: [], myLoading: false, myLoaded: false, myError: null,
    enrolledClasses: [], enrolledLoading: false, enrolledLoaded: false, enrolledError: null,
  });
});
afterEach(cleanup);

describe.each([
  { label: "allievo", hook: useEnrolledClasses, load: vi.mocked(getMyEnrolledClasses) },
  { label: "istruttore", hook: useMyClasses, load: vi.mocked(getMyClasses) },
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
