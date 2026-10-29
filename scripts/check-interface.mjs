import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import solc from 'solc';
import {Interface} from 'ethers';
import {compile} from './compile.mjs';

// Compile the documented design separately to preserve implementation metadata.
const file='contracts/interfaces/IMedTraceGuard.sol';
const output=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{[file]:{content:readFileSync(file,'utf8')}},settings:{outputSelection:{'*':{'*':['abi']}}}})));
for(const d of output.errors??[]) if(d.severity==='error') throw Error(d.formattedMessage);
const design=new Interface(output.contracts[file].IMedTraceGuard.abi);
const actual=new Interface(compile().MedTraceGuard.abi);
// Keep canonical types, tuple shapes, outputs, mutability, and event indexing.
// Ignore parameter names, which differ in Solidity-generated public getters.
const normalize=iface=>iface.fragments.filter(f=>f.type!=='constructor').map(f=>{
 const j=JSON.parse(f.format('json'));
 const clean=x=>Array.isArray(x)?x.map(clean):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).filter(([k])=>k!=='name'&&k!=='internalType').map(([k,v])=>[k,clean(v)])):x;
 return JSON.stringify({name:j.name,...clean(j)});
}).sort();
assert.deepEqual(normalize(design),normalize(actual),'Design interface must match implementation ABI');
console.log(`PASS: ${design.fragments.length} documented ABI entries match implementation.`);
