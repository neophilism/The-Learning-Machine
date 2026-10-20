import test from 'node:test';import assert from 'node:assert/strict';
import {compileLearningModule} from '@learning-machine/content';
import {createLearningSession,replayLearningActions,transitionLearningSession} from '../src/engine.mjs';
const moduleFixture=()=>compileLearningModule({schemaVersion:'1.0.0',id:'reasoning',title:'Revision and transfer',startNodeId:'start',concepts:['reason'],nodes:[
 {id:'start',stage:'encounter',prompt:'Begin',concepts:['reason'],edges:[{to:'hyp'}]},
 {id:'hyp',stage:'hypothesis',prompt:'State a view',edges:[{to:'rev'}]},
 {id:'rev',stage:'revision',prompt:'Revise or defend',edges:[{to:'transfer'}]},
 {id:'transfer',stage:'transfer',prompt:'Try a new context',edges:[{to:'done'}]},
 {id:'done',stage:'complete',prompt:'Done',terminal:true,edges:[]}
]});
function atRevision(text='I disagree with the proposal for technical reasons'){
 const c=moduleFixture();let s=createLearningSession(c,'reasoner');
 s=transitionLearningSession(c,s,{type:'NEXT'});
 s=transitionLearningSession(c,s,{type:'PROPOSE_HYPOTHESIS',text});
 s=transitionLearningSession(c,s,{type:'NEXT'});
 return {c,s};
}
test('reasoned defense and alternative transfer outcome complete without agreement scoring',()=>{
 let {c,s}=atRevision();
 assert.throws(()=>transitionLearningSession(c,s,{type:'NEXT'}),/reasoned revision or defense/);
 s=transitionLearningSession(c,s,{type:'RECORD_REVISION',position:'defended',hypothesisId:'h1',reasoning:'The counterexample does not cover a bounded manual mask.',testIdea:'Move the target and measure unrelated pixels hidden.'});
 s=transitionLearningSession(c,s,{type:'NEXT'});
 assert.throws(()=>transitionLearningSession(c,s,{type:'NEXT'}),/alternative outcome/);
 s=transitionLearningSession(c,s,{type:'RECORD_TRANSFER',novelContext:'Live audio filtering',predictedOutcome:'A frequency-selective filter preserves speech.',alternativeOutcome:'Broad muting removes speech with the target.'});
 s=transitionLearningSession(c,s,{type:'NEXT'});
 assert.equal(s.complete,true);assert.equal(s.revisions[0].position,'defended');assert.equal(s.transfers[0].revisionId,'r1');
 assert.deepEqual(replayLearningActions(c,s.actions,'reasoner'),s);
});
test('revision may change the idea and retains a falsifiable test',()=>{
 let {c,s}=atRevision('Mask everything');
 s=transitionLearningSession(c,s,{type:'RECORD_REVISION',position:'revised',reasoning:'Preserve unrelated safety text with a bounded mask.',testIdea:'Compare retained safety-text pixels.'});
 assert.equal(s.revisions[0].position,'revised');assert.match(s.revisions[0].testIdea,/pixels/);
});
test('malformed, duplicate, mistimed and cross-hypothesis evidence fails closed',()=>{
 let {c,s}=atRevision();
 assert.throws(()=>transitionLearningSession(c,s,{type:'RECORD_REVISION',position:'approved',reasoning:'x',testIdea:'y'}),/revised or defended/);
 assert.throws(()=>transitionLearningSession(c,s,{type:'RECORD_REVISION',position:'defended',reasoning:'',testIdea:'y'}),/reasoning/);
 assert.throws(()=>transitionLearningSession(c,s,{type:'RECORD_REVISION',position:'defended',reasoning:'x',testIdea:'y',hypothesisId:'missing'}),/Unknown/);
 s=transitionLearningSession(c,s,{type:'RECORD_REVISION',position:'defended',reasoning:'Still plausible.',testIdea:'Try another frame.'});
 assert.throws(()=>transitionLearningSession(c,s,{type:'RECORD_REVISION',position:'revised',reasoning:'Again',testIdea:'Again'}),/already recorded/);
 assert.throws(()=>transitionLearningSession(c,s,{type:'RECORD_TRANSFER',novelContext:'audio',predictedOutcome:'x',alternativeOutcome:'y'}),/transfer stage/);
});
test('transfer requires prior revision and complete alternative outcomes',()=>{
 const c=moduleFixture();let s=createLearningSession(c);s=transitionLearningSession(c,s,{type:'NEXT'});s=transitionLearningSession(c,s,{type:'NEXT'});
 const forged={...s,nodeId:'transfer',stage:'transfer'};
 assert.throws(()=>transitionLearningSession(c,forged,{type:'RECORD_TRANSFER',novelContext:'audio',predictedOutcome:'works',alternativeOutcome:'fails'}),/prior revision/);
 let ready=transitionLearningSession(c,s,{type:'RECORD_REVISION',position:'revised',reasoning:'Changed.',testIdea:'Test it.'});ready=transitionLearningSession(c,ready,{type:'NEXT'});
 assert.throws(()=>transitionLearningSession(c,ready,{type:'RECORD_TRANSFER',novelContext:'audio',predictedOutcome:'works',alternativeOutcome:''}),/alternativeOutcome/);
});
