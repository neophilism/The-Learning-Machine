import {readdirSync,readFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const ignore=new Set(['.git','node_modules','.astro','dist','coverage','test-results','.next','.pnpm-store']);
const patterns=[
 new RegExp('gh'+'p_[A-Za-z0-9]{30,}','g'),
 new RegExp('github'+'_pat_[A-Za-z0-9_]{50,}','g'),
 new RegExp('AK'+'IA[0-9A-Z]{16}','g'),
 new RegExp('sk'+'-[A-Za-z0-9_-]{32,}','g'),
 new RegExp('-----BEGIN '+'(?:RSA |EC |OPENSSH )?PRIVATE KEY-----','g')
];
export function findCredentialPatterns(value){return patterns.flatMap(p=>[...value.matchAll(p)].map(m=>m[0].slice(0,10)+'…'))}
function* files(dir){
 for(const e of readdirSync(dir,{withFileTypes:true})){
  if(ignore.has(e.name))continue;const path=join(dir,e.name);
  if(e.isDirectory())yield* files(path);
  else if(e.isFile()&&/\.(md|ts|tsx|mjs|js|json|yaml|yml|astro|html|css|env)$/.test(e.name)&&statSync(path).size<=1_000_000)yield path;
 }
}
export function scanRepository(){
 const problems=[];
 for(const file of files(root)){
  const hits=findCredentialPatterns(readFileSync(file,'utf8'));
  if(hits.length)problems.push(file.slice(root.length)+' contains '+hits.length+' credential-like sequence(s)');
 }
 return problems;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===fileURLToPath(new URL('file://'+process.argv[1]))){
 const failures=scanRepository();
 if(failures.length){failures.forEach(x=>console.error(x));process.exitCode=1}else console.log('No credential-like sequences in source inputs.');
}
