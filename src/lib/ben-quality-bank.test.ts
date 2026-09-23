import {describe,expect,it} from 'vitest';
import {benchmarkAuction,normalizeBenBid} from '../../scripts/ben-quality-auction.mjs';
describe('isolated BEN quality benchmark',()=>{
  it.each([null,undefined,'','8S','garbage',42])('rejects a missing or invalid bid: %s',value=>{
    expect(()=>normalizeBenBid(value)).toThrow();
  });
  it('counts the first player on the declaring side, doubles and redoubles',()=>{
    expect(benchmarkAuction('N',['1S','PASS','4S','X','XX','PASS','PASS','PASS']))
      .toEqual({complete:true,contract:'4S',declarer:'N',doubled:4});
  });
  it('distinguishes the declarer even when denomination and level agree',()=>{
    expect(benchmarkAuction('E',['1NT','P','3NT','P','P','P']).declarer).toBe('E');
    expect(benchmarkAuction('E',['P','1NT','P','3NT','P','P','P']).declarer).toBe('S');
  });
  it('accepts an all-pass board without inventing a contract',()=>{
    expect(benchmarkAuction('W',['PASS','PASS','PASS','PASS'])).toMatchObject({contract:'passata',declarer:null});
  });
  it.each([
    ['X'],['XX'],['1S','1H'],['1S','P','X'],['1S','X','P','XX'],
    ['P','P','P','P','1C'],['1NT','P'],
  ])('rejects illegal or incomplete auctions: %j',(...bids)=>{
    expect(()=>benchmarkAuction('N',bids)).toThrow();
  });
});
