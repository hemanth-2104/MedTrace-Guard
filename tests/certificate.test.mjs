import {test} from 'node:test';import assert from 'node:assert/strict';
import {sha256Hex,verifyCertificate,certificateURL,fetchCertificateBytes,ipfsGateway} from '../shared/certificate.mjs';
test('SHA-256 known answer for abc',async()=>assert.equal(await sha256Hex(new TextEncoder().encode('abc')),'0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));
test('modified bytes and JSON formatting fail integrity check',async()=>{const a=new TextEncoder().encode('{"a":1}');const b=new TextEncoder().encode('{ "a":1 }');const hash=await sha256Hex(a);assert.equal(await verifyCertificate(a,hash),true);assert.equal(await verifyCertificate(b,hash),false);});
test('certificate locator rejects script and arbitrary URLs',()=>{assert.equal(certificateURL('ipfs://bafyTEST'),'https://ipfs.io/ipfs/bafyTEST');assert.equal(certificateURL('/certificates/demo-1.json'),'/certificates/demo-1.json');for(const s of ['javascript:alert(1)','https://evil.test','/certificates/../../secret'])assert.throws(()=>certificateURL(s));});
test('IPFS gateway accepts HTTPS origins and local HTTP origins',()=>{
 for(const origin of ['https://dweb.link','https://gateway.example:8443','http://127.0.0.1:18080','http://localhost:18080','http://[::1]:18080']){
  assert.equal(ipfsGateway(`${origin}/`),origin);
  assert.equal(certificateURL('ipfs://bafyTEST',origin),`${origin}/ipfs/bafyTEST`);
 }
});
test('IPFS gateway rejects remote HTTP, credentials, scripts, and ambiguous paths',()=>{
 for(const value of ['http://example.com','http://127.0.0.1.evil.test','javascript:alert(1)','ftp://localhost','https://user:pass@example.com','https://example.com/ipfs','https://example.com?token=x','https://example.com/#x','/relative'])assert.throws(()=>ipfsGateway(value));
});
test('IPFS retrieval uses the configured gateway and preserves exact bytes',async()=>{
 const bytes=new Uint8Array([0,255,10,13,32]);
 let called;
 const fetched=await fetchCertificateBytes('ipfs://bafyTEST',async(url)=>{called=url;return new Response(bytes);},'http://127.0.0.1:18080');
 assert.equal(called,'http://127.0.0.1:18080/ipfs/bafyTEST');
 assert.deepEqual(new Uint8Array(fetched),bytes);
});
test('certificate retrieval returns exact bytes for an available file',async()=>{
 const bytes=new TextEncoder().encode('synthetic certificate\n');
 assert.deepEqual(new Uint8Array(await fetchCertificateBytes('/certificates/test.json',async()=>new Response(bytes,{headers:{'Content-Type':'application/json'}}))),bytes);
});
test('unavailable certificate, SPA HTML fallback, and network failure stay unverified',async()=>{
 for(const response of [new Response('missing',{status:404}),new Response('<!doctype html><div id="root"></div>',{headers:{'Content-Type':'text/html'}})])
  await assert.rejects(fetchCertificateBytes('/certificates/missing.json',async()=>response),/Certificate unavailable.*integrity is unverified/);
 await assert.rejects(fetchCertificateBytes('/certificates/missing.json',async()=>{throw Error('Failed to fetch');}),/Certificate unavailable.*integrity is unverified/);
});
