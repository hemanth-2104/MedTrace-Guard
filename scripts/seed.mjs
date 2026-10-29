import {writeFileSync,mkdirSync} from 'node:fs';
import {sha256Hex} from '../shared/certificate.mjs';
import {localContext} from './lib.mjs';
const {contract,provider,deployment}=await localContext();
if(Number(await contract.batchCount())!==0)throw Error('Seed needs a fresh deployment to avoid duplicate fixtures.');
mkdirSync('public/certificates',{recursive:true});
const maker=contract.connect(await provider.getSigner(1));const distributor=contract.connect(await provider.getSigner(2));
const now=Number((await provider.getBlock('latest')).timestamp);
for(let i=1;i<=3;i++){
 const bytes=Buffer.from(JSON.stringify({batch:`DEMO-${i}`,drug:'Synthetic cold-chain medicine',laboratory:'Classroom sample - not a real Certificate of Analysis',result:'Demo only'},null,2)+'\n');
 const digest=await sha256Hex(bytes);writeFileSync(`public/certificates/demo-${i}.json`,bytes);
 await(await maker.registerBatch(`DEMO-${i}`,'Synthetic cold-chain medicine',now-3600,now+365*86400,100,20,80,`/certificates/demo-${i}.json`,digest)).wait();
}
await(await maker.proposeTransfer(1,deployment.localAccounts[2],now+86400)).wait();
await(await distributor.acceptTransfer(1,1)).wait();
await(await distributor.reportTemperature(1,115,await sha256Hex(new TextEncoder().encode('Simulated excursion: 11.5 C')))).wait();
console.log('Seeded three batches. Batch 1 is at distributor under a temperature hold. Batches 2/3 are ready for demo.');provider.destroy();
