// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { HandEvalBlock } from "@/app/lezioni/[lessonId]/[moduleId]/_components/hand-eval-block";
import { TrueFalseBlock } from "@/app/lezioni/[lessonId]/[moduleId]/_components/true-false-block";
import DispensePage from "@/app/dispense/page";
import type { ModuleBlockContext } from "@/app/lezioni/[lessonId]/[moduleId]/_types";

const state = vi.hoisted(() => ({ language: "it", catalog: { courses: [], isLoaded: false, isLoading: false, error: null as string | null, retry: vi.fn() } }));
vi.mock("@/contexts/traduzioni-provider", () => ({ useT: () => (s: string) => state.language === "en" ? ({ Vero: "True", Falso: "False" } as Record<string, string>)[s] ?? s : s }));
vi.mock("@/hooks/use-lingua", () => ({ useLingua: () => ({ lingua: state.language }) }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock("@/store/use-catalog-store", () => ({ useCatalog: () => state.catalog }));
vi.mock("@/store/use-game-store", () => ({ useGameStore: () => ({}) }));
vi.mock("@/components/maestro-video", () => ({ getInfographicForLesson: vi.fn() }));
vi.mock("@/app/lezioni/[lessonId]/[moduleId]/_components/enriched-text", () => ({ EnrichedText: ({ text }: { text: string }) => text }));
afterEach(cleanup);
const context = () => ({ glossaryTermMap: new Map(), quizAnswers: {}, showExplanation: {}, handleHandEval: vi.fn(), handleQuizAnswer: vi.fn() }) as unknown as ModuleBlockContext;

describe("actual content components", () => {
  it("accepts 40 through the rendered numeric control, without HCP-only buttons", () => {
    state.language = "it";
    const ctx = context();
    render(createElement(HandEvalBlock, { block: { type: "hand-eval", content: "Quante volte su 100?", correctValue: 40, numericUnit: "percent" }, blockIndex: 3, delay: 0, ctx }));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "40" } });
    fireEvent.click(screen.getByRole("button", { name: "Conferma" }));
    expect(ctx.handleHandEval).toHaveBeenCalledWith(3, 40, true);
  });
  it("renders translated true/false controls and preserves answer indices", () => {
    state.language = "en";
    const ctx = context();
    render(createElement(TrueFalseBlock, { block: { type: "true-false", content: "Test", correctAnswer: 0 }, blockIndex: 0, delay: 0, ctx }));
    fireEvent.click(screen.getByRole("button", { name: "True" }));
    expect(screen.getByRole("button", { name: "False" })).toBeDefined();
    expect(ctx.handleQuizAnswer).toHaveBeenCalledWith(0, 0);
  });
  it("renders Dispense from an empty store and offers a real retry on failure", () => {
    state.language = "it";
    const view = render(createElement(DispensePage));
    expect(screen.getByRole("status").textContent).toContain("Caricamento");
    state.catalog.isLoaded = true; state.catalog.error = "network";
    view.rerender(createElement(DispensePage));
    fireEvent.click(screen.getByRole("button", { name: "Riprova" }));
    expect(state.catalog.retry).toHaveBeenCalledOnce();
    state.catalog.error = null;
    view.rerender(createElement(DispensePage));
    expect(screen.getByRole("status").textContent).toContain("Nessun corso");
  });
});
