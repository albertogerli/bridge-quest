import { describe, expect, it } from "vitest";
import { nomiDoppi } from "./instructors";

describe("nomiDoppi", () => {
  it("segna chi si chiama come un altro, maiuscole e spazi a parte", () => {
    const membri = [
      { student_id: "a", display_name: "Giuseppe" },
      { student_id: "b", display_name: "  giuseppe " },
      { student_id: "c", display_name: "Anna" },
    ];
    expect([...nomiDoppi(membri)].sort()).toEqual(["a", "b"]);
  });

  it("nessuno quando i nomi sono diversi; i senza nome non contano", () => {
    const membri = [
      { student_id: "a", display_name: "Giuseppe Rossi" },
      { student_id: "b", display_name: "Giuseppe B." },
      { student_id: "c", display_name: null },
      { student_id: "d", display_name: "" },
    ];
    expect(nomiDoppi(membri).size).toBe(0);
  });
});
