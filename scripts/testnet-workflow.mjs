import {readFileSync} from 'node:fs';
import {sha256} from 'ethers';
import {ROLE_NAMES,configFromEnv,makeProvider,preflight,signersFor,newEvidenceRun,loadManifest,checkedContract,recordTransaction,json,safeFailure,isMain} from './testnet-lib.mjs';

export function certificateFromEnv(env=process.env){
  const uri=env.AMOY_CERTIFICATE_URI;
  if(!uri || !/^ipfs:\/\/(?:Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{20,120})$/.test(uri)||uri.length>200){throw new Error('Set AMOY_CERTIFICATE_URI to the real uploaded ipfs://CID without a subpath.');}
  if(!env.AMOY_CERTIFICATE_FILE){throw new Error('Set AMOY_CERTIFICATE_FILE to the exact certificate bytes uploaded to IPFS.');}
  let bytes;try{bytes=readFileSync(env.AMOY_CERTIFICATE_FILE);}catch{throw new Error('Cannot read AMOY_CERTIFICATE_FILE.');}
  if(!bytes.length){throw new Error('Certificate file must not be empty.');}
  return {uri,digest:sha256(bytes),byteLength:bytes.length};
}
async function assignParticipantRoles(contract,signers,send){
  // Role transactions share the administrator nonce and must be mined in order.
  for(const [index,name] of ROLE_NAMES.entries()){
    if(index && Number(await contract.roleOf(signers[name].address))!==index){
      await send(`role-${name}`,()=>contract.assignRole(signers[name].address,index));
    }
  }
}
export async function runWorkflow(provider,config,deployment,certificate,directory){
  json(`${directory}/preflight.json`,await preflight(provider,config));
  const signers=signersFor(config,provider);const contract=await checkedContract(provider,deployment,signers.admin);
  if((await contract.admin()).toLowerCase()!==signers.admin.address.toLowerCase()){throw new Error('Configured admin does not administer this deployment.');}
  const send=(label,fn,expectedStatus=1)=>recordTransaction(label,fn,{directory,confirmations:config.confirmations,expectedStatus});
  await assignParticipantRoles(contract,signers,send);
  const maker=contract.connect(signers.manufacturer),distributor=contract.connect(signers.distributor),pharmacy=contract.connect(signers.pharmacy);
  const block=await provider.getBlock('latest');const now=block.timestamp;
  const code=`AMOY-${Date.now()}`;
  const registered=await send('register-batch',()=>maker.registerBatch(code,'Synthetic testnet medicine',now-60,now+30*86400,100,20,80,certificate.uri,certificate.digest));
  const event=registered.receipt.logs.map(log=>{try{return contract.interface.parseLog(log);}catch{return null;}}).find(event=>event?.name==='Recorded'&&Number(event.args.kind)===0);
  if(!event){throw new Error('Registration receipt has no Registered event.');}
  const batchId=event.args.batchId;
  json(`${directory}/batch.json`,{chainId:80002,contract:deployment.address,batchId,code,certificate});
  for(const [label,from,to] of [['manufacturer-distributor',maker,signers.distributor],['distributor-pharmacy',distributor,signers.pharmacy]]){
    const deadline=Number((await provider.getBlock('latest')).timestamp)+3600;
    await send(`${label}-propose`,()=>from.proposeTransfer(batchId,to.address,deadline));
    const proposal=await contract.pending(batchId);
    const before=await contract.getBatch(batchId);
    if(before.custodian.toLowerCase()===to.address.toLowerCase()){throw new Error('Proposal unexpectedly changed custody before receipt.');}
    await send(`${label}-accept`,()=>contract.connect(to).acceptTransfer(batchId,proposal.nonce));
    if((await contract.getBatch(batchId)).custodian.toLowerCase()!==to.address.toLowerCase()){throw new Error('Recipient acceptance did not change custody.');}
  }
  await send('unsafe-temperature-report',()=>pharmacy.reportTemperature(batchId,115,sha256(new TextEncoder().encode('Testnet simulation: 11.5 C. Not an independent sensor reading.'))));
  const before=await contract.getBatch(batchId);const historyBefore=await contract.historyCount(batchId);
  // First check the intended Solidity error. Then force a mined revert to preserve public evidence.
  let blocked=false;
  try{await pharmacy.dispense.staticCall(batchId,1);}catch(error){try{blocked=contract.interface.parseError(error.data)?.name==='Blocked';}catch{}}
  if(!blocked){throw new Error('Unsafe dispense did not return the expected Blocked error.');}
  await send('unsafe-dispense-rejected',()=>pharmacy.dispense(batchId,1,{gasLimit:180000}),0);
  const after=await contract.getBatch(batchId);const eligibility=await contract.eligibility(batchId);
  if(after.remainingUnits!==before.remainingUnits||await contract.historyCount(batchId)!==historyBefore||eligibility[0]||Number(eligibility[1])!==3){throw new Error('Unsafe rejection did not preserve quantity/history and hold state.');}
  // A separate provider-only contract proves these reads do not require a wallet.
  const read=await checkedContract(provider,deployment);
  const snapshot=await readSnapshot(read,batchId);
  const summary={chainId:80002,contract:deployment.address,batchId,certificate,completedAt:new Date().toISOString(),walletFreeRead:snapshot,unsafeRejection:{type:'mined-revert',expectedError:'Blocked',quantityUnchanged:true,historyUnchanged:true},evidenceDirectory:directory};
  json(`${directory}/workflow.json`,summary);return summary;
}
export async function readSnapshot(contract,batchId){
  const b=await contract.getBatch(batchId);const [eligible,reason]=await contract.eligibility(batchId);
  const count=Number(await contract.historyCount(batchId));const history=[];
  for(let offset=0;offset<count;offset+=100){for(const e of await contract.getHistory(batchId,offset,100)){history.push({kind:Number(e.kind),actor:e.actor,counterparty:e.counterparty,timestamp:e.timestamp,evidence:e.evidence,value:e.value,units:e.units});}}
  return {batch:{code:b.code,drug:b.drug,certificateURI:b.certificateURI,certificateSHA256:b.certificateSHA256,manufacturer:b.manufacturer,custodian:b.custodian,stage:Number(b.stage),totalUnits:b.totalUnits,remainingUnits:b.remainingUnits,recalled:b.recalled,hold:b.hold,expiresAt:b.expiresAt},eligibility:{eligible,reason:Number(reason)},historyCount:count,history};
}
if(isMain(import.meta.url)){
  let provider;
  try{
    const config=configFromEnv();const certificate=certificateFromEnv();const deployment=loadManifest();provider=makeProvider(config);
    const summary=await runWorkflow(provider,config,deployment,certificate,newEvidenceRun('workflow'));
    console.log(`Amoy workflow complete. Batch ${summary.batchId}; evidence: ${summary.evidenceDirectory}`);
  }catch(error){console.error(safeFailure(error));process.exitCode=1;}finally{provider?.destroy();}
}
