import type {LearningSession} from '@learning-machine/socratic';
import {comparePredictionEvidence} from '../../../../packages/socratic/src/evidence.mjs';
export default function EvidencePanel({session,experimentId}:{session:LearningSession;experimentId:string}){
 const comparison=comparePredictionEvidence(session,experimentId);
 return <aside className="status-note" aria-label="Prediction and observed evidence comparison">
  <h3>Compare your prediction with the evidence</h3>
  {comparison.predictionSkipped?<p>No prediction was committed. You can still investigate what happened.</p>:
   <ol aria-label="Original predictions">{comparison.outcomes.map(x=><li key={x.prediction.id}>
    <strong>Before the experiment:</strong> {x.prediction.text}
    {x.status==='not_yet_tested'&&<p>No experimental observation has been recorded for this prediction.</p>}
   </li>)}</ol>}
  {comparison.observations.length?<ol aria-label="Observed experiment results">{comparison.observations.map(o=><li key={o.runId}>
   <strong>{o.kindLabel}:</strong> {o.description}
   {o.value!==null&&<p>Result: {String(o.value)} {o.unit??''}</p>}
   <p>Run {o.runId}; source {o.sourceId??'not specified'}.</p>
   {o.uncertainty&&<p>Limitation: {o.uncertainty}</p>}
  </li>)}</ol>:<p>No observed results have been recorded yet.</p>}
  <p><strong>Your judgment:</strong> Does this result support, contradict, or qualify your original prediction? Explain in your own words; the system does not grade your policy position.</p>
 </aside>;
}
