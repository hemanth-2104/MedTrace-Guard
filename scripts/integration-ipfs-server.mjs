// Disposable, in-memory local chain for the real-IPFS browser integration proof.
// This never writes the normal public/deployment.json or .local-chain database.
import ganache from 'ganache';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {ContractFactory,JsonRpcProvider} from 'ethers';
import {compile} from './compile.mjs';
import {fetchCertificateBytes,verifyCertificate} from '../shared/certificate.mjs';

const proof=JSON.parse(readFileSync('evidence/ipfs/proof.json','utf8'));
const manifestPath='public/deployment.ipfs-proof.json';
if(existsSync(manifestPath)){throw new Error('An IPFS proof manifest already exists. Stop its process first or archive the stale file.');}
const server=ganache.server({chain:{chainId:31337,hardfork:'shanghai'},wallet:{deterministic:true,totalAccounts:8},logging:{quiet:true}});
let provider,closing=false;
async function close(code=0){if(closing){return;}closing=true;provider?.destroy();await server.close();rmSync(manifestPath,{force:true});process.exit(code);}
for(const signal of ['SIGINT','SIGTERM']){process.once(signal,()=>close());}
try{
 const bytes=await fetchCertificateBytes(proof.certificateURI,globalThis.fetch,proof.gateway);
 assert.ok(await verifyCertificate(bytes,proof.certificateSHA256));
 await server.listen(18545,'127.0.0.1');
 provider=new JsonRpcProvider('http://127.0.0.1:18545',undefined,{cacheTimeout:-1,batchMaxCount:1});provider.pollingInterval=10;
 const artifact=compile().MedTraceGuard;
 const signer=await provider.getSigner(0);
 const contract=await new ContractFactory(artifact.abi,artifact.bytecode,signer).deploy();await contract.waitForDeployment();
 const accounts=[];
 for(let i=0;i<5;i++){const address=await(await provider.getSigner(i)).getAddress();accounts.push(address);if(i){await(await contract.assignRole(address,i)).wait();}}
 const timestamp=Number((await provider.getBlock('latest')).timestamp);
 const registration=await(await contract.connect(await provider.getSigner(1)).registerBatch('IPFS-REAL-PROOF','Synthetic IPFS integration medicine',timestamp-60,timestamp+86400,100,20,80,proof.certificateURI,proof.certificateSHA256)).wait();
 const stored=await contract.getBatch(1);assert.equal(stored.certificateURI,proof.certificateURI);assert.equal(stored.certificateSHA256,proof.certificateSHA256);
 const deployment={address:await contract.getAddress(),chainId:31337,rpcUrl:'http://127.0.0.1:18545',abi:artifact.abi,localAccounts:accounts};
 writeFileSync(manifestPath,JSON.stringify(deployment,null,2)+'\n');
 mkdirSync('evidence/integration',{recursive:true});
 writeFileSync('evidence/integration/ipfs-contract.json',JSON.stringify({scope:'Real Kubo pin and gateway; disposable LOCAL blockchain, not public testnet',chainId:31337,rpcUrl:deployment.rpcUrl,contract:deployment.address,batchId:1,transactionHash:registration.hash,certificateURI:stored.certificateURI,certificateSHA256:stored.certificateSHA256,gateway:proof.gateway,registeredUnits:'100',retrievedBytes:bytes.byteLength,integrity:'MATCH'},null,2)+'\n');
 console.log('Disposable IPFS proof RPC ready at http://127.0.0.1:18545.');
 console.log('Manifest /deployment.ipfs-proof.json; actual CID registered:',stored.certificateURI);
}catch(error){console.error(error.message);await close(1);}
