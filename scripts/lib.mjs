import {JsonRpcProvider,Wallet,Contract,ContractFactory} from 'ethers';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
export async function connection(){
 const provider=new JsonRpcProvider(process.env.RPC_URL??'http://127.0.0.1:8545',undefined,{cacheTimeout:-1}); provider.pollingInterval=100;
 const network=await provider.getNetwork(); const chainId=Number(network.chainId);
 if(chainId===1) {throw new Error('Mainnet is deliberately excluded from this coursework tool.');}
 if(![31337,11155111,80002].includes(chainId)) {throw new Error('Supported chains: local 31337, Sepolia 11155111, Amoy 80002.');}
 if(process.env.CHAIN_ID && Number(process.env.CHAIN_ID)!==chainId) {throw new Error('CHAIN_ID mismatch');}
 let signer=null;
 if(process.env.PRIVATE_KEY){signer=new Wallet(process.env.PRIVATE_KEY,provider);}
 else if(chainId===31337){signer=await provider.getSigner(0);}
 if(!signer) {throw new Error('Set PRIVATE_KEY to a dedicated testnet wallet.');}
 return {provider,signer,chainId};
}
export async function deployContract(signer,artifact){const c=await new ContractFactory(artifact.abi,artifact.bytecode,signer).deploy();await c.waitForDeployment();return c;}
export function loadDeployment(){return JSON.parse(readFileSync('public/deployment.json','utf8'));}
export async function localContext(){const ctx=await connection();if(ctx.chainId!==31337) {throw new Error('This command is LOCAL ONLY.');}const d=loadDeployment();const code=await ctx.provider.getCode(d.address);if(code==='0x'){throw new Error('Deploy again after resetting chain');}return {...ctx,deployment:d,contract:new Contract(d.address,d.abi,ctx.signer)};}
export function saveJSON(path,value){mkdirSync(path.slice(0,path.lastIndexOf('/')),{recursive:true});writeFileSync(path,JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v,2));}
