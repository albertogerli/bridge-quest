import { describe, expect, it } from "vitest";
import { assertTestTarget } from "../../scripts/test-target.mjs";
describe("isolated test target guard", () => {
  it("rejects production even if explicitly confirmed", () => {
    const prod = "https://mjojjktuhhnycdsikcla.supabase.co";
    expect(() => assertTestTarget(prod, prod)).toThrow("produzione");
  });
  it("allows local fixtures and requires exact remote staging confirmation", () => {
    expect(() => assertTestTarget("http://127.0.0.1:54321")).not.toThrow();
    expect(() => assertTestTarget("https://staging.example", "https://other.example")).toThrow();
    expect(() => assertTestTarget("https://staging.example", "https://staging.example/")).not.toThrow();
  });
});
