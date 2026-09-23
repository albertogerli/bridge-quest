import {describe,expect,it} from "vitest";
import changes from "../../docs/attuazione-qualita-2026-09-23/smazzate-prima-dopo.json";
import errata from "../../docs/attuazione-qualita-2026-09-23/smazzate-errata-prima-dopo.json";
import {auctionProblem} from "./catalog-auction";
import type {Smazzata} from "./catalog";
const seats=["north","east","south","west"] as const;
describe("source-backed FIGB position corrections",()=>{
  it.each([...changes,...errata])("$id keeps the auction, cards and opening leader coherent",({after})=>{
    const cards=Object.values(after.hands).flat();
    expect(cards).toHaveLength(52);
    expect(new Set(cards.map(c=>c.suit+c.rank)).size).toBe(52);
    for(const hand of Object.values(after.hands))expect(hand).toHaveLength(13);
    expect(auctionProblem(after as unknown as Smazzata)).toBeNull();
    const leader=seats[(seats.indexOf(after.declarer as typeof seats[number])+1)%4];
    expect(after.hands[leader]).toContainEqual(after.opening_lead);
    expect(after.dd_tricks).toBeGreaterThanOrEqual(0);
    expect(after.dd_tricks).toBeLessThanOrEqual(13);
  });
  it("does not lower an instructional contract to make it unbeatable",()=>{
    const {after}=changes.find(x=>x.id==="2-1")!;
    expect(after.contract).toBe("3NT");
    expect(after.dd_tricks).toBe(8);
  });
  it("restores the safety-play exercise's singleton king and club finesse",()=>{
    const {after}=changes.find(x=>x.id==="CG5-4")!;
    expect(after.hands.west.filter(c=>c.suit==="spade")).toEqual([{suit:"spade",rank:"K"}]);
    expect(after.hands.south).toContainEqual({suit:"club",rank:"J"});
    expect(after.commentary_en).toContain("6♠");
  });
  it("keeps source errata explicit rather than duplicating cards",()=>{
    const {after,reason}=changes.find(x=>x.id==="CG6-8")!;
    expect(after.hands.west).toContainEqual({suit:"heart",rank:"4"});
    expect(after.hands.north).toContainEqual({suit:"heart",rank:"6"});
    expect(reason).toContain("Errata fonte");
  });
  it("makes the unresolved spot-card assumption explicit and checks both DDS variants",()=>{
    const revised=errata.find(x=>x.id==="CG9-5")!;
    expect(revised.reason).toContain("Assunzione editoriale");
    expect(revised.alternateDds).toBe(revised.after.dd_tricks);
    expect(revised.after.contract).toBe("6S");
  });
});
