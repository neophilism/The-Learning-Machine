import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync(new URL('../registry/legacy-prs.json',import.meta.url),'utf8'));
const units=data.work_units;
const fail=(s)=>{throw new Error(`Registry: ${s}`)};
if(!Array.isArray(units)||units.length!==96)fail('expected exactly 96 units');
if(!Array.isArray(data.phases)||data.phases.length!==12)fail('expected 12 phases');
const known=new Set();const titles=new Set();const statuses=new Set(['planned','in_progress','in_review','blocked','merged','superseded']);
for(let i=0;i<units.length;i++){
 const u=units[i],id=`TLM-${String(i+1).padStart(3,'0')}`;
 if(u.id!==id)fail(`unexpected ID at ${i+1}`);
 if(!statuses.has(u.status))fail(`bad status for ${id}`);
 if(titles.has(u.title))fail(`duplicate title for ${id}`);
 titles.add(u.title);
 if(!data.phases.some(p=>p.id===u.phase))fail(`unknown phase for ${id}`);
 if(!Array.isArray(u.depends_on)||!u.depends_on.every(x=>known.has(x)))fail(`invalid predecessor dependency for ${id}`);
 if(!Array.isArray(u.acceptance_criteria)||u.acceptance_criteria.length<2||u.acceptance_criteria.some(x=>!x.trim()))fail(`incomplete acceptance for ${id}`);
 if(u.status==='merged'&&(!u.merged_commit||!u.verification_evidence?.length))fail(`merge without evidence ${id}`);
 if(u.github_pr_number!==null&&!Number.isInteger(u.github_pr_number))fail(`invalid GitHub number ${id}`);
 known.add(id);
}

const canonical = JSON.parse(fs.readFileSync(new URL('../registry/prs.json', import.meta.url), 'utf8'));
if (canonical.schemaVersion !== 1 || canonical.repository !== data.repository
  || canonical.units.length !== units.length || canonical.plannedPrCount !== units.length
  || canonical.planVerified !== true || canonical.legacyPlanFile !== 'registry/legacy-prs.json')
  fail('canonical adapter does not preserve original source');
for (let i = 0; i < units.length; i++) {
  const original = units[i], converted = canonical.units[i];
  if (converted.id !== original.id || converted.title !== original.title
    || JSON.stringify(converted.dependsOn) !== JSON.stringify(original.depends_on)
    || JSON.stringify(converted.prs) !== JSON.stringify(original.github_pr_number === null ? [] : [original.github_pr_number])
    || converted.legacyStatus !== original.status
    || converted.acceptanceCriteria !== original.acceptance_criteria.join('\n'))
    fail('canonical adapter changed original unit ' + original.id);
}
const snapshots = new Map(canonical.pullRequests.map(p => [p.number, p]));
for (const unit of canonical.units) for (const n of unit.prs) {
  const p = snapshots.get(n);
  if (!p || p.url !== 'https://github.com/' + data.repository + '/pull/' + n
    || !Number.isSafeInteger(p.id) || !['open', 'closed'].includes(p.state)
    || typeof p.draft !== 'boolean')
    fail('invalid or missing GitHub evidence #' + n);
}

console.log(`Valid: ${units.length} work units, ${data.phases.length} phases, predecessor-only DAG.`);
