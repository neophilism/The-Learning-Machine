import {readFileSync} from 'node:fs';
const reg=JSON.parse(readFileSync(new URL('../registry/prs.json',import.meta.url),'utf8'));
const accepted=new Set(reg.work_units.filter(u=>u.status==='merged'&&u.merged_commit&&u.verification_evidence?.length).map(u=>u.id));
const ready=reg.work_units.filter(u=>u.status==='planned'&&u.depends_on.every(d=>accepted.has(d)));
for(const u of ready)console.log(u.id+' '+u.title+' [requires '+(u.depends_on.join(', ')||'none')+']');
if(!ready.length)console.log('No additional registry-ready work; inspect active PR heads and blockers.');
