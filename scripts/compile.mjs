import solc from 'solc';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
export function compile() {
  const sources = Object.fromEntries(['MedTraceGuard','MedTraceBaseline'].map(n=>[`contracts/${n}.sol`, {content:readFileSync(`contracts/${n}.sol`,'utf8')} ]));
  const output=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources,settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}})));
  for(const e of output.errors??[]) { if(e.severity==='error') throw Error(e.formattedMessage); console.warn(e.formattedMessage); }
  mkdirSync('artifacts',{recursive:true});
  const result={};
  for(const [file,contracts] of Object.entries(output.contracts)) for(const [name,c] of Object.entries(contracts)) {
    const deployedBytes=c.evm.deployedBytecode.object.length/2;
    if(deployedBytes>24576) throw Error(`${name} exceeds EIP-170 size limit`);
    const artifact={contractName:name,compiler:solc.version(),evmVersion:'shanghai',abi:c.abi,bytecode:'0x'+c.evm.bytecode.object,deployedBytes};
    writeFileSync(`artifacts/${name}.json`,JSON.stringify(artifact,null,2)); result[name]=artifact;
  }
  return result;
}
if(import.meta.url===pathToFileURL(process.argv[1]).href) console.log(Object.fromEntries(Object.entries(compile()).map(([n,a])=>[n,{deployedBytes:a.deployedBytes}])));
