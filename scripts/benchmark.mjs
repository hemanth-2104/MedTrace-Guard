import {writeFileSync,mkdirSync} from 'node:fs';
import {setup,register,handoff,rejected,digest} from '../tests/helpers.mjs';
const records=[];const gas=async(label,tx)=>{const receipt=await(await tx).wait();records.push({operation:label,gas:receipt.gasUsed.toString()});};
for(const name of ['MedTraceBaseline','MedTraceGuard']){
 const f=await setup(name);try{
  const m=f.c.connect(f.signers[1]);
  if(name==='MedTraceBaseline'){
   await gas('baseline/register',m.registerBatch(f.now+86400,100,digest));
   await gas('baseline/one_handoff',m.transferCustody(1,f.addresses[2]));
   await gas('baseline/recall',f.c.connect(f.signers[4]).recallBatch(1));
  }else{
   const tx=m.registerBatch('BENCH','Synthetic medicine',f.now-1,f.now+86400,100,20,80,'/certificates/demo-1.json',digest);await gas('guard/register',tx);
   await gas('guard/propose_handoff',m.proposeTransfer(1,f.addresses[2],f.now+1000));
   await gas('guard/accept_handoff',f.c.connect(f.signers[2]).acceptTransfer(1,1));
   await gas('guard/temperature_hold',f.c.connect(f.signers[2]).reportTemperature(1,100,digest));
   await gas('guard/release_hold',f.c.connect(f.signers[4]).releaseHold(1,digest));
   await gas('guard/recall',f.c.connect(f.signers[4]).recallBatch(1,digest));
  }
 }finally{await f.close();}
}
const scenarios=[];
for(const condition of ['expired','recalled'])for(const name of ['MedTraceBaseline','MedTraceGuard']){
 const f=await setup(name);try{
  if(name==='MedTraceBaseline'){
   await f.c.connect(f.signers[1]).registerBatch(f.now+100,100,digest).then(t=>t.wait());await f.c.connect(f.signers[1]).transferCustody(1,f.addresses[2]).then(t=>t.wait());await f.c.connect(f.signers[2]).transferCustody(1,f.addresses[3]).then(t=>t.wait());
  }else{await register(f,{expires:f.now+10000});await handoff(f,1,1,2);await handoff(f,1,2,3);}
  if(condition==='expired'){await f.rpc.request({method:'evm_increaseTime',params:[11000]});await f.rpc.request({method:'evm_mine',params:[]});}
  else await (name==='MedTraceBaseline'?f.c.connect(f.signers[4]).recallBatch(1):f.c.connect(f.signers[4]).recallBatch(1,digest)).then(t=>t.wait());
  let accepted=true;try{await f.c.connect(f.signers[3]).dispense(1,1).then(t=>t.wait());}catch{accepted=false;}
  scenarios.push({contract:name,condition,unsafeDispenseAccepted:accepted});
 }finally{await f.close();}
}
// Growth experiment measures local eth_call latency and registration gas, not public-chain TPS.
const growth=[];const f=await setup();try{
 const m=f.c.connect(f.signers[1]);let lastGas;
 for(let i=1;i<=100;i++){
  const receipt=await(await m.registerBatch(`G-${i}`,'Synthetic medicine',f.now-1,f.now+864000,100,20,80,'/certificates/demo-1.json',digest)).wait();lastGas=receipt.gasUsed.toString();
  if([10,50,100].includes(i)){const measurements=[];for(let trial=0;trial<10;trial++){const start=performance.now();await f.c.getHistory(i,0,20);measurements.push(performance.now()-start);}measurements.sort((a,b)=>a-b);growth.push({batches:i,registrationGas:lastGas,historyCallMedianMs:measurements[5],trials:10});}
 }
}finally{await f.close();}
mkdirSync('evidence',{recursive:true});const output={environment:{node:process.version,network:'Ganache in-process; Shanghai; chain 31337',compiler:'solc 0.8.30; viaIR; optimizer 200',note:'One deterministic run. Baseline has less metadata/history; gas is a design-cost comparison, not an isolated causal ablation. No mainnet USD or public-chain throughput claims.'},gas:records,scenarios,growth};
writeFileSync('evidence/benchmark.json',JSON.stringify(output,null,2));writeFileSync('evidence/gas.csv','operation,gas\n'+records.map(r=>`${r.operation},${r.gas}`).join('\n')+'\n');console.log(output);
