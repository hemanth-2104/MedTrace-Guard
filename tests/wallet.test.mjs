import test from 'node:test';
import assert from 'node:assert/strict';
import {WalletSession,allowsLocalSigning,walletChainParameters,walletMessage} from '../shared/wallet.mjs';

// Simulated EIP-1193 provider only: these tests do not connect MetaMask or submit transactions.
const account = '0x1111111111111111111111111111111111111111';
const other = '0x2222222222222222222222222222222222222222';
const local = {chainId:31337,localAccounts:[account],rpcUrl:'http://127.0.0.1:8545'};
const amoy = {chainId:80002,localAccounts:[],rpcUrl:'https://polygon-amoy.drpc.org'};
class MockProvider {
  constructor(chain='0x7a69') { this.chain=chain;this.accounts=[account];this.events=new Map();this.calls=[];this.behavior={}; }
  async request(request) { this.calls.push(request);if(this.behavior[request.method])return this.behavior[request.method](request);if(['eth_requestAccounts','eth_accounts'].includes(request.method))return this.accounts;if(request.method==='eth_chainId')return this.chain;if(request.method==='wallet_switchEthereumChain'){this.chain=request.params[0].chainId;this.emit('chainChanged',this.chain);return null;}if(request.method==='wallet_addEthereumChain')return null;throw Error(`Unexpected method ${request.method}`); }
  on(event,fn) { if(!this.events.has(event))this.events.set(event,new Set());this.events.get(event).add(fn); }
  removeListener(event,fn) { this.events.get(event)?.delete(fn); }
  emit(event,value) { for(const fn of [...(this.events.get(event)??[])])fn(value); }
  listenerCount() { return [...this.events.values()].reduce((n,listeners)=>n+listeners.size,0); }
}
function signingOptions(deployment=local, overrides={}) {
  return { deployment, hostname:'localhost',localProvider:{getSigner(){throw Error('Unexpected local RPC signing');}},createBrowserProvider:()=>({getSigner:async address=>({getAddress:async()=>address}),destroy(){}}),...overrides };
}

test('simulated: connecting MetaMask uses wallet signing even for an unlocked local demo address', async()=>{
  const provider=new MockProvider();const session=new WalletSession();await session.connect(provider,local);
  let walletRequests=0;await session.signer(signingOptions(local,{createBrowserProvider:p=>{assert.equal(p,provider);return{getSigner:async address=>{walletRequests++;assert.equal(address,account);return{getAddress:async()=>account};}};}}));
  assert.equal(walletRequests,1);assert.equal(session.state.mode,'wallet');
});
test('simulated: local signing requires explicit selection and never accesses wallet provider', async()=>{
  const session=new WalletSession();let calls=0;session.selectLocal(local,'127.0.0.1',account);const signer={local:true};
  assert.equal(await session.signer(signingOptions(local,{localProvider:{getSigner:async address=>{calls++;assert.equal(address,account);return signer;}},createBrowserProvider:()=>assert.fail('Unexpected injected signing')})),signer);assert.equal(calls,1);
});
test('simulated: public mode cannot sign through an unlocked RPC', async()=>{
  await assert.rejects(new WalletSession().signer(signingOptions()),/Reconnect MetaMask/);
});
test('simulated: local selection is restricted to localhost chain 31337 and manifest accounts',()=>{
  const session=new WalletSession();assert.equal(allowsLocalSigning(local,'localhost'),true);
  for(const [deployment,host,address] of [[amoy,'localhost',account],[local,'example.com',account],[local,'localhost',other],[local,'localhost','invalid']])assert.throws(()=>session.selectLocal(deployment,host,address),/Local demo signing/);
  assert.equal(session.state.mode,'readonly');
});
test('simulated: rejected connection clears previous local identity and all listeners',async()=>{
  const provider=new MockProvider();provider.behavior.eth_requestAccounts=()=>{throw Object.assign(Error('Denied'),{code:4001});};
  const session=new WalletSession();session.selectLocal(local,'localhost',account);await assert.rejects(session.connect(provider,local),{code:4001});assert.equal(session.state.mode,'readonly');assert.equal(session.state.account,'');assert.equal(provider.listenerCount(),0);
});
test('simulated: wrong chain connection stays public and does not silently switch networks',async()=>{
  const provider=new MockProvider('0x1');const session=new WalletSession();await assert.rejects(session.connect(provider,local),/Switch to deployment chain/);assert.equal(session.state.mode,'readonly');assert.equal(provider.listenerCount(),0);assert.equal(provider.calls.some(c=>c.method==='wallet_switchEthereumChain'),false);
});
test('simulated: permission approval may emit accountsChanged before resolving',async()=>{
  const provider=new MockProvider();provider.behavior.eth_requestAccounts=()=>{provider.emit('accountsChanged',[account]);return[account];};const session=new WalletSession();await session.connect(provider,local);assert.equal(session.state.account,account);assert.equal(provider.listenerCount(),3);
});
test('simulated: locked or revoked account permissions cannot connect',async()=>{
  const provider=new MockProvider();provider.accounts=[];const session=new WalletSession();await assert.rejects(session.connect(provider,local),/No wallet account/);assert.equal(provider.listenerCount(),0);
});
for(const [event,value] of [['accountsChanged',[other]],['accountsChanged',[]],['chainChanged','0x1'],['disconnect',{code:4900}]])test(`simulated: ${event} ${JSON.stringify(value)} immediately invalidates identity and detaches listeners`,async()=>{
  const provider=new MockProvider();const session=new WalletSession();await session.connect(provider,local);let destroyed=0;
  await session.signer(signingOptions(local,{createBrowserProvider:()=>({getSigner:async()=>({getAddress:async()=>account}),destroy:()=>destroyed++})}));
  provider.emit(event,value);assert.equal(session.state.mode,'readonly');assert.equal(session.state.account,'');assert.equal(provider.listenerCount(),0);assert.equal(destroyed,1);await assert.rejects(session.signer(signingOptions()),/Reconnect MetaMask/);
});
test('simulated: changing mode while permission prompt is pending prevents stale wallet completion',async()=>{
  const provider=new MockProvider();let approve;provider.behavior.eth_requestAccounts=()=>new Promise(resolve=>{approve=resolve;});const session=new WalletSession();const pending=session.connect(provider,local);session.selectLocal(local,'localhost',other===account?other:account);approve([account]);await assert.rejects(pending,/superseded/);assert.equal(session.state.mode,'local');assert.equal(provider.listenerCount(),0);
});
test('simulated: changing local selection while RPC signer resolves cancels the stale signer',async()=>{
  const session=new WalletSession();session.selectLocal(local,'localhost',account);let resolve;const pending=session.signer(signingOptions(local,{localProvider:{getSigner:()=>new Promise(done=>{resolve=done;})}}));session.clear();resolve({});await assert.rejects(pending,/Signing account changed/);
});
test('simulated: silently changed wallet account is detected before obtaining signer',async()=>{
  const provider=new MockProvider();const session=new WalletSession();await session.connect(provider,local);provider.accounts=[other];await assert.rejects(session.signer(signingOptions()),/account or network changed/);assert.equal(session.state.mode,'readonly');
});
test('simulated: silently changed wallet chain is detected before obtaining signer',async()=>{
  const provider=new MockProvider();const session=new WalletSession();await session.connect(provider,local);provider.chain='0x1';await assert.rejects(session.signer(signingOptions()),/account or network changed/);assert.equal(session.state.mode,'readonly');
});
test('simulated: account event during asynchronous signer acquisition blocks stale signing',async()=>{
  const provider=new MockProvider();const session=new WalletSession();await session.connect(provider,local);await assert.rejects(session.signer(signingOptions(local,{createBrowserProvider:()=>({getSigner:async()=>{provider.emit('accountsChanged',[other]);return{getAddress:async()=>account};},destroy(){}})})),/signer account changed|Reconnect MetaMask/);assert.equal(session.state.mode,'readonly');
});
test('simulated: reconnecting detaches old provider and destruction removes only owned listeners',async()=>{
  const first=new MockProvider(),second=new MockProvider();let foreign=0;first.on('accountsChanged',()=>foreign++);const session=new WalletSession();await session.connect(first,local);await session.connect(second,local);assert.equal(first.listenerCount(),1);assert.equal(second.listenerCount(),3);session.clear();assert.equal(second.listenerCount(),0);first.emit('accountsChanged',[]);assert.equal(foreign,1);
});
test('simulated: wallet wrapper is reused within a session and destroyed on local mode selection',async()=>{
  const provider=new MockProvider();const session=new WalletSession();await session.connect(provider,local);let created=0,destroyed=0;const options=signingOptions(local,{createBrowserProvider:()=>{created++;return{getSigner:async()=>({getAddress:async()=>account}),destroy:()=>destroyed++};}});await session.signer(options);await session.signer(options);assert.equal(created,1);session.selectLocal(local,'localhost',account);assert.equal(destroyed,1);assert.equal(provider.listenerCount(),0);
});
test('simulated: explicit network switch adds known Amoy only when provider reports unknown chain',async()=>{
  const provider=new MockProvider('0x1');let switches=0;provider.behavior.wallet_switchEthereumChain=({params})=>{if(switches++===0)throw Object.assign(Error('Unknown chain'),{code:4902});provider.chain=params[0].chainId;};const session=new WalletSession();await session.switchNetwork(provider,amoy);assert.equal(session.state.mode,'wallet');assert.equal(session.state.chainId,80002);const add=provider.calls.find(c=>c.method==='wallet_addEthereumChain');assert.deepEqual(add.params,[walletChainParameters(amoy)]);assert.equal(switches,2);
});
test('simulated: rejected network switch leaves public mode and never adds chain',async()=>{
  const provider=new MockProvider();provider.behavior.wallet_switchEthereumChain=()=>{throw Object.assign(Error('No'),{code:4001});};const session=new WalletSession();session.selectLocal(local,'localhost',account);await assert.rejects(session.switchNetwork(provider,amoy),{code:4001});assert.equal(session.state.mode,'readonly');assert.equal(provider.calls.some(c=>c.method==='wallet_addEthereumChain'),false);
});
test('simulated: unsupported unknown chain requires manual setup',async()=>{
  const provider=new MockProvider();provider.behavior.wallet_switchEthereumChain=()=>{throw Object.assign(Error('Unknown'),{code:4902});};await assert.rejects(new WalletSession().switchNetwork(provider,{chainId:12345}),/manually/);assert.equal(provider.calls.some(c=>c.method==='wallet_addEthereumChain'),false);
});
test('simulated: Amoy network addition refuses private, credential-bearing or non-HTTPS RPC URLs',()=>{
  for(const rpcUrl of ['http://example.org','https://user:secret@example.org','https://example.org?key=secret','https://127.0.0.1','https://192.168.1.5','https://[::1]','https://localhost','https://rpc.local'])assert.throws(()=>walletChainParameters({...amoy,rpcUrl}),/public HTTPS/);
});
test('simulated: missing provider and wallet error messages are actionable',async()=>{
  await assert.rejects(new WalletSession().connect(undefined,local),/MetaMask is unavailable/);assert.match(walletMessage({code:4001}),/rejected/);assert.match(walletMessage({code:'ACTION_REJECTED'}),/rejected/);assert.match(walletMessage({code:-32002}),/already pending/);assert.match(walletMessage({code:4900}),/disconnected/);
});

test('simulated: clearing during a pending network switch prevents reconnect and leaked listeners',async()=>{
  const provider=new MockProvider();let finish;provider.behavior.wallet_switchEthereumChain=()=>new Promise(resolve=>{finish=resolve;});const session=new WalletSession();const pending=session.switchNetwork(provider,amoy);session.clear();finish();await assert.rejects(pending,/superseded/);assert.equal(provider.listenerCount(),0);assert.equal(session.state.mode,'readonly');assert.equal(provider.calls.some(c=>c.method==='eth_requestAccounts'),false);
});
test('simulated: provider disconnection without an event clears identity before signing',async()=>{
  const provider=new MockProvider();const session=new WalletSession();await session.connect(provider,local);provider.behavior.eth_accounts=()=>{throw Object.assign(Error('Disconnected'),{code:4900});};await assert.rejects(session.signer(signingOptions()),{code:4900});assert.equal(session.state.mode,'readonly');assert.equal(provider.listenerCount(),0);
});
test('simulated: malformed live chain response clears identity before signing',async()=>{
  const provider=new MockProvider();const session=new WalletSession();await session.connect(provider,local);provider.chain='invalid';await assert.rejects(session.signer(signingOptions()),/invalid chain ID/);assert.equal(session.state.mode,'readonly');assert.equal(provider.listenerCount(),0);
});

test('simulated: local network addition respects deployment port and rejects non-loopback endpoints',()=>{
  assert.equal(walletChainParameters({...local,rpcUrl:'http://127.0.0.1:18545'}).rpcUrls[0],'http://127.0.0.1:18545/');for(const rpcUrl of ['http://example.org:8545','http://secret@localhost:8545','http://127.0.0.1:8545?token=secret'])assert.throws(()=>walletChainParameters({...local,rpcUrl}),/loopback HTTP/);
});
