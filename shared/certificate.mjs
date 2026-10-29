// SHA-256 is over the exact bytes, not parsed/reformatted JSON. CID remains a separate locator.
export async function sha256Hex(bytes) {
 const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
 return '0x'+Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
}
export async function verifyCertificate(bytes,expected){return (await sha256Hex(bytes)).toLowerCase()===expected.toLowerCase();}
export async function fetchCertificateBytes(uri,fetchImpl=globalThis.fetch,gateway){
 let response;
 try{response=await fetchImpl(certificateURL(uri,gateway),{signal:AbortSignal.timeout(10000)});}
 catch(e){throw Error(`Certificate unavailable; integrity is unverified. ${e.message}`);}
 if(!response.ok)throw Error(`Certificate unavailable (${response.status}); integrity is unverified.`);
 // SPA hosts can return index.html with HTTP 200 for a missing certificate.
 if(response.headers.get('content-type')?.toLowerCase().includes('text/html'))
  throw Error('Certificate unavailable: server returned an HTML page; integrity is unverified.');
 return response.arrayBuffer();
}
// Vite replaces import.meta.env in the browser; optional access also works in Node.
export function ipfsGateway(value=import.meta.env?.VITE_IPFS_GATEWAY??'https://ipfs.io'){
 let url;try{url=new URL(value);}catch{throw Error('IPFS gateway must be an absolute HTTPS URL or loopback HTTP URL.');}
 const loopback=['127.0.0.1','localhost','[::1]'].includes(url.hostname);
 if(!(url.protocol==='https:'||(url.protocol==='http:'&&loopback))||url.username||url.password||url.search||url.hash||url.pathname!=='/')
  throw Error('IPFS gateway must be an HTTPS origin or loopback HTTP origin, without credentials, path, query, or fragment.');
 return url.origin;
}
export function certificateURL(uri,gateway){
 if(uri.startsWith('ipfs://')) {const cid=uri.slice(7);if(!/^[a-zA-Z0-9]+$/.test(cid))throw Error('Expected ipfs://CID without a subpath');return `${ipfsGateway(gateway)}/ipfs/${cid}`;}
 if(/^\/certificates\/[a-zA-Z0-9_.-]+$/.test(uri))return uri;
 throw Error('Use ipfs://CID or a local /certificates/filename locator.');
}
