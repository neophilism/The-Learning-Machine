import test from 'node:test';
import assert from 'node:assert/strict';
import {compileLearningModule} from '@learning-machine/content';
import {createLearningSession,transitionLearningSession,replayLearningActions} from '../src/engine.mjs';
const module=compileLearningModule({schemaVersion:'1.0.0',id:'prediction-fixture',title:'Predictions before observations',startNodeId:'e',concepts:['reason'],nodes:[
{id:'e',stage:'encounter',prompt:'Encounter',concepts:['reason'],edges:[{to:'h'}]},
{id:'h',stage:'hypothesis',prompt:'Hypothesize',edges:[{to:'p'}]},
{id:'p',stage:'prediction',prompt:'Predict',edges:[{to:'x'}]},
{id:'x',stage:'experiment',prompt:'Experiment',accessibleAlternative:'Text experiment',edges:[{to:'o'}]},
{id:'o',stage:'observation',prompt:'Observe',edges:[{to:'c'}]},
{id:'c',stage:'complete',prompt:'Done',terminal:true,edges:[]}]});
const enter=()=>{let s=createLearningSession(module);s=transitionLearningSession(module,s,{type:'NEXT'});s=transitionLearningSession(module,s,{type:'PROPOSE_HYPOTHESIS',text:'Conceal everything'});s=transitionLearningSession(module,s,{type:'NEXT'});return s;};
const commit=(s,txt='Whole-frame masking does not need recognition')=>transitionLearningSession(module,s,{type:'COMMIT_PREDICTION',text:txt,experimentId:'vision-v1',hypothesisId:'h1'});
test('prediction is explicitly committed before experimental observation',()=>{let s=enter();assert.throws(()=>transitionLearningSession(module,s,{type:'NEXT'}),/Commit or explicitly skip/);s=commit(s);assert.equal(s.predictions[0].hypothesisId,'h1');assert.equal(s.predictions[0].text,'Whole-frame masking does not need recognition');assert.ok(Object.isFrozen(s.predictions[0]));s=transitionLearningSession(module,s,{type:'NEXT'});s=transitionLearningSession(module,s,{type:'OBSERVE',observation:{schemaVersion:'1.0.0',experimentId:'vision-v1',runId:'run1',kind:'computed',description:'Whole image covered',value:true}});assert.equal(s.predictions.length,1);assert.equal(s.observations.length,1);assert.deepEqual(replayLearningActions(module,s.actions),s);});
test('a learner can skip committing a prediction explicitly',()=>{let s=enter();s=transitionLearningSession(module,s,{type:'SKIP'});s=transitionLearningSession(module,s,{type:'NEXT'});assert.equal(s.stage,'experiment');assert.equal(s.predictions.length,0);});
test('predictions cannot be changed after commitment',()=>{let s=commit(enter());assert.throws(()=>commit(s,'Different expected result'),/already committed/);s=transitionLearningSession(module,s,{type:'NEXT'});s=transitionLearningSession(module,s,{type:'BACK'});assert.throws(()=>commit(s,'Rewrite history'),/already committed/);});
test('unknown hypotheses and invalid experiment identifiers fail closed',()=>{const s=enter();assert.throws(()=>transitionLearningSession(module,s,{type:'COMMIT_PREDICTION',text:'valid',experimentId:'x',hypothesisId:'h999'}),/Unknown/);assert.throws(()=>transitionLearningSession(module,s,{type:'COMMIT_PREDICTION',text:'valid',experimentId:'bad id'}),/identifier/);assert.throws(()=>commit(s,' '),/nonempty/);});
test('predictions cannot be written from other stages',()=>{assert.throws(()=>transitionLearningSession(module,createLearningSession(module),{type:'COMMIT_PREDICTION',text:'ahead',experimentId:'vision'}),/stage/);});
test('reset removes recorded predictions, not the authored lesson',()=>{const s=commit(enter());const clean=transitionLearningSession(module,s,{type:'RESET'});assert.equal(clean.predictions.length,0);assert.equal(clean.lessonId,s.lessonId);});
