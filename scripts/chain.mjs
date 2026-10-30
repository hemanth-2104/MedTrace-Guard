import ganache from 'ganache';
import {mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
// Publicly known disposable accounts, bound to loopback only.
export async function startChain(){
 mkdirSync('.local-chain',{recursive:true});
 const server=ganache.server({chain:{chainId:31337,hardfork:'shanghai'},database:{dbPath:'.local-chain'},wallet:{deterministic:true,totalAccounts:8,defaultBalance:1000},logging:{quiet:true}});
 await server.listen(8545,'127.0.0.1');
 console.log('MedTrace Guard RPC: http://127.0.0.1:8545 (chain 31337; saved in .local-chain/)');
 return server;
}
if(import.meta.url===pathToFileURL(process.argv[1]).href){
 const server=await startChain();
 for(const signal of ['SIGINT','SIGTERM']){process.once(signal,async()=>{await server.close();process.exit(0);});}
}
