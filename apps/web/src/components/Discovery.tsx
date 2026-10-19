import {useEffect,useRef,useState} from 'react';
import {createExperimentRunner,syntheticMaskExperiment} from '../../../../packages/experiments/src/runtime.mjs';
import type {MaskMethod,RunResult} from '../../../../packages/experiments/src/runtime.mjs';
import type {CompiledLearningModule} from '@learning-machine/content';
import {createLearningSession,transitionLearningSession,availableRoutes} from '@learning-machine/socratic';
import type {LearningSession,LearningAction} from '@learning-machine/socratic';
const reasoning=new Set(['hypothesis','prediction','observation','explanation','revision','transfer']);
const titles:Record<string,string>={encounter:'Encounter',hypothesis:'Hypothesis',prediction:'Predict',experiment:'Experiment',observation:'Observe',explanation:'Explain',challenge:'Challenge',revision:'Revise',transfer:'Transfer',reflection:'Reflection',complete:'Complete'};
export default function Discovery({compiled}:{compiled:CompiledLearningModule}) {
 const [session,setSession]=useState<LearningSession>(()=>createLearningSession(compiled));
 const [draft,setDraft]=useState('');const [error,setError]=useState('');const [hypothesisForPrediction,setHypothesisForPrediction]=useState('');
 const [hydrated,setHydrated]=useState(false);useEffect(()=>setHydrated(true),[]);
 const runner=useRef(createExperimentRunner([syntheticMaskExperiment]));
 const requestToken=useRef(0);
 const [method,setMethod]=useState<MaskMethod>('selective');
 const [experimentStatus,setExperimentStatus]=useState<'idle'|'running'|'completed'|'failed'>('idle');
 const [experimentResult,setExperimentResult]=useState<RunResult|null>(null);
 useEffect(()=>()=>{requestToken.current++;runner.current.cancel('component-unmounted')},[]);
 async function runVisualExperiment(){
  const token=++requestToken.current;
  setExperimentResult(null);setExperimentStatus('running');setError('');
  const result=await runner.current.run('synthetic-masking-v1',{width:64,height:36,method,target:{x:22,y:12,width:12,height:10}});
  if(token!==requestToken.current)return;
  setExperimentResult(result);
  setExperimentStatus(result.status==='completed'?'completed':'failed');
  if(result.status==='completed'){
    setSession(previous=>{
      if(previous.stage!=='experiment')return previous;
      try{return transitionLearningSession(compiled,previous,{type:'OBSERVE',observation:result.observation})}
      catch{return previous}
    });
  }
 }
 const active=compiled.nodes.find(n=>n.id===session.nodeId);
 if(!active)return <p role="alert">The lesson node is unavailable.</p>;
 const index=compiled.nodes.findIndex(n=>n.id===session.nodeId);
 const routes=availableRoutes(compiled,session);
 function act(actions:LearningAction[]) {
  requestToken.current++;runner.current.cancel('learner-navigation');setExperimentStatus('idle');setExperimentResult(null);
  try{let next=session;for(const action of actions)next=transitionLearningSession(compiled,next,action);
  setSession(next);setDraft(next.answers[next.nodeId]||'');setError('');}catch(e){setError(e instanceof Error?e.message:'Action unavailable')}
 }
 function advance() {
  const actions:LearningAction[]=[];
  if(session.stage==='hypothesis'){
   if(draft.trim()){
    actions.push({type:'ANSWER',text:draft});
    if(!session.hypotheses.some(h=>h.text.toLocaleLowerCase()===draft.trim().toLocaleLowerCase()))actions.push({type:'PROPOSE_HYPOTHESIS',text:draft});
   }else if(!session.hypotheses.length)actions.push({type:'SKIP'});
  }else if(session.stage==='prediction'){
   if(!session.predictions.some(p=>p.nodeId===session.nodeId)){
    if(draft.trim())actions.push({type:'COMMIT_PREDICTION',text:draft,experimentId:'visual-masking-v1',...(hypothesisForPrediction?{hypothesisId:hypothesisForPrediction}:{})});
    else actions.push({type:'SKIP'});
   }
  }else if(reasoning.has(session.stage)){if(draft.trim())actions.push({type:'ANSWER',text:draft});else actions.push({type:'SKIP'});}
  else if(draft.trim())actions.push({type:'ANSWER',text:draft});
  if(session.stage==='experiment'&&!session.observations.some(o=>o.experimentId==='synthetic-masking-v1')){setError('Choose a method and run the actual local experiment before proceeding. You may also request a direct explanation.');return;}
  actions.push({type:'NEXT'});act(actions);
 }
 function propose(){
  if(!draft.trim()){setError('Enter a hypothesis to add it.');return;}
  try{
   const next=transitionLearningSession(compiled,session,{type:'PROPOSE_HYPOTHESIS',text:draft});
   setSession(next);setDraft('');setError('');
  }catch(e){setError(e instanceof Error?e.message:'Cannot add hypothesis');}
 }
 return <section className="learning-card" aria-label="Interactive Socratic learning exercise" role="region">
  <div className="exercise-header"><span className="stage-label">{titles[session.stage]}</span><span className="stage-label">Step {index+1} / {compiled.nodes.length}</span></div>
  <div className="progress" role="progressbar" aria-label="Learning journey progress" aria-valuenow={Math.round((index+1)/compiled.nodes.length*100)} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{width:(index+1)/compiled.nodes.length*100+'%'}}/></div>
  <h2>{active.prompt}</h2>
  {session.stage==='experiment'&&<><div className="comparison" aria-label="Illustrative masking alternatives">
   <section className="option"><h3>Selective masking</h3><p>Recognize the target's location, then obscure that region.</p></section>
   <section className="option"><h3>Blanket masking</h3><p>Obscure every pixel without recognizing a target.</p></section>
  </div><p className="status-note" role="note">This comparison is an authored thought experiment, not an actual camera measurement. {active.accessibleAlternative}</p></>}
  {session.stage==='prediction'&&!session.predictions.some(p=>p.nodeId===session.nodeId)&&session.hypotheses.length>0&&<label htmlFor="prediction-hypothesis" className="response-label">Which hypothesis are you testing?
   <select id="prediction-hypothesis" value={hypothesisForPrediction} onChange={e=>setHypothesisForPrediction(e.target.value)}>
    <option value="">A general prediction</option>
    {session.hypotheses.map(h=><option key={h.id} value={h.id}>{h.text}</option>)}
   </select>
  </label>}
  {session.predictions.length>0&&['prediction','experiment','observation','explanation','challenge','revision','transfer','reflection','complete'].includes(session.stage)&&<aside className="status-note" aria-label="Predictions committed before the experiment">
   <strong>Committed before the experiment</strong>
   <ol>{session.predictions.map(p=><li key={p.id}>{p.text} {p.hypothesisId&&<small>(testing hypothesis {p.hypothesisId})</small>}</li>)}</ol>
   <p>Compare this prediction with what you observe. The original prediction cannot be silently rewritten.</p>
  </aside>}
  {session.stage==='experiment'&&<fieldset aria-label="Run a local synthetic pixel experiment">
    <legend>Which masking method should the computer try?</legend>
    <label htmlFor="masking-method">Masking method</label>
    <select id="masking-method" value={method} onChange={e=>setMethod(e.target.value as MaskMethod)}>
     <option value="selective">Recognize the synthetic target color, then conceal it</option>
     <option value="blanket">Conceal every pixel without recognizing the target</option>
     <option value="known-position">Use previously provided coordinates</option>
    </select>
    <button type="button" className="action action-primary" disabled={!hydrated||experimentStatus==='running'} onClick={()=>{void runVisualExperiment()}}>{experimentStatus==='running'?'Computing locally…':'Run this experiment'}</button>
    {experimentResult?.status==='completed'&&<div className="status-note" role="status">
      <strong>Computed pixel result</strong><p>{experimentResult.observation.description}</p>
      <p>Result from an original generated 64×36-pixel scene. This is a real, bounded pixel computation in your browser, not a recording or legal conclusion.</p>
    </div>}
    {experimentResult&&experimentResult.status!=='completed'&&<p role="alert">Experiment {experimentResult.status}. {experimentResult.status==='failed'?experimentResult.error:'You can retry.'}</p>}
   </fieldset>}
  {session.stage==='challenge'&&<p className="status-note">Challenge your hypothesis: can the goal be achieved without identifying a symbol?</p>}
  {session.stage==='reflection'&&<p className="status-note">Selective masking usually requires locating the symbol, but blurring everything does not require identifying it. Different methods have different information requirements.</p>}
  {session.complete&&<p className="status-note" role="status">You completed the learning journey. Your reasoning matters—not which political position you take.</p>}
  {reasoning.has(session.stage)&&!session.complete&&!(session.stage==='prediction'&&session.predictions.some(p=>p.nodeId===session.nodeId))&&<label htmlFor="reasoning" className="response-label">Your reasoning (optional; you may skip)<textarea id="reasoning" className="response" rows={4} maxLength={10000} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="What do you think, and why?"/></label>}
  {session.stage==='hypothesis'&&<div aria-label="Your proposed hypotheses" role="group">
   <button className="action" disabled={!hydrated} onClick={propose}>Add alternative hypothesis</button>
   {session.hypotheses.length>0&&<ol aria-label="Hypothesis alternatives">{session.hypotheses.map(h=><li key={h.id}>{h.text} <button className="action" disabled={!hydrated} aria-label={'Remove hypothesis '+h.id} onClick={()=>act([{type:'REMOVE_HYPOTHESIS',id:h.id}])}>Remove</button></li>)}</ol>}
   <p className="lesson-data">You can propose several different solutions. None is graded for agreement with the bill.</p>
  </div>}
  {error&&<p role="alert" className="error">{error}</p>}
  <div className="controls">
   {!session.complete&&routes.some(r=>r.when==='always')&&<button className="action action-primary" disabled={!hydrated} onClick={advance}>{session.stage==='prediction'?(session.predictions.some(p=>p.nodeId===session.nodeId)?'Continue with committed prediction':(draft.trim()?'Commit prediction and continue':'Continue without prediction')):'Continue'}{session.stage!=='prediction'&&draft.trim()?' with your answer':''}</button>}
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
