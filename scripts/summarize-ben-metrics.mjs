/** Read an exported NDJSON log. Output aggregates only; do not copy raw logs. */
import {createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
const input=process.argv[2]?createReadStream(process.argv[2]):process.stdin;
const groups=new Map();let accepted=0,ignored=0;
for await(const line of createInterface({input,crlfDelay:Infinity})){
 let x;try{x=JSON.parse(line);if(typeof x.message==='string')x=JSON.parse(x.message);}catch{ignored++;continue;}
 if(x.event!=='bridgelab.ben.v1'||!['bid','play','lead','autoplay'].includes(x.route)||!Number.isFinite(x.durationMs)||x.durationMs<0||!Number.isInteger(x.status)||x.status<100||x.status>599){ignored++;continue;}
 const engine=['nn','simulation'].includes(x.engine)?x.engine:'other';
 const key=`${x.route}/${engine}/${x.cache===true?'cache':'upstream'}`;
 const g=groups.get(key)||{requests:0,errors5xx:0,recoveredRetries:0,msSum:0,msMax:0,statuses:{},latencyBuckets:{}};
 g.requests++;g.errors5xx+=Number(x.status>=500);g.recoveredRetries+=Number(x.attempts===2&&x.status<400);
 g.msSum+=x.durationMs;g.msMax=Math.max(g.msMax,x.durationMs);g.statuses[x.status]=(g.statuses[x.status]||0)+1;
 const bucket=[250,500,1000,2500,5000,10000,20000,30000].find(b=>x.durationMs<=b)??'oltre30000';
 g.latencyBuckets[bucket]=(g.latencyBuckets[bucket]||0)+1;groups.set(key,g);accepted++;
}
console.log(JSON.stringify({accepted,ignored,scope:'Only the supplied log export; not a complete production time series',groups:Object.fromEntries([...groups].map(([k,g])=>[k,{...g,meanMs:g.msSum/g.requests}]))},null,2));
