import {compile} from './compile.mjs';
import {configFromEnv,makeProvider,preflight,deployAmoy,newEvidenceRun,safeFailure} from './testnet-lib.mjs';
let provider;
try {
  const config=configFromEnv();provider=makeProvider(config);
  await preflight(provider,config);
  const deployment=await deployAmoy(provider,config,compile().MedTraceGuard,newEvidenceRun('deploy'));
  console.log(`Amoy deployed: ${deployment.address}; transaction ${deployment.transactionHash}`);
}catch(error){console.error(safeFailure(error));process.exitCode=1;}finally{provider?.destroy();}
