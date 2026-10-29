import {readFile} from 'node:fs/promises';
import {basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {sha256Hex} from '../shared/certificate.mjs';

export function kuboAPI(value=process.env.IPFS_API??'http://127.0.0.1:5001'){
 const endpoint=new URL(value);
 if(!['http:','https:'].includes(endpoint.protocol)||!['127.0.0.1','localhost','[::1]'].includes(endpoint.hostname)||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||endpoint.pathname!=='/')
  throw Error('IPFS_API must be a loopback HTTP(S) origin without credentials, path, query, or fragment. Keep remote pinning credentials out of the frontend.');
 return endpoint.origin;
}

export async function uploadCertificate(file,{api,fetchImpl=globalThis.fetch}={}){
 const bytes=await readFile(file);
 if(bytes.length>8*1024*1024)throw Error('Classroom file size limit is 8 MiB');
 const endpoint=new URL('/api/v0/add',kuboAPI(api));
 endpoint.search='?pin=true&cid-version=1&raw-leaves=true';
 const data=new FormData();data.set('file',new Blob([bytes]),basename(file));
 const response=await fetchImpl(endpoint,{method:'POST',body:data,signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error(`Kubo add failed (${response.status})`);
 const lines=(await response.text()).trim().split('\n');
 const result=JSON.parse(lines.at(-1));
 if(!result.Hash||!/^[a-zA-Z0-9]+$/.test(result.Hash))throw Error('Kubo add did not return a CID');
 return {certificateURI:`ipfs://${result.Hash}`,certificateSHA256:await sha256Hex(bytes),bytes:bytes.length};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  if(!process.argv[2])throw Error('Usage: node scripts/ipfs-upload.mjs path/to/certificate.pdf');
  console.log(JSON.stringify(await uploadCertificate(process.argv[2]),null,2));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
