import http from 'node:http';import {readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
const root=resolve('.');const types={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};
const allowed=new Set(['/preview/index.html','/shared/model.mjs','/src/style.css']);
const server=http.createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;const path=pathname==='/'?'/preview/index.html':decodeURIComponent(pathname);if(!allowed.has(path))throw Error('Forbidden');const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw Error('Forbidden');const data=await readFile(file);const ext=file.slice(file.lastIndexOf('.'));res.writeHead(200,{'Content-Type':types[ext]??'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}});
server.listen(4173,'127.0.0.1',()=>console.log('Specification-model preview: http://127.0.0.1:4173 (SIMULATION ONLY, no blockchain)'));
