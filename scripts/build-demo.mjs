import {execFileSync} from 'node:child_process';
import {cpSync,rmSync,writeFileSync} from 'node:fs';
execFileSync(process.platform==='win32'?'npm.cmd':'npm',['run','build','--prefix','frontend'],{stdio:'inherit',env:{...process.env,VITE_DEMO_ONLY:'true'},shell:process.platform==='win32'});
rmSync('assets',{recursive:true,force:true});
cpSync('frontend/dist/assets','assets',{recursive:true});
cpSync('frontend/dist/index.html','index.html');
writeFileSync('.nojekyll','');
