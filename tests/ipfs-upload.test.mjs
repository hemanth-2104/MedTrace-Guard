import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {kuboAPI,uploadCertificate} from '../scripts/ipfs-upload.mjs';
import {sha256Hex} from '../shared/certificate.mjs';

test('Kubo upload API allows only explicit loopback origins',()=>{
 for(const origin of ['http://127.0.0.1:15001','http://localhost:5001','https://[::1]:5001']){assert.equal(kuboAPI(origin),origin);}
 for(const origin of ['https://remote.example','http://127.0.0.1.evil.example','ftp://localhost','http://user:secret@localhost','http://localhost/path','http://localhost?token=x','http://localhost/#x']){assert.throws(()=>kuboAPI(origin));}
});
test('upload helper pins exact file bytes with CIDv1 and reports their separate SHA-256 (mock API)',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'ipfs-upload-test-'));
 try{
  const file=join(dir,'unit-test.bin');const bytes=new Uint8Array([0,255,13,10,32]);await writeFile(file,bytes);
  let called=false;
  const result=await uploadCertificate(file,{allowedRoots:[dir],api:'http://localhost:15001',fetchImpl:async(url,options)=>{
   called=true;assert.equal(url.pathname,'/api/v0/add');assert.equal(url.searchParams.get('pin'),'true');assert.equal(url.searchParams.get('cid-version'),'1');assert.equal(url.searchParams.get('raw-leaves'),'true');assert.equal(options.method,'POST');assert.ok(options.signal);
   const uploaded=options.body.get('file');assert.equal(uploaded.name,'unit-test.bin');assert.deepEqual(new Uint8Array(await uploaded.arrayBuffer()),bytes);
   return new Response(JSON.stringify({Hash:'unitTestMockCid'}));
  }});
  assert.equal(called,true);assert.deepEqual(result,{certificateURI:'ipfs://unitTestMockCid',certificateSHA256:await sha256Hex(bytes),bytes:5});
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('upload helper rejects oversized input and unsuccessful/malformed mock API responses',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'ipfs-upload-errors-'));
 try{
  const file=join(dir,'test.bin');await writeFile(file,'small');
  await assert.rejects(uploadCertificate(file,{allowedRoots:[dir],fetchImpl:async()=>new Response('failure',{status:500})}),/Kubo add failed \(500\)/);
  await assert.rejects(uploadCertificate(file,{allowedRoots:[dir],fetchImpl:async()=>new Response('{}')}),/did not return a CID/);
  await writeFile(file,new Uint8Array(8*1024*1024+1));
  await assert.rejects(uploadCertificate(file,{allowedRoots:[dir],fetchImpl:async()=>{throw new Error('must not upload');}}),/8 MiB/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
