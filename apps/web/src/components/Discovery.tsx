import {useState} from 'react';
import {initialState,transition} from '../../../../src/learning.mjs';

const prompts: Record<string,string>={
 encounter:'Consider a camera that must obscure a fictional symbol before displaying a live image. How might it do that?',
 hypothesis:'What approach would you try? Your solution may be completely different from automatic recognition.',
 prediction:'What do you expect your approach to require from the camera?',
 experiment:'Experiment planning: compare selectively hiding a symbol with blurring an entire image. What would you test?',
 observation:'What did you notice about the information needed by your proposed method?',
 explanation:'Why do selective recognition and blanket masking differ?',
 challenge:'Could another approach avoid recognizing the symbol entirely?',
 revision:'Revise or defend your explanation using the counterexample.',
 transfer:'Apply your reasoning to censoring speech or translating audio.',
 reflection:'What insight did you discover? This foundation lesson is a demonstration of the learning cycle.',
 complete:'You have completed the introductory reasoning cycle.'
};

export default function Discovery(){
 const [state,setState]=useState(initialState());
 const [answer,setAnswer]=useState('');
 const [error,setError]=useState('');
 const required=new Set(['hypothesis','prediction','observation','explanation','revision','transfer']);
 function act(type: 'ADVANCE'|'BACK'|'RESET'|'DIRECT_ANSWER'){
   try {
     setState((previous)=>transition(previous,{type,answer}));
     setAnswer('');setError('');
   } catch(e) {setError(e instanceof Error?e.message:'An unexpected error occurred');}
 }
 return <section aria-label="Interactive learning exercise" style={{background:'#fff',border:'1px solid #d6e2ed',borderRadius:'18px',padding:'clamp(1rem,3vw,2rem)',boxShadow:'0 10px 28px #173d5810'}}>
   <p style={{color:'#467084',textTransform:'uppercase',letterSpacing:'.12em',fontSize:'.72rem'}}>Foundation exercise • {state.stage}</p>
   <h2 style={{marginTop:0,fontSize:'1.3rem'}}>{prompts[state.stage]}</h2>
   {state.stage==='experiment'&&<p role="note" style={{background:'#eaf3fb',padding:'1rem',borderRadius:'.8rem'}}>This first release demonstrates the Socratic process. A real camera and classification experiment is implemented in later roadmap units; no measurement is claimed here.</p>}
   {required.has(state.stage)&&<label style={{display:'block'}}>Your reasoning<textarea value={answer} onChange={e=>setAnswer(e.target.value)} rows={3} style={{display:'block',width:'100%',padding:'.75rem',marginTop:'.5rem',borderRadius:'.5rem',border:'1px solid #a2b4c0'}}/></label>}
   {error&&<p role="alert" style={{color:'#9d2630'}}>{error}</p>}
   <div style={{display:'flex',flexWrap:'wrap',gap:'.65rem',marginTop:'1.25rem'}}>
      {state.stage!=='complete'&&<button onClick={()=>act('ADVANCE')} style={{background:'#143f62',color:'#fff',padding:'.7rem 1.2rem',borderRadius:'.5rem',border:0}}>Continue</button>}
      <button onClick={()=>act('BACK')} disabled={state.stage==='encounter'}>Previous step</button>
      <button onClick={()=>act('DIRECT_ANSWER')}>See direct explanation</button>
      <button onClick={()=>act('RESET')}>Start again</button>
   </div>
   {state.stage==='reflection'&&<p>Selective masking generally requires identifying the target. Blanket masking does not. Different solutions have different technical and legal implications; this exercise does not determine the lawfulness of any specific use.</p>}
   <p aria-live="polite" style={{color:'#577181',fontSize:'.85rem',marginBottom:0}}>Steps recorded locally in this page: {state.events.length}. No account required.</p>
 </section>;
}
