// Explicit live integration check: this uses a running Kubo daemon, never a mock.
import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {join} from 'node:path';
import {readCertificateFile,createEvidenceDirectory} from './local-files.mjs';
import {uploadCertificate,kuboAPI} from './ipfs-upload.mjs';
import {fetchCertificateBytes,certificateURL,sha256Hex,verifyCertificate,ipfsGateway} from '../shared/certificate.mjs';

const {path:source,bytes:sourceBytes}=await readCertificateFile(process.argv[2]??'public/certificates/demo-3.json');
const directory=await createEvidenceDirectory(process.env.IPFS_EVIDENCE_DIR??'evidence/ipfs');
const api=kuboAPI();
const gateway=ipfsGateway(process.env.IPFS_GATEWAY??'http://127.0.0.1:18080');
const original=join(directory,'certificate-original.json');
const renamed=join(directory,'certificate-renamed.json');
const modified=join(directory,'certificate-modified.json');
await writeFile(original,sourceBytes);
await copyFile(original,renamed);
const bytes=await readFile(original);
const changed=Buffer.from(bytes);changed[changed.length-2]^=1;
await writeFile(modified,changed);
const uploaded=await uploadCertificate(original,{api,allowedRoots:[directory]});
const renameUpload=await uploadCertificate(renamed,{api,allowedRoots:[directory]});
const changedUpload=await uploadCertificate(modified,{api,allowedRoots:[directory]});
assert.equal(renameUpload.certificateURI,uploaded.certificateURI,'Renaming must preserve the CID');
assert.notEqual(changedUpload.certificateURI,uploaded.certificateURI,'Modified bytes must change the CID');
const cid=uploaded.certificateURI.slice(7);
const pinResponse=await fetch(`${api}/api/v0/pin/ls?arg=${encodeURIComponent(cid)}`,{method:'POST',signal:AbortSignal.timeout(10000)});
assert.equal(pinResponse.ok,true,'Kubo pin query must succeed');
const pin=await pinResponse.json();
assert.equal(pin.Keys?.[cid]?.Type,'recursive','Certificate CID must have a recursive pin');
const pinRecord={Type:'recursive'};
const retrieved=new Uint8Array(await fetchCertificateBytes(uploaded.certificateURI,globalThis.fetch,gateway));
assert.deepEqual(retrieved,new Uint8Array(bytes),'Gateway must return exact original bytes');
await writeFile(join(directory,'certificate-retrieved.json'),retrieved);
const checks={retrieved:await verifyCertificate(retrieved,uploaded.certificateSHA256)?'MATCH':'MISMATCH',modified:await verifyCertificate(changed,uploaded.certificateSHA256)?'MATCH':'MISMATCH',renamed:await verifyCertificate(await readFile(renamed),uploaded.certificateSHA256)?'MATCH':'MISMATCH'};
assert.deepEqual(checks,{retrieved:'MATCH',modified:'MISMATCH',renamed:'MATCH'});
const cors=[];
for(const origin of ['http://127.0.0.1:5173','http://127.0.0.1:5174']){
 const response=await fetch(certificateURL(uploaded.certificateURI,gateway),{headers:{Origin:origin},signal:AbortSignal.timeout(10000)});
 const allowOrigin=response.headers.get('access-control-allow-origin');
 assert.ok(allowOrigin==='*'||allowOrigin===origin,`Gateway must permit browser origin ${origin}`);
 cors.push({origin,status:response.status,allowOrigin});
 await response.arrayBuffer();
}
// Public retrieval is a separate, bounded check. Local success proves no remote persistence.
const publicGateway=ipfsGateway(process.env.IPFS_PUBLIC_GATEWAY??'https://ipfs.io');
let publicRetrieval;
const publicStarted=Date.now();
try{
 const response=await fetch(certificateURL(uploaded.certificateURI,publicGateway),{signal:AbortSignal.timeout(12000)});
 const received=new Uint8Array(await response.arrayBuffer());
 publicRetrieval={gateway:publicGateway,status:response.status,resolvedURL:response.url,available:response.ok&&await verifyCertificate(received,uploaded.certificateSHA256),bytes:received.length,sha256:await sha256Hex(received)};
}catch(error){publicRetrieval={gateway:publicGateway,available:false,error:error.message};}
publicRetrieval.elapsedMs=Date.now()-publicStarted;
const evidence={recordedAt:new Date().toISOString(),mode:'real Kubo add/pin and gateway retrieval; synthetic classroom certificate',source,api,gateway,...uploaded,cid,pin:pinRecord,localGatewayURL:certificateURL(uploaded.certificateURI,gateway),checks,renamedCID:renameUpload.certificateURI.slice(7),modifiedCID:changedUpload.certificateURI.slice(7),cors,publicRetrieval,limitations:['Local pin retention depends on this Kubo repository and daemon.','Public gateway reachability is measured separately; a local pin is not a remote pinning-service guarantee.','No public blockchain transaction is performed by this script.']};
await writeFile(join(directory,'proof.json'),JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify(evidence,null,2));
