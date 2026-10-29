import {configFromEnv,makeProvider,preflight,json,safeFailure} from './testnet-lib.mjs';
let provider;
try {
  const signing=!process.argv.includes('--read-only');
  const config=configFromEnv(process.env,{signing});provider=makeProvider(config);
  const report=await preflight(provider,config,{signing});
  json('evidence/testnet/preflight-latest.json',report);
  console.log(JSON.stringify(report,null,2));
}catch(error){console.error(safeFailure(error));process.exitCode=1;}finally{provider?.destroy();}
