import { describe, expect, it } from "vitest";
import { occorrenzeNelRange, volteCompromessa } from "./password-compromessa";

describe("password compromessa", () => {
  it("legge il conteggio della propria coda, ignorando maiuscole e righe di riempimento", () => {
    const risposta = "0018A45C4D1DEF81644B54AB7F969B88D65:1\r\nABCDEF0123456789ABCDEF0123456789ABC:42\r\nFFFF:0";
    expect(occorrenzeNelRange(risposta, "abcdef0123456789abcdef0123456789abc")).toBe(42);
    expect(occorrenzeNelRange(risposta, "1111")).toBe(0);
  });
  it("non controlla password troppo corte", async () => {
    expect(await volteCompromessa("abc")).toBeNull();
  });
});
