import {describe,expect,it} from 'vitest';
import {openingScenarios} from '@/data/opening-scenarios';
import {aperturaConsigliata} from './apertura';
import {handHcp} from './deal-generator';
import type {Card,Suit,Rank} from './bridge-engine';
import en from '@/traduzioni/en.json';
const suitBySymbol:Record<string,Suit>={'♠':'spade','♥':'heart','♦':'diamond','♣':'club'};
describe('Dichiara: every rendered scenario follows Fiori 2022',()=>{
  it.each(openingScenarios)('$hand has correct cards, HCP, distribution, answer and translation',s=>{
    const parts=[...s.hand.matchAll(/([♠♥♦♣])\s*([^♠♥♦♣]+)/g)];
    const hand:Card[]=parts.flatMap(([,suit,ranks])=>ranks.trim().replace(/10/g,'T').split('').map(rank=>({suit:suitBySymbol[suit],rank:(rank==='T'?'10':rank) as Rank})));
    expect(hand).toHaveLength(13);
    expect(new Set(hand.map(c=>c.suit+c.rank)).size).toBe(13);
    expect(handHcp(hand)).toBe(s.hcp);
    expect(parts.map(([, ,ranks])=>ranks.trim().replace(/10/g,'T').length).join('-')).toBe(s.distribution);
    expect(s.options.filter(bid=>bid===s.correctBid)).toHaveLength(1);
    if(s.correctBid==='Passo')expect(s.hcp).toBeLessThan(12);
    else expect(aperturaConsigliata(hand)?.bid).toBe(s.correctBid.replace('NT','SA'));
    expect((en as Record<string,string>)[s.explanation],s.explanation).toBeTruthy();
  });
  it('never opens a four-card major in the approved fifth-card-major system',()=>{
    expect(openingScenarios.find(s=>s.distribution==='4-4-3-2'&&s.hcp===13)?.correctBid).toBe('1♣');
  });
});
