import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Course } from "./catalog";
const calls = vi.hoisted(() => ({ courses: vi.fn(), hands: vi.fn() }));
vi.mock("@/lib/catalog", () => ({ getCourses: calls.courses, getAllSmazzate: calls.hands,
  validateSmazzate: (x: unknown) => x, isPlausibleSmazzata: () => true }));
vi.mock("@/hooks/use-lingua", () => ({ useLingua: () => ({ lingua: "it" }) }));
import { useCatalogStore } from "@/store/use-catalog-store";
import { useSmazzateStore } from "@/store/use-smazzate-store";
beforeEach(() => {
  vi.resetAllMocks();
  useCatalogStore.setState({ courses: [], isLoading: false, isLoaded: false, error: null, lingua: "it" });
  useSmazzateStore.setState({ smazzate: [], isLoading: false, isLoaded: false, error: null });
});
describe("catalog recovery", () => {
  it("retries failed hands without automatically looping", async () => {
    calls.hands.mockRejectedValueOnce(new Error("offline")).mockResolvedValue([]);
    await useSmazzateStore.getState().fetchSmazzate();
    expect(useSmazzateStore.getState().isLoaded).toBe(true);
    expect(useSmazzateStore.getState().error).toBe("offline");
    await useSmazzateStore.getState().fetchSmazzate();
    expect(calls.hands).toHaveBeenCalledTimes(2);
    expect(useSmazzateStore.getState().error).toBeNull();
  });
  it("retries a failed lesson catalog", async () => {
    calls.courses.mockRejectedValueOnce(new Error("offline")).mockResolvedValue([]);
    await useCatalogStore.getState().fetchCatalog();
    await useCatalogStore.getState().fetchCatalog();
    expect(calls.courses).toHaveBeenCalledTimes(2);
    expect(useCatalogStore.getState().error).toBeNull();
  });
  it("ignores a late response in the preceding language", async () => {
    let resolveItalian!: (value: Course[]) => void;
    calls.courses.mockReturnValueOnce(new Promise<Course[]>((r) => { resolveItalian = r; })).mockResolvedValue([]);
    const italian = useCatalogStore.getState().fetchCatalog("it");
    await useCatalogStore.getState().fetchCatalog("en");
    resolveItalian([{ id: "fiori" } as Course]); await italian;
    expect(useCatalogStore.getState().lingua).toBe("en");
    expect(useCatalogStore.getState().courses).toEqual([]);
  });
});
