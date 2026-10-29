import {Contract, ContractFactory, FetchRequest, JsonRpcProvider, Wallet, formatEther, parseEther, sha256} from 'ethers';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';

export const AMOY = Object.freeze({chainId:80002, chainName:'Polygon Amoy', nativeCurrency:{name:'POL',symbol:'POL',decimals:18}, rpcUrls:['https://polygon-amoy.drpc.org'], blockExplorerUrls:['https://amoy.polygonscan.com']});
export const ROLE_NAMES = ['admin','manufacturer','distributor','pharmacy','regulator'];
export const PUBLIC_MANIFEST = 'public/deployment.amoy.json';
export function json(path, value) {mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');}
export function configFromEnv(env=process.env,{signing=true}={}) {
  const rpcUrl=env.AMOY_RPC_URL || AMOY.rpcUrls[0];
  let url;try {url=new URL(rpcUrl);}catch {throw Error('AMOY_RPC_URL must be a valid HTTPS endpoint.');}
  if(url.protocol!=='https:')throw Error('AMOY_RPC_URL must use HTTPS; the public workflow never uses the local chain.');
  if(env.AMOY_CHAIN_ID && Number(env.AMOY_CHAIN_ID)!==AMOY.chainId)throw Error('AMOY_CHAIN_ID must be 80002.');
  const timeoutMs=Number(env.AMOY_RPC_TIMEOUT_MS||12000);
  if(!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>60000)throw Error('AMOY_RPC_TIMEOUT_MS must be 100–60000.');
  const confirmations=Number(env.AMOY_CONFIRMATIONS||2);
  if(!Number.isInteger(confirmations)||confirmations<1||confirmations>20)throw Error('AMOY_CONFIRMATIONS must be 1–20.');
  const config={rpcUrl,timeoutMs,confirmations,minBalance:parseEther(env.AMOY_MIN_BALANCE_POL||'0.1'),keys:{}};
  if(config.minBalance<=0n)throw Error('AMOY_MIN_BALANCE_POL must be positive.');
  if(signing)for(const name of ROLE_NAMES){
    const key=env[`AMOY_${name.toUpperCase()}_PRIVATE_KEY`];
    if(!key || !/^0x[0-9a-fA-F]{64}$/.test(key))throw Error(`Configure AMOY_${name.toUpperCase()}_PRIVATE_KEY in the ignored .env.amoy.local file. Never paste keys into chat.`);
    try{config.keys[name]=new Wallet(key);}catch{throw Error(`AMOY_${name.toUpperCase()}_PRIVATE_KEY is invalid.`);}
  }
  if(signing && new Set(Object.values(config.keys).map(w=>w.address.toLowerCase())).size!==ROLE_NAMES.length)throw Error('Use five distinct dedicated testnet wallets for admin and the four roles.');
  return config;
}
export function makeProvider(config){const request=new FetchRequest(config.rpcUrl);request.timeout=config.timeoutMs;const p=new JsonRpcProvider(request,undefined,{cacheTimeout:-1,batchMaxCount:1});p.pollingInterval=1500;return p;}
export async function preflight(provider,config,{signing=true}={}) {
  const chainId=Number(BigInt(await provider.send('eth_chainId',[])));
  if(chainId!==AMOY.chainId)throw Error(`Refusing chain ${chainId}; this workflow requires Polygon Amoy 80002.`);
  const block=await provider.getBlock('latest');
  if(!block)throw Error('RPC returned no latest block.');
  const report={checkedAt:new Date().toISOString(),chainId,blockNumber:block.number,blockHash:block.hash,blockTimestamp:block.timestamp,signing,accounts:{}};
  if(signing)for(const name of ROLE_NAMES){
    const wallet=config.keys[name];
    const balance=await provider.getBalance(wallet.address);
    report.accounts[name]={address:wallet.address,balancePOL:formatEther(balance)};
    if(balance<config.minBalance)throw Error(`${name} wallet ${wallet.address} needs at least ${formatEther(config.minBalance)} test POL; balance is ${formatEther(balance)}. Fund it via the Amoy faucet before sending transactions.`);
  }
  return report;
}
export function signersFor(config,provider){return Object.fromEntries(ROLE_NAMES.map(name=>[name,config.keys[name].connect(provider)]));}
export function newEvidenceRun(kind){const path=`evidence/testnet/${new Date().toISOString().replace(/[:.]/g,'-')}-${kind}`;mkdirSync(path,{recursive:true});return path;}
export function loadManifest(path=PUBLIC_MANIFEST){const d=JSON.parse(readFileSync(path,'utf8'));if(d.chainId!==AMOY.chainId||!d.address||!Array.isArray(d.abi))throw Error('Expected a Polygon Amoy deployment manifest.');return d;}
export async function checkedContract(provider,deployment,runner=provider){
  const code=await provider.getCode(deployment.address);
  if(code==='0x')throw Error('No contract at the saved Amoy deployment address.');
  if(!deployment.runtimeCodeSHA256 || sha256(code)!==deployment.runtimeCodeSHA256)throw Error('Saved deployment runtime code hash does not match the RPC.');
  return new Contract(deployment.address,deployment.abi,runner);
}
export async function recordTransaction(label,send,{directory,confirmations=2,expectedStatus=1,timeoutMs=180000}={}) {
  // Save the hash before waiting so an interruption never conceals a broadcast.
  const tx=await send();
  const base={label,transactionHash:tx.hash,from:tx.from,to:tx.to,chainId:tx.chainId.toString(),expectedStatus,explorerUrl:`${AMOY.blockExplorerUrls[0]}/tx/${tx.hash}`};
  const path=`${directory}/${label}.json`;json(path,{...base,state:'broadcast'});
  let receipt;
  try{receipt=await tx.wait(confirmations,timeoutMs);}catch(error){
    receipt=error.receipt;
    if(!receipt){json(path,{...base,state:'receipt-unavailable',errorCode:error.code||'UNKNOWN'});throw Error(`${label}: receipt unavailable; inspect the saved transaction hash before rerunning.`);}
  }
  if(!receipt)throw Error(`${label}: no receipt returned.`);
  const result={...base,state:'mined',receipt:receipt.toJSON()};json(path,result);
  if(receipt.status!==expectedStatus)throw Error(`${label}: expected status ${expectedStatus}, received ${receipt.status}; receipt saved.`);
  return {transaction:tx,receipt,result};
}
export async function deployAmoy(provider,config,artifact,directory,{manifestPath=PUBLIC_MANIFEST}={}) {
  // Never silently replace a deployed contract. A new deployment needs a separately archived manifest.
  if(existsSync(manifestPath))throw Error('Amoy manifest already exists. Reuse it, or archive it explicitly before deploying a new contract.');
  const report=await preflight(provider,config);json(`${directory}/preflight.json`,report);
  const signers=signersFor(config,provider);
  const factory=new ContractFactory(artifact.abi,artifact.bytecode,signers.admin);
  const request=await factory.getDeployTransaction();
  const gas=await provider.estimateGas({...request,from:signers.admin.address});
  const fee=await provider.getFeeData();const gasPrice=fee.maxFeePerGas??fee.gasPrice;
  if(!gasPrice || await provider.getBalance(signers.admin.address)<gas*gasPrice+config.minBalance)throw Error('Admin needs deployment gas plus the configured reserve of test POL.');
  let contract;
  const {receipt}=await recordTransaction('deploy',async()=>{contract=await factory.deploy();return contract.deploymentTransaction();},{directory,confirmations:config.confirmations});
  const address=await contract.getAddress();const code=await provider.getCode(address);
  if(code==='0x')throw Error('Deployment receipt succeeded but bytecode is missing.');
  const deployment={...AMOY,address,abi:artifact.abi,rpcUrl:AMOY.rpcUrls[0],localAccounts:[],transactionHash:receipt.hash,blockNumber:receipt.blockNumber,runtimeCodeSHA256:sha256(code),deployedAt:new Date().toISOString(),evidenceDirectory:directory,accounts:Object.fromEntries(ROLE_NAMES.map(n=>[n,signers[n].address]))};
  json(manifestPath,deployment);json(`${directory}/deployment.json`,deployment);return deployment;
}
export function safeFailure(error){
  // Provider exceptions can contain request URLs and signed payloads. Do not print them.
  const message=String(error.message||'Unknown failure');
  if(error.code || /https?:\/\//.test(message))return `Testnet operation failed (${error.code||'RPC_ERROR'}). Check RPC availability/configuration; receipt files retain broadcast transaction hashes.`;
  return message;
}
export function isMain(meta){return process.argv[1] && resolve(process.argv[1])===new URL(meta).pathname;}
