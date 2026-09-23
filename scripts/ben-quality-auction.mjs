/** Strict benchmark parser: an invalid/missing bid must never become PASS. */
const SEATS=['N','E','S','W'];
export function normalizeBenBid(raw) {
  if(typeof raw!=='string')throw Error('BEN response without a bid');
  const bid=raw.trim().toUpperCase().replace(/NT$/,'N');
  if(['P','PASS','--'].includes(bid))return 'PASS';
  if(['X','DBL','DB'].includes(bid))return 'X';
  if(['XX','RDBL','RD'].includes(bid))return 'XX';
  if(/^[1-7][CDHSN]$/.test(bid))return bid;
  throw Error('BEN response with invalid bid syntax');
}
export function benchmarkAuction(dealer, rawBids, requireComplete=true) {
  const offset=SEATS.indexOf(dealer);
  if(offset<0||!Array.isArray(rawBids))throw Error('Invalid auction');
  const bids=rawBids.map(normalizeBenBid);
  let last=null,doubled=1,passes=0,complete=false;
  for(const [i,bid] of bids.entries()){
    if(complete)throw Error('Bid after completed auction');
    const seat=(offset+i)%4;
    if(bid==='PASS')passes++;
    else {
      passes=0;
      if(bid==='X'){
        if(!last||doubled!==1||last.seat%2===seat%2)throw Error('Illegal double');
        doubled=2;
      }else if(bid==='XX'){
        if(!last||doubled!==2||last.seat%2!==seat%2)throw Error('Illegal redouble');
        doubled=4;
      }else {
        const rank=5*(Number(bid[0])-1)+'CDHSN'.indexOf(bid[1]);
        if(last&&rank<=last.rank)throw Error('Insufficient bid');
        last={bid,seat,rank,index:i};doubled=1;
      }
    }
    complete=last?passes===3:passes===4;
  }
  if(requireComplete&&!complete)throw Error('Incomplete auction');
  if(!last)return {complete,contract:'passata',declarer:null,doubled:1};
  const first=bids.findIndex((bid,i)=>/^[1-7]/.test(bid)&&bid[1]===last.bid[1]&&(offset+i)%2===last.seat%2);
  return {complete,contract:last.bid.replace(/N$/,'NT'),declarer:SEATS[(offset+first)%4],doubled};
}
