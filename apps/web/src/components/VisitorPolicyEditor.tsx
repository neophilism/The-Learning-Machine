import {useEffect,useMemo,useState} from 'react';
import {
 createVisitorPolicyRuleSet,
 previewVisitorPolicyRuleSet,
 serializeVisitorPolicyRuleSet,
} from '../../../../packages/policy-lab/src/editor.mjs';
import type {PolicyEffect} from '../../../../packages/policy-lab/src/compiler.mjs';

const exampleFacts={
 'access.method':'license' as const,
 'access.lawful':true,
 'copying.intermediateCopies':true,
 'retention.durationDays':1,
 'teaching.performed':true,
 'outputs.distributed':false,
};
const labels:Record<string,string>={
 'access.method':'Access method',
 'access.lawful':'Lawful access',
 'copying.intermediateCopies':'Intermediate copies',
 'retention.durationDays':'Retention days',
 'teaching.performed':'Teaching',
 'outputs.distributed':'Distributed output',
};
const show=(value:string|number|boolean|null)=>value===null?'unknown':String(value);

export default function VisitorPolicyEditor(){
 const [hydrated,setHydrated]=useState(false);
 useEffect(()=>setHydrated(true),[]);
 const [effect,setEffect]=useState<PolicyEffect>('permit');
 const [accessMethod,setAccessMethod]=useState('license');
 const [lawfulAccess,setLawfulAccess]=useState(true);
 const [intermediateCopies,setIntermediateCopies]=useState(true);
 const [retentionDurationDays,setRetentionDurationDays]=useState(1);
 const [teaching,setTeaching]=useState(true);
 const [distributedOutput,setDistributedOutput]=useState(false);
 const ruleSet=useMemo(()=>createVisitorPolicyRuleSet({
  schemaVersion:'1.0.0',id:'visitor-draft',effect,accessMethod:accessMethod as 'purchase'|'license'|'borrow'|'stream'|'public-source'|'unauthorized'|'unknown',
  lawfulAccess,intermediateCopies,retentionDurationDays,teaching,distributedOutput,
 }),[effect,accessMethod,lawfulAccess,intermediateCopies,retentionDurationDays,teaching,distributedOutput]);
 const preview=useMemo(()=>previewVisitorPolicyRuleSet(ruleSet,exampleFacts),[ruleSet]);
 const serialized=useMemo(()=>serializeVisitorPolicyRuleSet(ruleSet),[ruleSet]);
 return <section className="learning-card policy-editor" aria-labelledby="policy-editor-title">
  <p className="eyebrow">Hypothetical rule studio</p>
  <h2 id="policy-editor-title">Write one bounded rule, then test it against the same facts.</h2>
  <p>This local editor creates a hypothetical rule. It is not current law, proposed-bill text, or legal advice.</p>
  <div className="policy-grid">
   <fieldset><legend>Rule effect and controlled terms</legend>
    <label htmlFor="policy-effect">Effect when every term matches<select id="policy-effect" disabled={!hydrated} value={effect} onChange={event=>setEffect(event.target.value as PolicyEffect)}>
     <option value="permit">Permit</option><option value="restrict">Restrict</option><option value="conditional">Conditional</option><option value="unresolved">Unresolved</option>
    </select></label>
    <label htmlFor="access-method">Access method<select id="access-method" disabled={!hydrated} value={accessMethod} onChange={event=>setAccessMethod(event.target.value)}>
     <option value="purchase">Purchase</option><option value="license">License</option><option value="borrow">Borrow</option><option value="stream">Stream</option><option value="public-source">Public source</option><option value="unauthorized">Unauthorized</option><option value="unknown">Unknown</option>
    </select></label>
    <label htmlFor="retention-days">Exact retention duration in days<input id="retention-days" disabled={!hydrated} type="number" min="0" max="36500" step="1" value={retentionDurationDays} onChange={event=>setRetentionDurationDays(Math.max(0,Math.min(36500,Number.parseInt(event.target.value||'0',10))))}/></label>
    <label className="check-term"><input type="checkbox" disabled={!hydrated} checked={lawfulAccess} onChange={event=>setLawfulAccess(event.target.checked)}/> Access is lawful</label>
    <label className="check-term"><input type="checkbox" disabled={!hydrated} checked={intermediateCopies} onChange={event=>setIntermediateCopies(event.target.checked)}/> Intermediate copies are made</label>
    <label className="check-term"><input type="checkbox" disabled={!hydrated} checked={teaching} onChange={event=>setTeaching(event.target.checked)}/> Teaching is performed</label>
    <label className="check-term"><input type="checkbox" disabled={!hydrated} checked={distributedOutput} onChange={event=>setDistributedOutput(event.target.checked)}/> Output is distributed</label>
   </fieldset>
   <section className="policy-preview" aria-labelledby="preview-title"><h3 id="preview-title">Same-facts preview</h3>
    <p>The example uses licensed, lawful access; intermediate copies; one day of retention; teaching; and no distributed output.</p>
    <p className="status-note" role="status"><strong>{preview.applicability==='matched'?'Rule matches the example.':preview.applicability==='unknown'?'The example has an unknown material fact.':'Rule does not match the example.'}</strong><br/>Outcome: {preview.outcome}. Selected effect: {preview.selectedEffect}.</p>
    <table><thead><tr><th>Term</th><th>Rule</th><th>Example</th><th>Status</th></tr></thead><tbody>{preview.termResults.map(term=><tr key={term.fact}><th scope="row">{labels[term.fact]}</th><td>{show(term.expected)}</td><td>{show(term.actual)}</td><td>{term.status}</td></tr>)}</tbody></table>
   </section>
  </div>
  <label htmlFor="serialized-policy">Portable local JSON<textarea id="serialized-policy" readOnly rows={8} value={serialized}/></label>
  <p className="lesson-data">The JSON stays in this page unless you deliberately save it. Import validation rejects extra fields, unknown terms, arbitrary code, and non-hypothetical frameworks.</p>
 </section>;
}

