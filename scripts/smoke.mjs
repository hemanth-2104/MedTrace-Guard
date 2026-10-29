import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {JsonRpcProvider,Contract} from 'ethers';
import {verifyCertificate} from '../shared/certificate.mjs';

// Read-only integration check. Run npm start first in another terminal.
const base='http://127.0.0.1:5173';
const response=await fetch(base);assert.equal(response.status,200);
assert.match(await response.text(),/<title>MedTrace Guard<\/title>/);
const deployedResponse=await fetch(`${base}/deployment.json`);assert.equal(deployedResponse.status,200);
const deployment=await deployedResponse.json();
assert.equal(deployment.address,JSON.parse(readFileSync('public/deployment.json')).address);
assert.equal(deployment.chainId,31337);
const provider=new JsonRpcProvider('http://127.0.0.1:8545',undefined,{cacheTimeout:-1});
try{
 assert.equal(Number((await provider.getNetwork()).chainId),31337);
 assert.notEqual(await provider.getCode(deployment.address),'0x');
 const c=new Contract(deployment.address,deployment.abi,provider);
 const count=Number(await c.batchCount());assert.ok(count>=3,'Seed the local demo first');
 const batches=[];
 for(let id=1;id<=3;id++){
  const b=await c.getBatch(id);const cert=await fetch(`${base}${b.certificateURI}`);
  assert.equal(cert.status,200);assert.ok(await verifyCertificate(await cert.arrayBuffer(),b.certificateSHA256));
  const total=Number(await c.historyCount(id));assert.ok(total>=1);
  batches.push({id,code:b.code,remainingUnits:String(b.remainingUnits),hold:b.hold,recalled:b.recalled,historyEntries:total,certificate:'MATCH'});
 }
 const output={checkedAt:new Date().toISOString(),website:base,chainId:31337,address:deployment.address,batchCount:count,batches};
 writeFileSync('evidence/live-smoke.json',JSON.stringify(output,null,2)+'\n');
 console.log('PASS: live website, deployment, RPC, contract reads, histories, and all three seeded certificate hashes.');
 console.log(JSON.stringify(output,null,2));
}finally{provider.destroy();}
