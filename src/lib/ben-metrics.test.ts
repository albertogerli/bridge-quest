import { afterEach, describe, expect, it, vi } from "vitest";
import { benEngine, benMetricRecord, measureBenRoute } from "./ben-metrics";
import {execFileSync} from 'node:child_process';
describe("BEN privacy-safe operational measurements", () => {
  afterEach(() => vi.restoreAllMocks());
  it("does not copy arbitrary upstream values or context fields", () => {
    const context = { attempts: 1, cache: false, engine: benEngine("private hand and identity"), privatePayload: "never log" };
    const record = benMetricRecord("bid", 502, 5800.4, context);
    expect(record).toEqual({ event: "bridgelab.ben.v1", route: "bid", status: 502, durationMs: 5800, attempts: 1, cache: false, engine: "other" });
    expect(JSON.stringify(record)).not.toMatch(/private|never/);
  });
  it("counts cached responses without pretending to call the engine", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const response = new Response("cached", { status: 200 });
    expect(await measureBenRoute("bid", {}, async (_request, metric) => { metric.cache = true; return response; })).toBe(response);
    expect(log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(log.mock.calls[0][0])).toMatchObject({ status: 200, attempts: 0, cache: true });
  });
  it("records failure once and preserves the original exception", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const failure = new Error("sensitive upstream text");
    await expect(measureBenRoute("play", {}, async () => { throw failure; })).rejects.toBe(failure);
    expect(log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(log.mock.calls[0][0])).toMatchObject({ status: 500 });
    expect(log.mock.calls[0][0]).not.toContain("sensitive");
  });
  it("normalizes classification and invalid numerical values", () => {
    expect(benEngine("NN")).toBe("nn"); expect(benEngine("Simulation")).toBe("simulation");
    expect(benMetricRecord("lead", NaN, Infinity, { attempts: 99, cache: false, engine: "other" })).toMatchObject({ status: 500, durationMs: 0, attempts: 2 });
  });
  it("summarizes exported logs without forwarding arbitrary log fields",()=>{
    const base={event:'bridgelab.ben.v1',route:'bid',engine:'nn',cache:false,status:200,attempts:1,durationMs:500};
    const input=[base,{message:JSON.stringify({...base,status:502,durationMs:1500,secret:'not-for-output'})},
      {event:'other',email:'not-for-output'}, {...base,status:999}].map(x=>JSON.stringify(x)).join('\n');
    const output=execFileSync(process.execPath,['scripts/summarize-ben-metrics.mjs'],{input,encoding:'utf8'});
    const summary=JSON.parse(output);
    expect(summary).toMatchObject({accepted:2,ignored:2});
    expect(summary.groups['bid/nn/upstream']).toMatchObject({requests:2,errors5xx:1,meanMs:1000});
    expect(output).not.toContain('not-for-output');
  });
});
