import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const deps={
 contracts:new Set(),
 content:new Set(['@learning-machine/contracts','node:crypto']),
 socratic:new Set(['@learning-machine/contracts','@learning-machine/content']),
 experiments:new Set(['@learning-machine/contracts'])
};
export function findForbiddenImports(text,allowed){
 const matches=[...text.matchAll(/\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)];
 return matches.map(x=>x[1]||x[2]).filter(x=>!x.startsWith('.')&&!allowed.has(x));
}
export function checkBoundaries(){
 const failures=[];
 for(const [name,allowed] of Object.entries(deps)){
  const directory=join(root,'packages',name,'src');
  for(const f of readdirSync(directory).filter(x=>/\.(mjs|mts|ts|tsx)$/.test(x))){
   const rel='packages/'+name+'/src/'+f;
   for(const bad of findForbiddenImports(readFileSync(join(directory,f),'utf8'),allowed))failures.push(rel+': prohibited dependency '+bad);
  }
  const pkg=JSON.parse(readFileSync(join(root,'packages',name,'package.json'),'utf8'));
  for(const dep of Object.keys(pkg.dependencies||{}))if(dep.startsWith('@learning-machine/')&&!allowed.has(dep))failures.push('packages/'+name+': undeclared internal import boundary '+dep);
 }
 const web=join(root,'apps/web/src/components');
 for(const f of readdirSync(web).filter(x=>/\.(ts|tsx|mjs)$/.test(x)))if(/\bfrom\s*['"]node:/.test(readFileSync(join(web,f),'utf8')))failures.push('apps/web/src/components/'+f+': Node runtime import in browser UI');
 return failures;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===fileURLToPath(new URL('file://'+process.argv[1]))){
 const failures=checkBoundaries();
 if(failures.length){for(const f of failures)console.error(f);process.exitCode=1}else console.log('Package boundaries validated.');
}
