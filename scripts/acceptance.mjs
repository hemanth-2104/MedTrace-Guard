// Destructive local-only acceptance run. Supply a FRESH extracted demo's deployment.json.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {JsonRpcProvider,Contract,ZeroAddress,sha256,toUtf8Bytes} from 'ethers';
const deploymentPath=process.argv[2];
if(!deploymentPath)throw Error('Usage: node scripts/acceptance.mjs /path/to/FRESH/public/deployment.json');
const d=JSON.parse(readFileSync(deploymentPath));assert.equal(d.chainId,31337);
const provider=new JsonRpcProvider('http://127.0.0.1:8545',undefined,{cacheTimeout:-1,batchMaxCount:1});provider.pollingInterval=10;
assert.equal(Number((await provider.getNetwork()).chainId),31337);
const signers=await Promise.all(Array.from({length:8},(_,i)=>provider.getSigner(i)));
const addresses=await Promise.all(signers.map(s=>s.getAddress()));
const c=new Contract(d.address,d.abi,signers[0]);assert.equal(await c.batchCount(),3n,'Use a fresh seeded deployment; this run writes synthetic test records.');
const by=i=>c.connect(signers[i]),hash=sha256(toUtf8Bytes('Acceptance synthetic certificate\n'));
const output={network:'Ganache local',chainId:31337,address:d.address,startedAt:new Date().toISOString(),checks:[],expectedRejections:[]};
const save=()=>{mkdirSync('evidence/acceptance-2026-10-25',{recursive:true});writeFileSync('evidence/acceptance-2026-10-25/contract-checks.json',JSON.stringify(output,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');};
let sequence=0;
async function now(){return Number((await provider.getBlock('latest')).timestamp);}
async function tx(p){const receipt=await(await p).wait();assert.equal(receipt.status,1);return receipt;}
async function check(id,fn){try{const detail=await fn();output.checks.push({id,status:'PASS',detail:detail??'Assertions passed'});console.log('PASS',id);}catch(e){output.checks.push({id,status:'FAIL',error:e.stack??e.message});console.error('FAIL',id,e.message);}save();}
async function reject(id,contract,fn,args,expected){
 let error;
 try{await contract[fn].staticCall(...args);}catch(e){error=e;}
 assert.ok(error,`${fn} unexpectedly succeeded`);
 let name;try{name=c.interface.parseError(error.data)?.name;}catch{}
 if(expected==='ENCODING')assert.ok(['INVALID_ARGUMENT','NUMERIC_FAULT'].includes(error.code));else assert.equal(name,expected);
 let receipt;
 if(expected!=='ENCODING'){
  const sent=await contract[fn](...args,{gasLimit:1_000_000});
  try{await sent.wait();assert.fail('Expected mined revert');}catch(e){assert.equal(e.receipt?.status,0);receipt={transactionHash:sent.hash,status:e.receipt.status};}
 }
 output.expectedRejections.push({id,operation:fn,args,expected,errorName:name??error.code,error:error.shortMessage??error.message,...receipt});
}
async function register(options={}){
 const timestamp=await now();const params=[options.code??`ACC-${++sequence}`,options.drug??'Acceptance synthetic medicine',options.made??timestamp-100,options.expiry??timestamp+86400,100,20,80,options.uri??'/certificates/demo-3.json',options.hash??hash];
 await tx(by(1).registerBatch(...params));return Number(await c.batchCount());
}
async function handoff(id,from,to){await tx(by(from).proposeTransfer(id,addresses[to],await now()+600));const p=await c.pending(id);await tx(by(to).acceptTransfer(id,p.nonce));}
const get=async id=>Array.from(await c.getBatch(id));
let main,metadata;
try{
 await check('B1',async()=>{const n=await c.batchCount(),t=await now();metadata={code:'ACC-PRIMARY',drug:'Acceptance medicine',made:t-100,expiry:t+86400,uri:'/certificates/demo-3.json'};main=await register(metadata);assert.equal(await c.batchCount(),n+1n);const b=await c.getBatch(main);assert.equal(b.custodian,addresses[1]);assert.equal(b.totalUnits,100n);assert.equal(b.remainingUnits,100n);return{batchId:main};});
 await check('B3',async()=>{const count=await c.batchCount();await reject('B3',by(1),'registerBatch',[metadata.code,metadata.drug,metadata.made,metadata.expiry,100,20,80,metadata.uri,hash],'DuplicateBatch');assert.equal(await c.batchCount(),count);});
 await check('B4',async()=>{const t=await now();for(const actor of[2,3,5])await reject('B4',by(actor),'registerBatch',[`DENIED-${actor}`,'D',t-1,t+600,100,20,80,'/certificates/demo-3.json',hash],'Denied');});
 await check('B5',async()=>{const t=await now(),valid=['INVALID','D',t-1,t+600,100,20,80,'/certificates/demo-3.json',hash];for(const [index,value]of[[0,''],[1,''],[7,''],[4,0],[2,t+100],[3,t-1],[5,80],[5,90]]){const args=[...valid];args[index]=value;await reject('B5',by(1),'registerBatch',args,'InvalidInput');}});
 await check('B6',async()=>{const b=await c.getBatch(main);assert.equal(b.code,metadata.code);assert.equal(b.drug,metadata.drug);assert.equal(b.manufacturedAt,BigInt(metadata.made));assert.equal(b.expiresAt,BigInt(metadata.expiry));assert.equal(b.totalUnits,100n);assert.equal(b.minTemp,20n);assert.equal(b.maxTemp,80n);assert.equal(b.certificateURI,metadata.uri);assert.equal(b.certificateSHA256,hash);});
 await check('C1',async()=>{await tx(by(1).proposeTransfer(main,addresses[2],await now()+600));assert.equal((await c.getBatch(main)).custodian,addresses[1]);assert.equal((await c.pending(main)).recipient,addresses[2]);});
 await check('C5',async()=>{const id=await register();await reject('C5',by(1),'proposeTransfer',[id,addresses[3],await now()+600],'InvalidTransfer');});
 await check('C6',async()=>{await reject('C6',by(3),'acceptTransfer',[main,1],'InvalidTransfer');});
 await check('C7',async()=>{await reject('C7',by(2),'acceptTransfer',[main,999],'InvalidTransfer');});
 await check('C8',async()=>{await reject('C8',by(1),'proposeTransfer',[main,addresses[2],await now()+600],'InvalidTransfer');});
 await check('C2',async()=>{await tx(by(2).acceptTransfer(main,1));assert.equal((await c.getBatch(main)).custodian,addresses[2]);assert.equal((await c.pending(main)).recipient,ZeroAddress);await reject('C7',by(2),'acceptTransfer',[main,1],'InvalidTransfer');});
 await check('C3',async()=>{await tx(by(2).proposeTransfer(main,addresses[3],await now()+600));assert.equal((await c.getBatch(main)).custodian,addresses[2]);});
 await check('C4',async()=>{await tx(by(3).acceptTransfer(main,2));const b=await c.getBatch(main);assert.equal(b.custodian,addresses[3]);assert.equal(b.stage,2n);});
 let cancelled;
 await check('C9',async()=>{cancelled=await register();await tx(by(1).proposeTransfer(cancelled,addresses[2],await now()+600));await tx(by(2).cancelTransfer(cancelled));assert.equal((await c.pending(cancelled)).recipient,ZeroAddress);assert.equal((await c.getBatch(cancelled)).custodian,addresses[1]);await tx(by(1).proposeTransfer(cancelled,addresses[2],await now()+600));await tx(by(1).cancelTransfer(cancelled));assert.equal((await c.pending(cancelled)).recipient,ZeroAddress);assert.equal((await c.getBatch(cancelled)).custodian,addresses[1]);});
 await check('C10',async()=>{await reject('C10',by(2),'acceptTransfer',[cancelled,2],'InvalidTransfer');await tx(by(1).proposeTransfer(cancelled,addresses[2],await now()+5));await provider.send('evm_increaseTime',[6]);await provider.send('evm_mine',[]);await reject('C10',by(2),'acceptTransfer',[cancelled,3],'InvalidTransfer');});
 let thermal=await register();await handoff(thermal,1,2);await handoff(thermal,2,3);
 await check('D1',async()=>{const n=await c.historyCount(thermal);await tx(by(3).reportTemperature(thermal,50,hash));assert.equal(await c.historyCount(thermal),n+1n);assert.equal((await c.getBatch(thermal)).hold,false);assert.equal((await c.eligibility(thermal))[0],true);});
 await check('D2',async()=>{for(const value of[20,80]){await tx(by(3).reportTemperature(thermal,value,hash));assert.equal((await c.getBatch(thermal)).hold,false);}});
 await check('D3',async()=>{for(const value of[115,10]){await tx(by(3).reportTemperature(thermal,value,hash));assert.equal((await c.getBatch(thermal)).hold,true);await tx(by(4).releaseHold(thermal,hash));}await tx(by(3).reportTemperature(thermal,115,hash));});
 await check('D5',async()=>{const before=await get(thermal);await reject('D5',by(3),'dispense',[thermal,1],'Blocked');assert.deepEqual(await get(thermal),before);});
 await check('D6',async()=>{const n=await c.historyCount(thermal);await tx(by(3).reportTemperature(thermal,50,hash));assert.equal((await c.getBatch(thermal)).hold,true);assert.equal(await c.historyCount(thermal),n+1n);});
 await check('D7',async()=>{for(const actor of[1,2,3])await reject('D7',by(actor),'releaseHold',[thermal,hash],'Denied');});
 await check('D8',async()=>{await tx(by(4).releaseHold(thermal,hash));assert.equal((await c.getBatch(thermal)).hold,false);await tx(by(3).dispense(thermal,1));});
 await check('D9',async()=>{for(const actor of[1,2,5])await reject('D9',by(actor),'reportTemperature',[thermal,50,hash],'Denied');await tx(by(4).reportTemperature(thermal,50,hash));});
 await check('D4',async()=>{const id=await register();await tx(by(1).proposeTransfer(id,addresses[2],await now()+600));await tx(by(1).reportTemperature(id,115,hash));await reject('D4',by(2),'acceptTransfer',[id,1],'Blocked');await reject('D4',by(1),'proposeTransfer',[id,addresses[2],await now()+600],'Blocked');});
 let recalled=await register();await tx(by(1).proposeTransfer(recalled,addresses[2],await now()+600));
 await check('E4',async()=>{for(const actor of[1,2,3,5])await reject('E4',by(actor),'recallBatch',[recalled,hash],'Denied');});
 await check('E1',async()=>{const n=await c.historyCount(recalled);await tx(by(4).recallBatch(recalled,hash));assert.equal((await c.getBatch(recalled)).recalled,true);assert.equal(await c.historyCount(recalled),n+1n);const h=await c.getHistory(recalled,0,100);assert.equal(h.at(-1).kind,7n);});
 await check('E2',async()=>{assert.equal((await c.pending(recalled)).recipient,ZeroAddress);await reject('E2',by(2),'acceptTransfer',[recalled,1],'Blocked');});
 await check('E3',async()=>{await reject('E3',by(1),'proposeTransfer',[recalled,addresses[2],await now()+600],'Blocked');await tx(by(3).reportTemperature(thermal,115,hash));await tx(by(4).recallBatch(thermal,hash));await reject('E3',by(3),'dispense',[thermal,1],'Blocked');});
 await check('E5',async()=>{await reject('E5',by(4),'releaseHold',[thermal,hash],'InvalidInput');assert.equal((await c.getBatch(thermal)).recalled,true);});
 let expMade,expPending,expPharm;
 const expiry=await now()+100;
 expMade=await register({expiry});expPending=await register({expiry});expPharm=await register({expiry});
 await tx(by(1).proposeTransfer(expPending,addresses[2],await now()+50));
 // Move the third expiring batch without the generic 600-second deadline.
 for(const[from,to]of[[1,2],[2,3]]){await tx(by(from).proposeTransfer(expPharm,addresses[to],await now()+50));await tx(by(to).acceptTransfer(expPharm,(await c.pending(expPharm)).nonce));}
 await tx(by(3).reportTemperature(expPharm,115,hash));await provider.send('evm_increaseTime',[110]);await provider.send('evm_mine',[]);
 await check('E7',async()=>{await reject('E7',by(1),'proposeTransfer',[expMade,addresses[2],await now()+60],'Blocked');await reject('E7',by(2),'acceptTransfer',[expPending,1],'Blocked');await reject('E7',by(3),'dispense',[expPharm,1],'Blocked');});
 await check('E8',async()=>{await tx(by(4).releaseHold(expPharm,hash));assert.equal((await c.getBatch(expPharm)).hold,false);assert.deepEqual(Array.from(await c.eligibility(expPharm)),[false,2n]);await reject('E8',by(3),'dispense',[expPharm,1],'Blocked');});
 await check('F1',async()=>{await tx(by(3).dispense(main,20));assert.equal((await c.getBatch(main)).remainingUnits,80n);});
 await check('F2',async()=>{await tx(by(3).dispense(main,30));assert.equal((await c.getBatch(main)).remainingUnits,50n);const h=await c.getHistory(main,0,100);assert.deepEqual(h.filter(e=>e.kind===4n).map(e=>e.units),[20n,30n]);});
 await check('F3',async()=>{const before=await get(main);for(const n of[0,51])await reject('F3',by(3),'dispense',[main,n],'InvalidInput');for(const n of[-1,0.5])await reject('F3',by(3),'dispense',[main,n],'ENCODING');assert.deepEqual(await get(main),before);});
 await check('F4',async()=>{for(const actor of[1,2,5])await reject('F4',by(actor),'dispense',[main,1],'Denied');await tx(c.assignRole(addresses[6],3));await reject('F4',by(6),'dispense',[main,1],'Denied');await tx(c.assignRole(addresses[6],0));});
 await check('F5',async()=>{await tx(by(3).dispense(main,50));const b=await c.getBatch(main);assert.equal(b.remainingUnits,0n);assert.equal(b.stage,3n);});
 await check('F6',async()=>{await reject('F6',by(3),'dispense',[main,1],'Blocked');await reject('F6',by(3),'proposeTransfer',[main,addresses[2],await now()+600],'Blocked');});
 await check('H1',async()=>{await tx(c.assignRole(addresses[5],1));assert.equal(await c.roleOf(addresses[5]),1n);});
 await check('H2',async()=>{await reject('H2',by(1),'assignRole',[addresses[6],4],'Denied');});
 await check('H3',async()=>{await tx(c.assignRole(addresses[5],0));assert.equal(await c.roleOf(addresses[5]),0n);const t=await now();await reject('H3',by(5),'registerBatch',['REVOKED','D',t-1,t+600,100,20,80,'/certificates/demo-3.json',hash],'Denied');});
 await check('H4',async()=>{for(const actor of[1,2]){const id=await register();await tx(by(1).proposeTransfer(id,addresses[2],await now()+600));await tx(c.assignRole(addresses[actor],0));await reject('H4',by(2),'acceptTransfer',[id,1],'InvalidTransfer');await tx(c.assignRole(addresses[actor],actor));}});
 await check('I10',async()=>{const h=await c.getHistory(main,0,100);assert.deepEqual(h.map(e=>e.kind),[0n,1n,2n,1n,2n,4n,4n,4n]);assert.deepEqual(h.map(e=>e.actor),[addresses[1],addresses[1],addresses[2],addresses[2],addresses[3],addresses[3],addresses[3],addresses[3]]);assert.equal(h[1].counterparty,addresses[2]);assert.equal(h[2].counterparty,addresses[1]);assert.equal(h[3].counterparty,addresses[3]);assert.equal(h[4].counterparty,addresses[2]);assert.deepEqual(h.slice(5).map(e=>e.units),[20n,30n,50n]);});
 // Browser fixtures: unavailable certificate, an expired lookup, and enough entries for both pagers.
 const certBytes=readFileSync('public/certificates/demo-3.json');
 const browser=await register({code:'ACC-BROWSER',uri:'/certificates/demo-3.json',hash:sha256(certBytes)});
 const missing=await register({code:'ACC-MISSING-CERT',uri:'/certificates/does-not-exist.json',hash:sha256(certBytes)});
 for(let i=0;i<25;i++)await tx(by(1).reportTemperature(browser,50,hash));
 while(await c.batchCount()<17n)await register();
 output.browserFixtures={main,thermal,recalled,expired:expMade,browser,missing,addresses};
 await check('H5',async()=>{await tx(c.proposeAdmin(addresses[5]));assert.equal(await c.admin(),addresses[0]);assert.equal(await c.pendingAdmin(),addresses[5]);await tx(c.assignRole(addresses[6],0));});
 await check('H6',async()=>{await reject('H6',by(6),'acceptAdmin',[],'Denied');});
 await check('H7',async()=>{await tx(by(5).acceptAdmin());assert.equal(await c.admin(),addresses[5]);await reject('H7',c,'assignRole',[addresses[6],4],'Denied');await tx(by(5).assignRole(addresses[6],4));assert.equal(await c.roleOf(addresses[6]),4n);});
 output.finishedAt=new Date().toISOString();save();
 console.log('Acceptance contract IDs:',output.checks.length,'passed:',output.checks.filter(x=>x.status==='PASS').length,'failed:',output.checks.filter(x=>x.status==='FAIL').length);
 process.exitCode=output.checks.some(x=>x.status==='FAIL')?1:0;
}finally{provider.destroy();save();}
