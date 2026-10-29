import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const tests=readdirSync(new URL('../tests/',import.meta.url))
 .filter(name=>name.endsWith('.test.mjs')&&name!=='model.test.mjs')
 .sort().map(name=>`tests/${name}`);
if(!tests.length)throw Error('No test files found.');
const result=spawnSync(process.execPath,['--test','--test-concurrency=1',...tests],{cwd:root,stdio:'inherit'});
if(result.error)throw result.error;
process.exitCode=result.status??1;
