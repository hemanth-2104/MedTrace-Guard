import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import ganache from 'ganache';
import {BrowserProvider,Wallet,parseEther,sha256} from 'ethers';
import {compile} from '../scripts/compile.mjs';
import {AMOY,ROLE_NAMES,configFromEnv,preflight,deployAmoy,checkedContract,safeFailure} from '../scripts/testnet-lib.mjs';
import {certificateFromEnv,runWorkflow,readSnapshot} from '../scripts/testnet-workflow.mjs';

const keys=Array.from({length:5},(_,i)=>'0x'+BigInt(i+100).toString(16).padStart(64,'0'));
const env=Object.fromEntries(ROLE_NAMES.map((name,i)=>[`AMOY_${name.toUpperCase()}_PRIVATE_KEY`,keys[i]]));
const certificateURI='ipfs://bafkreibu5ifryw6stuqi7uoddntloolf3rf7zb5aalzctnac5qou47rsei';
test('Amoy config fails closed without keys; read-only requires none; HTTPS and chain restrictions',()=>{
  assert.throws(()=>configFromEnv({}),/AMOY_ADMIN_PRIVATE_KEY/);
  assert.equal(configFromEnv({},{signing:false}).rpcUrl,AMOY.rpcUrls[0]);
  assert.throws(()=>configFromEnv({...env,AMOY_RPC_URL:'http://127.0.0.1:8545'}),/HTTPS/);
  assert.throws(()=>configFromEnv({...env,AMOY_CHAIN_ID:'1'}),/80002/);
  assert.throws(()=>configFromEnv({...env,AMOY_CONFIRMATIONS:'0'}),/1–20/);
  assert.throws(()=>configFromEnv({...env,AMOY_MIN_BALANCE_POL:'0'}),/positive/);
  assert.throws(()=>configFromEnv({...env,AMOY_MANUFACTURER_PRIVATE_KEY:keys[0]}),/distinct/);
  assert.throws(()=>configFromEnv({...env,AMOY_ADMIN_PRIVATE_KEY:'0x'+'0'.repeat(64)}),/invalid/);
});
test('preflight rejects wrong chain and insufficient funds before any mutation',async()=>{
  const config=configFromEnv(env);let checks=0;
  await assert.rejects(preflight({send:async()=> '0x1'},config),/requires Polygon Amoy/);
  const fake={send:async()=> '0x13882',getBlock:async()=>({number:4,hash:'0xmock',timestamp:1}),getBalance:async()=>{checks++;return 0n;}};
  await assert.rejects(preflight(fake,config),/needs at least/);assert.equal(checks,1);
  const report=await preflight(fake,config,{signing:false});assert.equal(report.signing,false);assert.deepEqual(report.accounts,{});
});
test('RPC errors are redacted rather than exposing credential-bearing request URLs',()=>{
  const error=Object.assign(Error('https://provider.example/private-secret'),{code:'NETWORK_ERROR'});
  assert.equal(safeFailure(error).includes('private-secret'),false);
});
test('certificate input requires actual bytes and an IPFS URI',()=>{
  assert.throws(()=>certificateFromEnv({}),/real uploaded/);
  assert.throws(()=>certificateFromEnv({AMOY_CERTIFICATE_URI:'ipfs://CID'}),/real uploaded/);
  assert.throws(()=>certificateFromEnv({AMOY_CERTIFICATE_URI:certificateURI+'/certificate.json'}),/without a subpath/);
  assert.throws(()=>certificateFromEnv({AMOY_CERTIFICATE_URI:certificateURI}),/AMOY_CERTIFICATE_FILE/);
  const dir=mkdtempSync(join(tmpdir(),'medtrace-cert-'));
  try{const path=join(dir,'certificate.json');writeFileSync(path,'synthetic certificate\n');const c=certificateFromEnv({AMOY_CERTIFICATE_URI:certificateURI,AMOY_CERTIFICATE_FILE:path});assert.equal(c.digest,sha256(readFileSync(path)));}finally{rmSync(dir,{recursive:true,force:true});}
});
test('LOCAL EVM ONLY: deploy, receipt retention, recipient acceptance, mined unsafe rejection, wallet-free read',async()=>{
  // In-process Ganache uses chain ID 80002 solely to exercise the Amoy guard.
  // These keys, receipts and block hashes are LOCAL fixtures, never public-chain evidence.
  const rpc=ganache.provider({chain:{chainId:80002,hardfork:'shanghai'},wallet:{accounts:keys.map(secretKey=>({secretKey,balance:'0x'+parseEther('100').toString(16)}))},logging:{quiet:true}});
  const provider=new BrowserProvider(rpc,undefined,{cacheTimeout:-1});provider.pollingInterval=10;
  const directory=mkdtempSync(join(tmpdir(),'medtrace-testnet-local-'));const manifestPath=join(directory,'deployment.json');
  const config=configFromEnv({...env,AMOY_CONFIRMATIONS:'1'});
  try{
    const deployment=await deployAmoy(provider,config,compile().MedTraceGuard,directory,{manifestPath});
    assert.equal(deployment.chainId,80002);assert.equal(deployment.localAccounts.length,0);
    await assert.rejects(deployAmoy(provider,config,{},directory,{manifestPath}),/already exists/);
    // This contract test never fetches the CID: digest/bytes are synthetic local fixtures.
    const certificate={uri:certificateURI,digest:sha256(new TextEncoder().encode('synthetic local fixture')),byteLength:23};
    const summary=await runWorkflow(provider,config,deployment,certificate,directory);
    assert.equal(summary.walletFreeRead.batch.stage,2);
    assert.equal(summary.walletFreeRead.batch.custodian,new Wallet(keys[3]).address);
    assert.equal(summary.walletFreeRead.batch.remainingUnits,100n);
    assert.equal(summary.walletFreeRead.batch.hold,true);
    assert.equal(summary.walletFreeRead.historyCount,6);
    assert.deepEqual(summary.walletFreeRead.history.map(h=>h.kind),[0,1,2,1,2,5]);
    const receipt=JSON.parse(readFileSync(join(directory,'unsafe-dispense-rejected.json'),'utf8'));
    assert.equal(receipt.receipt.status,0);assert.equal(receipt.state,'mined');
    assert.equal(readdirSync(directory).filter(p=>/^(role-|register-|manufacturer-|distributor-|unsafe-|deploy\.json)/.test(p)).length,12);
    const read=await checkedContract(provider,deployment);assert.equal(typeof read.runner.sendTransaction,'undefined');
    assert.equal((await readSnapshot(read,1n)).batch.certificateSHA256,certificate.digest);
    await assert.rejects(checkedContract(provider,{...deployment,runtimeCodeSHA256:'0x'+'0'.repeat(64)}),/hash does not match/);
  }finally{provider.destroy();await rpc.disconnect();rmSync(directory,{recursive:true,force:true});}
});
