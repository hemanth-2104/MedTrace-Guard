import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ZeroAddress,ZeroHash} from 'ethers';
import {setup,register,handoff,rejected,digest} from './helpers.mjs';
async function withFixture(fn){const f=await setup();try{await fn(f);}finally{await f.close();}}
test('registration: unique code per manufacturer; immutable metadata and event',()=>withFixture(async f=>{
 const id=await register(f);const b=await f.c.getBatch(id);assert.equal(b.custodian,f.addresses[1]);assert.equal(b.certificateSHA256,digest);assert.equal(b.remainingUnits,100n);assert.equal(await f.c.historyCount(id),1n);
 await rejected(register(f));await rejected(f.c.getBatch(0));await rejected(f.c.getBatch(99));
 await rejected(f.c.connect(f.signers[2]).registerBatch('X','D',f.now-10,f.now+1000,1,20,80,'x',digest));
 for(const [expiry,units,min,max,hash] of [[f.now-1,10,20,80,digest],[f.now+10,0,20,80,digest],[f.now+10,1,80,20,digest],[f.now+10,1,20,80,ZeroHash]]){
  await rejected(f.c.connect(f.signers[1]).registerBatch('X','D',f.now-10,expiry,units,min,max,'x',hash));
 }
}));
test('administrator authorization and two-step succession',()=>withFixture(async f=>{
 await rejected(f.c.connect(f.signers[1]).assignRole(f.addresses[5],4));await rejected(f.c.assignRole(ZeroAddress,1));
 await f.c.proposeAdmin(f.addresses[5]).then(t=>t.wait());await rejected(f.c.connect(f.signers[6]).acceptAdmin());
 await f.c.connect(f.signers[5]).acceptAdmin().then(t=>t.wait());assert.equal(await f.c.admin(),f.addresses[5]);
 await rejected(f.c.assignRole(f.addresses[6],1));await f.c.connect(f.signers[5]).assignRole(f.addresses[6],1).then(t=>t.wait());
}));
test('two-party handoff: proposer cannot assign custody or skip distributor',()=>withFixture(async f=>{
 const id=await register(f);const m=f.c.connect(f.signers[1]);
 await rejected(m.proposeTransfer(id,f.addresses[3],f.now+500));await rejected(m.proposeTransfer(id,f.addresses[2],f.now));
 await rejected(m.proposeTransfer(id,f.addresses[2],f.now+8*86400));await rejected(f.c.connect(f.signers[2]).proposeTransfer(id,f.addresses[3],f.now+500));
 await m.proposeTransfer(id,f.addresses[2],f.now+500).then(t=>t.wait());assert.equal((await f.c.getBatch(id)).custodian,f.addresses[1]);
 await rejected(m.proposeTransfer(id,f.addresses[2],f.now+500));await rejected(f.c.connect(f.signers[3]).acceptTransfer(id,1));
 await rejected(f.c.connect(f.signers[2]).acceptTransfer(id,2));await f.c.connect(f.signers[2]).acceptTransfer(id,1).then(t=>t.wait());
 assert.equal((await f.c.getBatch(id)).custodian,f.addresses[2]);await rejected(f.c.connect(f.signers[2]).acceptTransfer(id,1));
}));
test('cancellation invalidates stale nonce; recipient rejection and timeout',()=>withFixture(async f=>{
 const id=await register(f),m=f.c.connect(f.signers[1]),d=f.c.connect(f.signers[2]);
 await m.proposeTransfer(id,f.addresses[2],f.now+500).then(t=>t.wait());await rejected(f.c.connect(f.signers[5]).cancelTransfer(id));
 await d.cancelTransfer(id).then(t=>t.wait());await m.proposeTransfer(id,f.addresses[2],f.now+500).then(t=>t.wait());
 await rejected(d.acceptTransfer(id,1));await f.rpc.request({method:'evm_increaseTime',params:[500]});await f.rpc.request({method:'evm_mine',params:[]});
 await rejected(d.acceptTransfer(id,2));await m.cancelTransfer(id).then(t=>t.wait());assert.equal((await f.c.pending(id)).recipient,ZeroAddress);
}));
test('role revoked after proposal blocks acceptance',()=>withFixture(async f=>{
 const id=await register(f);await f.c.connect(f.signers[1]).proposeTransfer(id,f.addresses[2],f.now+500).then(t=>t.wait());
 await f.c.assignRole(f.addresses[2],0).then(t=>t.wait());await rejected(f.c.connect(f.signers[2]).acceptTransfer(id,1));
}));
test('quantity conservation over partial dispensing; terminal state cannot move',()=>withFixture(async f=>{
 const id=await register(f);await handoff(f,id,1,2);await handoff(f,id,2,3);const p=f.c.connect(f.signers[3]);
 await rejected(f.c.connect(f.signers[2]).dispense(id,1));await rejected(p.dispense(id,0));await rejected(p.dispense(id,101));
 let dispensed=0n;for(const units of [7,19,1,33,40]){await p.dispense(id,units).then(t=>t.wait());dispensed+=BigInt(units);const b=await f.c.getBatch(id);assert.equal(b.remainingUnits+dispensed,b.totalUnits);}
 assert.equal((await f.c.getBatch(id)).stage,3n);assert.deepEqual(Array.from(await f.c.eligibility(id)),[false,4n]);await rejected(p.dispense(id,1));await rejected(p.proposeTransfer(id,f.addresses[2],f.now+500));
}));
test('temperature hold persists after normal reading; regulator review required',()=>withFixture(async f=>{
 const id=await register(f),m=f.c.connect(f.signers[1]),r=f.c.connect(f.signers[4]);
 await rejected(f.c.connect(f.signers[5]).reportTemperature(id,100,digest));await m.reportTemperature(id,80,digest).then(t=>t.wait());assert.equal((await f.c.getBatch(id)).hold,false);
 await m.proposeTransfer(id,f.addresses[2],f.now+500).then(t=>t.wait());await m.reportTemperature(id,81,digest).then(t=>t.wait());
 assert.equal((await f.c.getBatch(id)).hold,true);await rejected(f.c.connect(f.signers[2]).acceptTransfer(id,1));
 await m.reportTemperature(id,50,digest).then(t=>t.wait());assert.equal((await f.c.getBatch(id)).hold,true);await rejected(m.releaseHold(id,digest));await rejected(r.releaseHold(id,ZeroHash));
 await r.releaseHold(id,digest).then(t=>t.wait());await f.c.connect(f.signers[2]).acceptTransfer(id,1).then(t=>t.wait());
}));
test('recall cancels pending handoff and permanently blocks distribution',()=>withFixture(async f=>{
 const id=await register(f),m=f.c.connect(f.signers[1]),r=f.c.connect(f.signers[4]);
 await m.proposeTransfer(id,f.addresses[2],f.now+500).then(t=>t.wait());await rejected(m.recallBatch(id,digest));await r.recallBatch(id,digest).then(t=>t.wait());
 assert.equal((await f.c.pending(id)).recipient,ZeroAddress);assert.deepEqual(Array.from(await f.c.eligibility(id)),[false,1n]);await rejected(m.proposeTransfer(id,f.addresses[2],f.now+500));await rejected(r.releaseHold(id,digest));await rejected(r.recallBatch(id,digest));
}));
test('recall blocks dispensing after pharmacy receipt',()=>withFixture(async f=>{
 const id=await register(f);await handoff(f,id,1,2);await handoff(f,id,2,3);await f.c.connect(f.signers[4]).recallBatch(id,digest).then(t=>t.wait());await rejected(f.c.connect(f.signers[3]).dispense(id,1));
}));
test('expiry blocks proposals, pending receipt, and dispensing',()=>withFixture(async f=>{
 const id=await register(f,{expires:f.now+100});const id2=await register(f,{code:'LOT-2',expires:f.now+100});
 await f.c.connect(f.signers[1]).proposeTransfer(id,f.addresses[2],f.now+90).then(t=>t.wait());await handoffShort(f,id2,1,2);await handoffShort(f,id2,2,3);
 await f.rpc.request({method:'evm_increaseTime',params:[110]});await f.rpc.request({method:'evm_mine',params:[]});
 await rejected(f.c.connect(f.signers[2]).acceptTransfer(id,1));await rejected(f.c.connect(f.signers[1]).proposeTransfer(id,f.addresses[2],f.now+200));await rejected(f.c.connect(f.signers[3]).dispense(id2,1));assert.deepEqual(Array.from(await f.c.eligibility(id2)),[false,2n]);
}));
async function handoffShort(f,id,from,to){await f.c.connect(f.signers[from]).proposeTransfer(id,f.addresses[to],f.now+90).then(t=>t.wait());const req=await f.c.pending(id);await f.c.connect(f.signers[to]).acceptTransfer(id,req.nonce).then(t=>t.wait());}
test('paged history preserves ordering and bounds',()=>withFixture(async f=>{
 const id=await register(f);await handoff(f,id,1,2);const a=await f.c.getHistory(id,0,2),b=await f.c.getHistory(id,2,2);assert.equal(a.length,2);assert.equal(b.length,1);assert.equal(a[0].kind,0n);assert.equal(b[0].kind,2n);
 assert.equal((await f.c.getHistory(id,100,10)).length,0);await rejected(f.c.getHistory(id,0,101));await rejected(f.c.getHistory(id,0,0));
}));

// Cover every transfer entry point, rather than infer one safety gate from another.
for(const condition of ['held','recalled','expired']){
 test(`${condition} batches reject both proposal routes, both receipts, and dispensing on the EVM`,()=>withFixture(async f=>{
  const ids=[];
  for(let i=0;i<5;i++)ids.push(await register(f,{code:`${condition}-${i}`,expires:f.now+3600}));
  const maker=f.c.connect(f.signers[1]),distributor=f.c.connect(f.signers[2]);
  const pharmacy=f.c.connect(f.signers[3]),regulator=f.c.connect(f.signers[4]);
  await maker.proposeTransfer(ids[1],f.addresses[2],f.now+900).then(t=>t.wait());
  for(const id of ids.slice(2))await handoff(f,id,1,2);
  await distributor.proposeTransfer(ids[3],f.addresses[3],f.now+900).then(t=>t.wait());
  await handoff(f,ids[4],2,3);
  const calls=[
   [maker,'proposeTransfer',[ids[0],f.addresses[2],f.now+900]],
   [distributor,'acceptTransfer',[ids[1],1]],
   [distributor,'proposeTransfer',[ids[2],f.addresses[3],f.now+900]],
   [pharmacy,'acceptTransfer',[ids[3],2]],
   [pharmacy,'dispense',[ids[4],1]]
  ];
  // Establish that roles, route, nonce, quantities, and deadlines are valid first.
  for(const [c,fn,args] of calls)await c[fn].staticCall(...args);
  if(condition==='expired'){
   await f.rpc.request({method:'evm_increaseTime',params:[4000]});
   await f.rpc.request({method:'evm_mine',params:[]});
  }else for(const id of ids){
   await (condition==='held'?regulator.reportTemperature(id,115,digest):regulator.recallBatch(id,digest)).then(t=>t.wait());
  }
  const reason={held:3n,recalled:1n,expired:2n}[condition];
  for(const id of ids)assert.deepEqual(Array.from(await f.c.eligibility(id)),[false,reason]);
  const snapshots=await Promise.all(ids.map(async id=>({batch:Array.from(await f.c.getBatch(id)),history:await f.c.historyCount(id),pending:Array.from(await f.c.pending(id))})));
  for(const [c,fn,args] of calls){
   await assert.rejects(c[fn].staticCall(...args),e=>{
    try{return f.c.interface.parseError(e.data)?.name==='Blocked';}catch{return false;}
   });
   // Force submission so the check proves an actual mined revert, not only an estimate failure.
   const tx=await c[fn](...args,{gasLimit:1_000_000});
   await assert.rejects(tx.wait(),e=>e.receipt?.status===0);
  }
  for(let i=0;i<ids.length;i++){
   assert.deepEqual(Array.from(await f.c.getBatch(ids[i])),snapshots[i].batch);
   assert.equal(await f.c.historyCount(ids[i]),snapshots[i].history);
   assert.deepEqual(Array.from(await f.c.pending(ids[i])),snapshots[i].pending);
  }
 }));
}
