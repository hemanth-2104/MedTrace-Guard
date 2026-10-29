import {compile} from './compile.mjs';
import {connection,deployContract,saveJSON} from './lib.mjs';
const {provider,signer,chainId}=await connection();
if(chainId!==31337){provider.destroy();throw Error('Use deploy-testnet.mjs with .env.amoy.local for public testnet deployment. This command only updates the local deployment manifest.');}
const artifacts=compile();
const contract=await deployContract(signer,artifacts.MedTraceGuard);
const deployment={address:await contract.getAddress(),chainId,rpcUrl:chainId===31337?'http://127.0.0.1:8545':'',abi:artifacts.MedTraceGuard.abi,localAccounts:[]};
if(chainId===31337){
 for(let i=0;i<5;i++) {const address=await (await provider.getSigner(i)).getAddress();deployment.localAccounts.push(address);if(i>0)await(await contract.assignRole(address,i)).wait();}
}
saveJSON('public/deployment.json',deployment);console.log('Deployed',deployment.address,'chain',chainId);
console.log(chainId===31337?'Roles: accounts 1 manufacturer, 2 distributor, 3 pharmacy, 4 regulator.':'Assign roles through the Admin panel; set public read RPC in frontend .env.local.');
provider.destroy();
