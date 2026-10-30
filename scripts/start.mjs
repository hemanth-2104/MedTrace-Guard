import {spawn} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {JsonRpcProvider,Contract} from 'ethers';
import {startChain} from './chain.mjs';

process.chdir(fileURLToPath(new URL('..',import.meta.url)));
const env={...process.env,RPC_URL:'http://127.0.0.1:8545',CHAIN_ID:'31337',PRIVATE_KEY:'',VITE_READ_RPC:'http://127.0.0.1:8545'};
let server,child,closing=false;
async function close(code=0){
 if(closing){return;}closing=true;
 child?.kill('SIGTERM');
 if(server){await server.close();}
 process.exit(code);
}
for(const sig of ['SIGINT','SIGTERM']){process.once(sig,()=>close());}
function run(script){return new Promise((resolve,reject)=>{
 child=spawn(process.execPath,[script],{env,stdio:'inherit'});
 child.once('error',reject);
 child.once('exit',code=>{child=null;code===0?resolve():reject(new Error(`${script} exited with ${code}`));});
});}
try{
 server=await startChain();
 const provider=new JsonRpcProvider(env.RPC_URL,undefined,{cacheTimeout:-1});provider.pollingInterval=100;
 let deployment;
 try{deployment=JSON.parse(readFileSync('public/deployment.json','utf8'));}catch{}
 let reusable=false;
 try{reusable=deployment?.chainId===31337&&(await provider.getCode(deployment.address))!=='0x';}catch{}
 try{
  if(!reusable){await run('scripts/deploy.mjs');}
  deployment=JSON.parse(readFileSync('public/deployment.json','utf8'));
  const c=new Contract(deployment.address,deployment.abi,provider);
  if(await c.batchCount()===0n){await run('scripts/seed.mjs');}
  else {console.log('Reusing your saved batches and deployment.');}
 }finally{provider.destroy();}
 console.log('\nMedTrace Guard website: http://127.0.0.1:5173\nKeep this terminal open. Press Ctrl+C to stop and save the chain.\n');
 await run('node_modules/vite/bin/vite.js');
 await close();
}catch(e){console.error(`Startup failed: ${e.message}`);console.error('If port 8545 or 5173 is in use, stop the other MedTrace terminal first. See README.md.');await close(1);}
