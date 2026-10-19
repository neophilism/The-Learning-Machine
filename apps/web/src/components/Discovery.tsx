import {useEffect,useState} from 'react';
import type {CompiledLearningModule} from '@learning-machine/content';
import {createLearningSession,transitionLearningSession,availableRoutes} from '@learning-machine/socratic';
import type {LearningSession,LearningAction} from '@learning-machine/socratic';
const reasoning=new Set(['hypothesis','prediction','observation','explanation','revision','transfer']);
const titles:Record<string,string>={encounter:'Encounter',hypothesis:'Hypothesis',prediction:'Predict',experiment:'Experiment',observation:'Observe',explanation:'Explain',challenge:'Challenge',revision:'Revise',transfer:'Transfer',reflection:'Reflection',complete:'Complete'};
export default function Discovery({compiled}:{compiled:CompiledLearningModule}) {
 const [session,setSession]=useState<LearningSession>(()=>createLearningSession(compiled));
 const [draft,setDraft]=useState('');const [error,setError]=useState('');
 const [alternatives,setAlternatives]=useState<string[]>([]);
 const [hydrated,setHydrated]=useState(false);useEffect(()=>setHydrated(true),[]);
 const active=compiled.nodes.find(n=>n.id===session.nodeId);
 if(!active)return <p role="alert">The lesson node is unavailable.</p>;
 const index=compiled.nodes.findIndex(n=>n.id===session.nodeId);
 const routes=availableRoutes(compiled,session);
 function act(actions:LearningAction[]) {
  try{let next=session;for(const action of actions)next=transitionLearningSession(compiled,next,action);
  setSession(next);setDraft(next.answers[next.nodeId]||'');setError('');}catch(e){setError(e instanceof Error?e.message:'Action unavailable')}
 }
 function advance() {
  const actions:LearningAction[]=[];
  if(reasoning.has(session.stage)){
   const answer=session.stage==='hypothesis'?[...alternatives,...(draft.trim()?[draft.trim()]:[])].join('\n— Alternative approach —\n'):draft.trim();
   if(answer)actions.push({type:'ANSWER',text:answer});else actions.push({type:'SKIP'});
  }
  else if(draft.trim())actions.push({type:'ANSWER',text:draft});
  actions.push({type:'NEXT'});act(actions);
 }
 return <section className="learning-card" aria-label="Interactive Socratic learning exercise" role="region">
  <div className="exercise-header"><span className="stage-label">{titles[session.stage]}</span><span className="stage-label">Step {index+1} / {compiled.nodes.length}</span></div>
  <div className="progress" role="progressbar" aria-label="Learning journey progress" aria-valuenow={Math.round((index+1)/compiled.nodes.length*100)} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{width:(index+1)/compiled.nodes.length*100+'%'}}/></div>
  <h2>{active.prompt}</h2>
  {session.stage==='experiment'&&<><div className="comparison" aria-label="Illustrative masking alternatives">
   <section className="option"><h3>Selective masking</h3><p>Recognize the target's location, then obscure that region.</p></section>
   <section className="option"><h3>Blanket masking</h3><p>Obscure every pixel without recognizing a target.</p></section>
  </div><p className="status-note" role="note">This comparison is an authored thought experiment, not an actual camera measurement. {active.accessibleAlternative}</p></>}
  {session.stage==='challenge'&&<p className="status-note">Challenge your hypothesis: can the goal be achieved without identifying a symbol?</p>}
  {session.stage==='reflection'&&<p className="status-note">Selective masking usually requires locating the symbol, but blurring everything does not require identifying it. Different methods have different information requirements.</p>}
  {session.complete&&<p className="status-note" role="status">You completed the learning journey. Your reasoning matters—not which political position you take.</p>}
  {reasoning.has(session.stage)&&!session.complete&&<label htmlFor="reasoning" className="response-label">Your reasoning (optional; you may skip)<textarea id="reasoning" className="response" rows={4} maxLength={10000} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="What do you think, and why?"/></label>}
  {session.stage==='hypothesis'&&!session.complete&&<section aria-label="Alternative approaches">
    <p className="status-note">There may be several workable solutions. Record distinct approaches before making your prediction; no answer is graded for agreeing with the proposed law.</p>
    {alternatives.length>0&&<ol aria-label="Your proposed approaches">{alternatives.map((approach,i)=><li key={i}>{approach} <button type="button" className="action" disabled={!hydrated} onClick={()=>setAlternatives(old=>old.filter((_,j)=>j!==i))} aria-label={'Remove approach '+(i+1)}>Remove</button></li>)}</ol>}
    <button type="button" className="action" disabled={!hydrated||!draft.trim()||alternatives.length>=10} onClick={()=>{const text=draft.trim();if(!text)return; if(alternatives.some(x=>x.toLowerCase()===text.toLowerCase())){setError('This approach is already recorded. Try a different one.');return;}setAlternatives(old=>[...old,text]);setDraft('');setError('');}}>Record this approach and try another</button>
   </section>}
  {error&&<p role="alert" className="error">{error}</p>}
  <div className="controls">
   {!session.complete&&routes.some(r=>r.when==='always')&&<button className="action action-primary" disabled={!hydrated} onClick={advance}>Continue{draft.trim()?' with your answer':''}</button>}
   {!session.complete&&routes.filter(r=>r.when==='alternative').map(r=><button key={r.to} className="action" disabled={!hydrated} onClick={()=>act([{type:'CHOOSE',to:r.to}])}>Explore alternative: {r.to}</button>)}
   {!session.complete&&routes.filter(r=>r.when==='retry').map(r=><button key={r.to} className="action" disabled={!hydrated} onClick={()=>act([{type:'RETRY',to:r.to}])}>Retry</button>)}
   <button className="action" onClick={()=>act([{type:'BACK'}])} disabled={!hydrated||!session.history.length}>Previous</button>
   {!session.complete&&session.stage!=='reflection'&&<button className="action" disabled={!hydrated} onClick={()=>act([{type:'REQUEST_EXPLANATION'}])}>See direct explanation</button>}
   <button className="action" disabled={!hydrated} onClick={()=>act([{type:'RESET'}])}>Restart</button>
  </div>
  <div className="lesson-data"><span aria-live="polite">Actions: {session.actions.length}</span><span>Answers: {Object.keys(session.answers).length}</span><span>Skipped: {session.skipped.length}</span><span>No login or media upload</span></div>
  <details><summary>Review your hypotheses</summary><ol>{session.actions.filter(a=>a.type==='ANSWER').map((a,i)=><li key={i}>{a.type==='ANSWER'?a.text:''}</li>)}</ol><p>Answers remain in this page's local runtime until you restart.</p></details>
 </section>;
}
