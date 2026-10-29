import {configFromEnv,makeProvider,preflight,loadManifest,checkedContract,json,safeFailure} from './testnet-lib.mjs';
import {readSnapshot} from './testnet-workflow.mjs';
let provider;
try {
  const batchId=process.argv[2];if(!batchId||!/^\d+$/.test(batchId)||BigInt(batchId)<1n)throw Error('Usage: testnet-read.mjs <positive batch ID>');
  const config=configFromEnv(process.env,{signing:false});provider=makeProvider(config);
  await preflight(provider,config,{signing:false});
  const deployment=loadManifest();const contract=await checkedContract(provider,deployment);
  const snapshot={chainId:80002,contract:deployment.address,batchId,checkedAt:new Date().toISOString(),walletRequired:false,...await readSnapshot(contract,batchId)};
  json(`evidence/testnet/read-batch-${batchId}.json`,snapshot);
  console.log(JSON.stringify(snapshot,(_,v)=>typeof v==='bigint'?v.toString():v,2));
}catch(error){console.error(safeFailure(error));process.exitCode=1;}finally{provider?.destroy();}
