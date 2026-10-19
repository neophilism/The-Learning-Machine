import test from 'node:test';import assert from 'node:assert/strict';
import {comparePredictionEvidence,evidenceKindLabel} from '../src/evidence.mjs';
const base={predictions:[{id:'p1',nodeId:'prediction-node',hypothesisId:'h1',experimentId:'synthetic-masking-v1',text:'Target is concealed without identifying it'}],
 observations:[{schemaVersion:'1.0.0',experimentId:'synthetic-masking-v1',runId:'local-run-1',kind:'computed',description:'Masked 120 pixels',value:120,unit:'pixels',sourceId:'original-synthetic-pixel-frame'}]};
test('pinned learner prediction and computed observation are displayed together without artificial verdicts',()=>{
 const x=comparePredictionEvidence(base,'synthetic-masking-v1');
 assert.equal(x.outcomes[0].status,'evidence_available');
 assert.equal(x.outcomes[0].prediction.text,base.predictions[0].text);
 assert.equal(x.observations[0].kindLabel,'Computed from executed code');
 assert.equal(x.observations[0].sourceId,'original-synthetic-pixel-frame');
 assert.equal(x.requiresInterpretation,true);
});
test('unobserved prediction does not appear experimentally verified',()=>{
 const x=comparePredictionEvidence({...base,observations:[]},'synthetic-masking-v1');
 assert.equal(x.outcomes[0].status,'not_yet_tested');assert.deepEqual(x.observations,[]);
});
test('explicitly skipped predictions do not turn into fabricated hypotheses',()=>{
 const x=comparePredictionEvidence({...base,predictions:[]},'synthetic-masking-v1');
 assert.equal(x.predictionSkipped,true);assert.equal(x.observations.length,1);
});
test('other experiment evidence is excluded from a comparison',()=>{
 const x=comparePredictionEvidence({...base,observations:[...base.observations,{...base.observations[0],experimentId:'unrelated'}]},'synthetic-masking-v1');assert.equal(x.observations.length,1);
});
test('all scientific evidence categories are distinguished',()=>{
 assert.match(evidenceKindLabel('measured'),/measurement/i);assert.match(evidenceKindLabel('simulated'),/simulation/i);
 assert.match(evidenceKindLabel('unknown'),/unknown/i);assert.throws(()=>evidenceKindLabel('guessed'),TypeError);
});
test('malformed evidence does not pass as a comparison',()=>assert.throws(()=>comparePredictionEvidence(null,'vision'),TypeError));
