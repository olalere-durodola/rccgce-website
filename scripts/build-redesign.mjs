import {spawnSync} from 'node:child_process';
import {cpSync, mkdirSync, readdirSync, rmSync} from 'node:fs';
import {resolve, join} from 'node:path';

const root=resolve(new URL('..',import.meta.url).pathname);
const result=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:join(root,'redesign'),stdio:'inherit'});
if(result.status!==0)process.exit(result.status??1);
const output=join(root,'public','redesign-assets');
rmSync(output,{recursive:true,force:true});mkdirSync(output,{recursive:true});
// HTML and the extraction records never enter public/. Only public media/code.
for(const file of readdirSync(join(root,'redesign','dist'))){
  if(file==='assets'||file.endsWith('.mjs')||file==='styles.css'){
    cpSync(join(root,'redesign','dist',file),join(output,file),{recursive:true});
  }
}
