import ganache from 'ganache';
import {BrowserProvider,ContractFactory,sha256,toUtf8Bytes} from 'ethers';
import {compile} from '../scripts/compile.mjs';
export const artifacts=compile();
export const digest=sha256(toUtf8Bytes('synthetic certificate\n'));
export async function setup(name='MedTraceGuard'){
 const rpc=ganache.provider({logging:{quiet:true},chain:{chainId:31337,hardfork:'shanghai'},wallet:{totalAccounts:7}});
 const provider=new BrowserProvider(rpc,undefined,{cacheTimeout:-1});provider.pollingInterval=10;
 const signers=await Promise.all(Array.from({length:7},(_,i)=>provider.getSigner(i)));
 const addresses=await Promise.all(signers.map(s=>s.getAddress()));
 const artifact=artifacts[name];const c=await new ContractFactory(artifact.abi,artifact.bytecode,signers[0]).deploy();await c.waitForDeployment();
 for(let i=1;i<=4;i++)await(await c.assignRole(addresses[i],i)).wait();
 const now=Number((await provider.getBlock('latest')).timestamp);
 return {rpc,provider,signers,addresses,c,now,close:async()=>{provider.destroy();await rpc.disconnect();}};
}
export async function register(f,{code='LOT-1',expires=f.now+864000,units=100}={}){
 await(await f.c.connect(f.signers[1]).registerBatch(code,'Demo medicine',f.now-100,expires,units,20,80,'/certificates/test.json',digest)).wait();return Number(await f.c.batchCount());
}
export async function handoff(f,id,from,to){
 const now=Number((await f.provider.getBlock('latest')).timestamp);
 await(await f.c.connect(f.signers[from]).proposeTransfer(id,f.addresses[to],now+1000)).wait();
 const req=await f.c.pending(id);await(await f.c.connect(f.signers[to]).acceptTransfer(id,req.nonce)).wait();
}
export async function rejected(promise){
 try{const result=await promise;if(result?.wait)await result.wait();}catch{return;}
 throw Error('Expected transaction/call to revert, but it succeeded');
}
