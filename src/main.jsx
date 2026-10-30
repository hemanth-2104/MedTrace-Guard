import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserProvider,JsonRpcProvider,Contract,isAddress} from 'ethers';
import QRCode from 'qrcode';
import {sha256Hex,verifyCertificate,fetchCertificateBytes} from '../shared/certificate.mjs';
import {WalletSession,allowsLocalSigning,walletMessage} from '../shared/wallet.mjs';
import './style.css';
const roles=['Public viewer','Manufacturer','Distributor','Pharmacy','Regulator'];
const stages=['Manufactured','At distributor','At pharmacy','Fully dispensed'];
const kinds=['Registered','Shipment proposed','Receipt accepted','Shipment cancelled','Units dispensed','Temperature reported','Hold released','Recalled'];
const reasons=['Eligible for next permitted action','Recalled','Expired','Temperature hold','Fully dispensed'];
const short=a=>a?`${a.slice(0,7)}…${a.slice(-5)}`:'—';
const date=n=>new Date(Number(n)*1000).toLocaleString();
function Action({name,fn,fields,convert=values=>values,busy,account,transact,onError}){return <form className="action" onSubmit={async e=>{e.preventDefault();const data=new FormData(e.currentTarget);try{await transact(fn,await convert(fields.map(f=>data.get(f.name))))}catch(err){onError(err);}}}><h4>{name}</h4>{fields.map(f=><label key={f.name}>{f.label}<input {...f} label={undefined} required={f.required!==false}/></label>)}<button type="submit" disabled={busy||!account}>{name}</button></form>;}
function batchLabel(batch){
 if(batch.recalled)return 'Recalled';
 if(batch.hold)return 'On hold';
 if(Number(batch.expiresAt)*1000<=Date.now())return 'Expired';
 return stages[Number(batch.stage)];
}
function signingLabel(mode,role,account,administrator){
 if(!account)return 'Public read-only access';
 const source=mode==='local'?'Local demo signing':'MetaMask signing';
 const suffix=administrator?' · Admin':'';
 return `${source} · ${roles[role]} · ${short(account)}${suffix}`;
}
function App(){
 const [ctx,setCtx]=useState(null),[account,setAccount]=useState(''),[role,setRole]=useState(0),[admin,setAdmin]=useState(false);
 const [rows,setRows]=useState([]),[id,setId]=useState(Number(new URLSearchParams(location.search).get('batch'))||1);
 const [batch,setBatch]=useState(null),[history,setHistory]=useState([]),[pending,setPending]=useState(null),[eligibility,setEligibility]=useState(null);
 const [offset,setOffset]=useState(0),[historyOffset,setHistoryOffset]=useState(0),[count,setCount]=useState(0),[historyTotal,setHistoryTotal]=useState(0);
 const [msg,setMsg]=useState('Connecting to read-only RPC…'),[busy,setBusy]=useState(false),[qr,setQR]=useState(''),[certificate,setCertificate]=useState('');
 const [digest,setDigest]=useState(''),[fileName,setFileName]=useState('');
 const [lookup,setLookup]=useState(String(id));
 const [signingMode,setSigningMode]=useState('readonly'),[walletBusy,setWalletBusy]=useState(false);
 const walletRef=useRef(null);
 if(!walletRef.current){walletRef.current=new WalletSession((state,message)=>{setAccount(state.account);setSigningMode(state.mode);setRole(0);setAdmin(false);if(message){setMsg(message);}});}
 const wallet=walletRef.current;
 const error=e=>{
  let name=e.revert?.name;
  const data=e.data??e.info?.error?.data?.result??e.info?.error?.data;
  if(!name&&typeof data==='string'){try{name=ctx?.c.interface.parseError(data)?.name;}catch{}}
  const explanations={Blocked:'Action blocked: check recall, expiry, temperature hold, and remaining units.',Denied:'Permission denied: select the authorized role and current custodian.',InvalidTransfer:'Invalid shipment: check recipient, route, pending nonce, deadline, and current roles.',InvalidInput:'Invalid input: check dates, quantities, temperature limits, and evidence digest.',DuplicateBatch:'This manufacturer has already registered that batch code.',UnknownBatch:'No registered batch with this ID.'};
  const fallback=e.shortMessage??e.reason??e.message??String(e);
  if(e.code==='NETWORK_ERROR'||/^(Failed to fetch|NetworkError when attempting to fetch resource\.?)$/i.test(fallback)){return 'Cannot reach blockchain RPC. Start the chain, then reload the dashboard.';}
  return explanations[name]??walletMessage(e);
 };
 async function identity(c,address){const version=wallet.version;const [nextRole,administrator]=await Promise.all([c.roleOf(address),c.admin()]);if(version!==wallet.version||wallet.state.account.toLowerCase()!==address.toLowerCase()){return;}setRole(Number(nextRole));setAdmin(administrator.toLowerCase()===address.toLowerCase());}
 useEffect(()=>{let provider;let stopped=false;
  (async()=>{const res=await fetch(import.meta.env.VITE_DEPLOYMENT_PATH||'/deployment.json');if(!res.ok){throw new Error('Run npm run deploy before opening the dashboard.');}
   const d=await res.json();const rpc=import.meta.env.VITE_READ_RPC||d.rpcUrl;if(!rpc){throw new Error('Set VITE_READ_RPC to the deployment network public RPC.');}
   provider=new JsonRpcProvider(rpc,undefined,{cacheTimeout:-1,batchMaxCount:1});provider.pollingInterval=d.chainId===31337?100:1500;const network=await provider.getNetwork();if(Number(network.chainId)!==d.chainId){throw new Error('Read RPC chain does not match deployment.');}
   if(await provider.getCode(d.address)==='0x'){throw new Error('No deployed contract at configured address. Redeploy after restarting chain.');}
   if(!stopped){setCtx({d,provider,c:new Contract(d.address,d.abi,provider)});setMsg('Read-only connection ready. No wallet needed for lookup.');}
  })().catch(e=>setMsg(error(e)));return()=>{stopped=true;provider?.destroy();};},[]);
 useEffect(()=>()=>wallet.clear(),[wallet]);
 async function refresh(){if(!ctx){return;}
  const n=Number(await ctx.c.batchCount());setCount(n);const ids=Array.from({length:Math.max(0,Math.min(12,n-offset))},(_,i)=>i+offset+1);
  setRows(await Promise.all(ids.map(async i=>({id:i,...await ctx.c.getBatch(i).then(b=>({drug:b.drug,code:b.code,custodian:b.custodian,recalled:b.recalled,hold:b.hold,remainingUnits:b.remainingUnits,stage:b.stage,expiresAt:b.expiresAt}))}))));
  if(id>0&&id<=n){const [b,h,p,e,total]=await Promise.all([ctx.c.getBatch(id),ctx.c.getHistory(id,historyOffset,20),ctx.c.pending(id),ctx.c.eligibility(id),ctx.c.historyCount(id)]);setBatch(b);setHistory(h.map((entry,index)=>({kind:entry.kind,actor:entry.actor,counterparty:entry.counterparty,timestamp:entry.timestamp,evidence:entry.evidence,value:entry.value,units:entry.units,entryId:historyOffset+index})));setPending(p);setEligibility(e);setHistoryTotal(Number(total));}
  else{setBatch(null);setHistory([]);setPending(null);setEligibility(null);setHistoryTotal(0);}
 }
 useEffect(()=>{refresh().catch(e=>setMsg(error(e)));},[ctx,id,offset,historyOffset]);
 useEffect(()=>{setCertificate('');setHistoryOffset(0); },[id]);
 // Use window.history explicitly: local history state holds ledger entries.
 useEffect(()=>{if(id>0){const url=new URL(location.href);url.searchParams.set('batch',id);window.history.replaceState(null,'',url);QRCode.toDataURL(url.href,{width:180,margin:1}).then(setQR).catch(e=>setMsg(error(e)));}},[id]);
 async function signer(){
  return wallet.signer({deployment:ctx.d,hostname:location.hostname,localProvider:ctx.provider,createBrowserProvider:provider=>new BrowserProvider(provider,undefined,{cacheTimeout:-1})});
 }
 async function transact(fn,args){setBusy(true);setMsg(`Submitting ${fn}…`);try{const c=ctx.c.connect(await signer());const tx=await c[fn](...args);setMsg(`Waiting for confirmation: ${tx.hash}`);await tx.wait();await refresh();if(wallet.state.account){await identity(ctx.c,wallet.state.account);}setMsg(`Confirmed: ${tx.hash}`);}catch(e){setMsg(error(e));}finally{setBusy(false);}}
 async function connect(switchNetwork=false){setWalletBusy(true);try{const state=await(switchNetwork?wallet.switchNetwork(window.ethereum,ctx.d):wallet.connect(window.ethereum,ctx.d));await identity(ctx.c,state.account);}catch(e){setMsg(error(e));}finally{setWalletBusy(false);}}
 async function selectLocal(address){try{wallet.selectLocal(ctx.d,location.hostname,address);if(address){await identity(ctx.c,address);}}catch(e){wallet.clear();setMsg(error(e));}}
 async function checkCertificate(){setCertificate('Checking exact certificate bytes…');try{const bytes=await fetchCertificateBytes(batch.certificateURI);setCertificate(await verifyCertificate(bytes,batch.certificateSHA256)?'MATCH: exact bytes match the registered SHA-256. This does not prove laboratory or medicine authenticity.':'MISMATCH: downloaded bytes differ from the registered digest.');}catch(e){setCertificate(error(e));}}

 const hash=s=>sha256Hex(new TextEncoder().encode(s));
 const actionProps={busy,account,transact,onError:err=>setMsg(error(err))};
 return <><header><div className="brand"><span className="logo">M+</span><div><strong>MedTrace <em>Guard</em></strong><small>Pharmaceutical provenance · accepted custody · safety gates</small></div></div><div className="wallet">{ctx&&<><button type="button" disabled={busy||walletBusy} onClick={()=>connect()}>{walletBusy?'Connecting…':'Connect MetaMask'}</button><button type="button" disabled={busy||walletBusy} onClick={()=>connect(true)}>Switch wallet network</button>{signingMode!=='readonly'&&<button type="button" disabled={busy||walletBusy} onClick={()=>wallet.clear('Signing disconnected. Public lookup remains available.')}>Disconnect signing</button>}</>}<small>{signingLabel(signingMode,role,account,admin)}</small></div></header>
 <main><div className="intro"><span className="eyebrow">CSE 540 · WORKING PROTOTYPE</span><h1>Follow the batch.<br/>Verify the handoff.</h1><p>Inspect who registered a batch, who accepted custody, and which recorded conditions block further distribution.</p></div>
 <output className="notice">{msg}</output>
 {ctx&&<><section className="toolbar"><div>Chain {ctx.d.chainId} · {short(ctx.d.address)}</div>{allowsLocalSigning(ctx.d,location.hostname)&&<label>Local demo account <select disabled={busy||walletBusy} value={signingMode==='local'?account:''} onChange={e=>selectLocal(e.target.value)}><option value="">Public viewer</option>{ctx.d.localAccounts.map((a,i)=><option key={a} value={a}>{i===0?'Administrator':roles[i]} · {short(a)}</option>)}</select></label>}<button type="button" onClick={()=>refresh().catch(e=>setMsg(error(e)))}>Refresh ledger</button></section>
 <section className="metrics"><article><small>Registered batches</small><strong>{count}</strong></article><article><small>Custody policy</small><strong>Two-party</strong></article><article><small>Safety gates</small><strong>Recall · expiry · hold</strong></article></section>
 <div className="columns"><section><div className="section-title"><h2>Batch registry</h2><small>{count===0?0:offset+1}–{Math.min(count,offset+12)} of {count}</small></div><div className="cards">{rows.map(b=><button type="button" className={`batch-card ${b.id===id?'selected':''}`} key={b.id} onClick={()=>{setId(b.id);setLookup(String(b.id));}}><span className="card-top"><b>#{b.id} · {b.code}</b><span className={`badge ${b.recalled||b.hold||Number(b.expiresAt)*1000<=Date.now()?'alert':''}`}>{batchLabel(b)}</span></span><strong>{b.drug}</strong><small>{String(b.remainingUnits)} units remaining · {short(b.custodian)}</small></button>)}</div><div className="pager"><button type="button" disabled={offset===0} onClick={()=>setOffset(Math.max(0,offset-12))}>Previous</button><button type="button" disabled={offset+12>=count} onClick={()=>setOffset(offset+12)}>Next</button></div></section>
 <aside className="panel"><h2>Public verification</h2><form className="lookup" onSubmit={e=>{e.preventDefault();const n=Number(lookup);if(!Number.isSafeInteger(n)||n<1){setMsg('Enter a positive numeric batch ID.');return;}setId(n);}}><input aria-label="Batch ID" type="number" min="1" value={lookup} onChange={e=>setLookup(e.target.value)}/><button type="submit">Look up</button></form>{batch?<><h3>{batch.code}</h3><div className={`verdict ${eligibility?.[0]?'ok':'warn'}`}>{reasons[Number(eligibility?.[1]??0)]}</div><dl><dt>Current custodian</dt><dd>{batch.custodian}</dd><dt>Manufacturer</dt><dd>{batch.manufacturer}</dd><dt>Produced / expires</dt><dd>{date(batch.manufacturedAt)} / {date(batch.expiresAt)}</dd><dt>Units remaining / registered</dt><dd>{String(batch.remainingUnits)} / {String(batch.totalUnits)}</dd><dt>Allowed temperature</dt><dd>{Number(batch.minTemp)/10}–{Number(batch.maxTemp)/10} °C</dd><dt>Certificate locator</dt><dd>{batch.certificateURI}</dd><dt>Registered SHA-256</dt><dd>{batch.certificateSHA256}</dd></dl><button type="button" onClick={checkCertificate}>Check certificate bytes</button><output className="certificate">{certificate}</output><label>Or verify a downloaded certificate<input type="file" onChange={async e=>{try{const f=e.target.files[0];if(f){setCertificate(await verifyCertificate(await f.arrayBuffer(),batch.certificateSHA256)?'MATCH: exact bytes match. Physical authenticity is not established.':'MISMATCH: file was altered or is a different certificate.');}}catch(err){setCertificate(error(err));}}}/></label>{qr&&<img src={qr} alt={`QR link for batch ${id}`} width="150" height="150"/>}<small>QR links to this deployment and batch. A phone needs a reachable frontend and read RPC; localhost works only on this device.</small></>:<p>No registered batch with this ID.</p>}</aside></div>
 {batch&&<section className="panel"><div className="section-title"><h2>Custody and safety timeline · #{id}</h2><small>{historyTotal} immutable entries</small></div>{history.map(e=><div className="timeline" key={e.entryId}><span className="dot"/><div><strong>{kinds[Number(e.kind)]}</strong><small>{date(e.timestamp)} · actor {short(e.actor)} {Number(e.kind)===5?`· ${Number(e.value)/10} °C`:''}{Number(e.units)>0?` · ${e.units} units`:''}</small><small>Counterparty: {short(e.counterparty)} · evidence/nonce: {e.evidence}</small></div></div>)}<div className="pager"><button type="button" disabled={historyOffset===0} onClick={()=>setHistoryOffset(Math.max(0,historyOffset-20))}>Earlier entries</button><button type="button" disabled={historyOffset+20>=historyTotal} onClick={()=>setHistoryOffset(historyOffset+20)}>Later entries</button></div>{pending?.recipient!=='0x0000000000000000000000000000000000000000'&&pending&&<p>Pending recipient: {pending.recipient} · nonce {String(pending.nonce)} · deadline {date(pending.deadline)}</p>}</section>}
 {account&&<section className="panel" key={account}><h2>Authorized actions</h2><p>The contract checks every request. A selected dashboard role does not grant permissions.</p><div className="actions">
 {role===1&&<form className="action" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void transact('registerBatch',[f.get('code'),f.get('drug'),Math.floor(new Date(f.get('made')).getTime()/1000),Math.floor(new Date(f.get('expiry')).getTime()/1000),f.get('units'),Math.round(Number(f.get('min'))*10),Math.round(Number(f.get('max'))*10),f.get('uri'),digest]);}}><h4>Register batch</h4>{[['code','Manufacturer batch code'],['drug','Medicine name'],['made','Production date','datetime-local'],['expiry','Expiry date','datetime-local'],['units','Units','number'],['min','Minimum °C','number'],['max','Maximum °C','number'],['uri','ipfs://CID or /certificates/file.json']].map(([name,label,type])=><label key={name}>{label}<input name={name} type={type||'text'} step={type==='number'?'any':undefined} required/></label>)}<label>Certificate file (hash exact bytes)<input type="file" required onChange={async e=>{setDigest('');setFileName('');try{const f=e.target.files[0];if(f){setDigest(await sha256Hex(await f.arrayBuffer()));setFileName(f.name);}}catch(err){setMsg(error(err));}}}/></label><small>{fileName} {digest}</small><small>Upload/pin the file separately; this form does not send files or secrets to Pinata.</small><button type="submit" disabled={busy||!digest}>Register batch</button></form>}
 {(role===1||role===2)&&<Action {...actionProps} name="Propose shipment" fn="proposeTransfer" fields={[{name:'id',label:'Batch ID',type:'number',min:1},{name:'to',label:'Recipient address'},{name:'deadline',label:'Deadline',type:'datetime-local'}]} convert={([id,to,deadline])=>{if(!isAddress(to)){throw new Error('Invalid recipient address');}return [id,to,Math.floor(new Date(deadline).getTime()/1000)];}}/>}
 {(role===2||role===3)&&<Action {...actionProps} name="Accept receipt" fn="acceptTransfer" fields={[{name:'id',label:'Batch ID',type:'number',min:1},{name:'nonce',label:'Pending shipment nonce',type:'number',min:1}]}/>}
 <Action {...actionProps} name="Cancel / reject shipment" fn="cancelTransfer" fields={[{name:'id',label:'Batch ID',type:'number',min:1}]}/>
 {role===3&&<Action {...actionProps} name="Dispense units" fn="dispense" fields={[{name:'id',label:'Batch ID',type:'number',min:1},{name:'units',label:'Units',type:'number',min:1}]}/>}
 {role>0&&<Action {...actionProps} name="Report simulated temperature" fn="reportTemperature" fields={[{name:'id',label:'Batch ID',type:'number',min:1},{name:'value',label:'Temperature °C',type:'number',step:'0.1'},{name:'evidence',label:'Evidence note (hashed; retain original off-chain)'}]} convert={async([id,v,note])=>[id,Math.round(Number(v)*10),await hash(note)]} />}
 {role===4&&<><Action {...actionProps} name="Release temperature hold" fn="releaseHold" fields={[{name:'id',label:'Batch ID',type:'number',min:1},{name:'evidence',label:'Review evidence SHA-256 (0x + 64 hex)'}]}/><Action {...actionProps} name="Recall batch permanently" fn="recallBatch" fields={[{name:'id',label:'Batch ID',type:'number',min:1},{name:'reason',label:'Reason SHA-256 (0x + 64 hex)'}]}/></>}
 {admin&&<><Action {...actionProps} name="Assign / revoke role" fn="assignRole" fields={[{name:'account',label:'Wallet address'},{name:'role',label:'Role number: 0 none, 1 manufacturer, 2 distributor, 3 pharmacy, 4 regulator',type:'number',min:0,max:4}]}/><Action {...actionProps} name="Propose new administrator" fn="proposeAdmin" fields={[{name:'nominee',label:'New administrator address'}]}/></>}
 <Action {...actionProps} name="Accept administrator nomination" fn="acceptAdmin" fields={[]}/>
 </div><div className="utility"><label>Hash an evidence note<input id="evidence-note" placeholder="Retain the original note in your evidence log"/></label><button type="button" onClick={async()=>{setMsg(await hash(document.getElementById('evidence-note').value));}}>Calculate SHA-256</button></div></section>}
 </>}
 <footer>Educational prototype · Synthetic records · Recorded provenance and policy eligibility do not establish physical authenticity or regulatory compliance.</footer></main></>;
}
createRoot(document.getElementById('root')).render(<App/>);
