// A faithful projection of actual learner predictions and experiment observations.
// This deliberately does not grade a prediction as politically or scientifically correct.
const kinds=Object.freeze({measured:'Instrument measurement',computed:'Computed from executed code',simulated:'Illustrative simulation',unknown:'Unverified or unknown'});
export function evidenceKindLabel(kind){if(!Object.hasOwn(kinds,kind))throw new TypeError('Unknown evidence kind');return kinds[kind]}
export function comparePredictionEvidence(session,experimentId){
 if(!session||typeof session!=='object'||!Array.isArray(session.predictions)||!Array.isArray(session.observations))throw new TypeError('Invalid learner evidence state');
 if(typeof experimentId!=='string'||!experimentId.trim())throw new TypeError('Experiment identifier required');
 const predictions=session.predictions.filter(p=>p.experimentId===experimentId).map(p=>Object.freeze({id:p.id,text:p.text,hypothesisId:p.hypothesisId||null,nodeId:p.nodeId}));
 const observations=session.observations.filter(o=>o.experimentId===experimentId).map(o=>Object.freeze({
  runId:o.runId,kind:o.kind,kindLabel:evidenceKindLabel(o.kind),description:o.description,
  value:o.value??null,unit:o.unit??null,sourceId:o.sourceId??null,uncertainty:o.uncertainty??null
 }));
 const outcomes=predictions.map(p=>Object.freeze({prediction:p,observations,status:observations.length?'evidence_available':'not_yet_tested'}));
 return Object.freeze({experimentId,predictions:Object.freeze(predictions),observations:Object.freeze(observations),
  outcomes:Object.freeze(outcomes),predictionSkipped:predictions.length===0,requiresInterpretation:true});
}
