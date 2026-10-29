import {test} from 'node:test';import assert from 'node:assert/strict';import {ProvenanceModel} from '../shared/model.mjs';
const fresh=()=>{const m=new ProvenanceModel();m.register('maker','LOT-1');return m;};
const toPharmacy=m=>{m.propose('maker',1,'distributor');m.accept('distributor',1,1);m.propose('distributor',1,'pharmacy');m.accept('pharmacy',1,2);};
test('MODEL: handoff requires named recipient and correct nonce',()=>{const m=fresh();m.propose('maker',1,'distributor');assert.equal(m.batch(1).custodian,'maker');assert.throws(()=>m.accept('pharmacy',1,1));assert.throws(()=>m.accept('distributor',1,2));m.accept('distributor',1,1);assert.equal(m.batch(1).custodian,'distributor');});
test('MODEL: expired transfer is rejected and can be cancelled',()=>{const m=fresh();m.propose('maker',1,'distributor');m.now+=600;assert.throws(()=>m.accept('distributor',1,1));m.cancel('maker',1);assert.equal(m.batch(1).pending,null);});
test('MODEL: stale handoff cannot be replayed after cancellation',()=>{const m=fresh();m.propose('maker',1,'distributor');m.cancel('distributor',1);m.propose('maker',1,'distributor');assert.throws(()=>m.accept('distributor',1,1));m.accept('distributor',1,2);});
test('MODEL: normal reading cannot clear safety hold',()=>{const m=fresh();m.temperature('maker',1,9);m.temperature('maker',1,5);assert.equal(m.batch(1).hold,true);assert.throws(()=>m.propose('maker',1,'distributor'));assert.throws(()=>m.release('maker',1));m.release('regulator',1);m.propose('maker',1,'distributor');});
test('MODEL: unknown and unauthorized actors rejected',()=>{const m=fresh();assert.throws(()=>m.register('distributor','bad'));assert.throws(()=>m.temperature('stranger',1,11));assert.throws(()=>m.recall('maker',1));assert.throws(()=>m.batch(9));assert.throws(()=>m.register('maker','LOT-1'));});
test('MODEL: recall is terminal and clears pending transfer',()=>{const m=fresh();m.propose('maker',1,'distributor');m.recall('regulator',1);assert.equal(m.batch(1).pending,null);assert.throws(()=>m.accept('distributor',1,1));assert.throws(()=>m.release('regulator',1));});
test('MODEL: expiry blocks transfer and dispensing',()=>{const m=fresh();toPharmacy(m);m.now=m.batch(1).expires;assert.throws(()=>m.dispense('pharmacy',1,1));});
test('MODEL: manufacturer cannot skip distributor',()=>{const m=fresh();assert.throws(()=>m.propose('maker',1,'pharmacy'));});
test('MODEL: revoked recipient role blocks receipt',()=>{const m=fresh();m.propose('maker',1,'distributor');delete m.roles.distributor;assert.throws(()=>m.accept('distributor',1,1));});
test('MODEL: 200 deterministic partial-dispensing traces conserve units',()=>{
 let seed=615;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed;};
 for(let run=0;run<200;run++){const m=fresh();toPharmacy(m);let dispensed=0;
  while(m.batch(1).remaining){const before=m.batch(1).remaining;const n=1+random()%before;m.dispense('pharmacy',1,n);dispensed+=n;assert.equal(m.batch(1).remaining+dispensed,m.batch(1).total);assert.throws(()=>m.dispense('pharmacy',1,before+1));}
  assert.equal(m.batch(1).stage,3);assert.throws(()=>m.dispense('pharmacy',1,1));
 }
});
