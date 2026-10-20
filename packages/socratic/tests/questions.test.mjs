import test from 'node:test';import assert from 'node:assert/strict';
import {compileLearningModule} from '@learning-machine/content';
import {createLearningSession,transitionLearningSession} from '../src/engine.mjs';
import {selectCounterexample,selectSocraticQuestion} from '../src/questions.mjs';
const fixture=()=>({schemaVersion:'1.0.0',id:'context',title:'Contextual questions',startNodeId:'a',concepts:['reason'],nodes:[
{id:'a',stage:'encounter',prompt:'What problem can you solve?',concepts:['reason'],edges:[{to:'h'}]},
{id:'h',stage:'hypothesis',prompt:'What is your hypothesis?',questionVariants:[{id:'multiple',when:'multiple_hypotheses',prompt:'How do your different approaches compare?'},{id:'some',when:'has_hypothesis',prompt:'What new alternative could you try?'}],edges:[{to:'p'}]},
{id:'p',stage:'prediction',prompt:'Predict',questionVariants:[{id:'linked',when:'has_prediction',prompt:'Compare your committed prediction.'}],edges:[{to:'x'}]},
{id:'x',stage:'experiment',prompt:'Experiment',accessibleAlternative:'Keyboard test',edges:[{to:'o'}]},
{id:'o',stage:'observation',prompt:'What did you observe?',questionVariants:[{id:'computed',when:'computed_observation',prompt:'Which computed changes did you actually see?'},{id:'unknown',when:'no_observation',prompt:'Run an experiment before making a claim.'}],edges:[{to:'end'}]},
{id:'end',stage:'complete',prompt:'Done',terminal:true,edges:[]}]});
test('fallback question is authored rather than generated',()=>{const c=compileLearningModule(fixture());const s=createLearningSession(c);assert.equal(selectSocraticQuestion(c,s).text,'What problem can you solve?')});
test('one and multiple hypotheses generate distinct authored contextual questions',()=>{
 const c=compileLearningModule(fixture());let s=transitionLearningSession(c,createLearningSession(c),{type:'NEXT'});
 assert.equal(selectSocraticQuestion(c,s).text,'What is your hypothesis?');
 s=transitionLearningSession(c,s,{type:'PROPOSE_HYPOTHESIS',text:'Mask everything'});
 assert.match(selectSocraticQuestion(c,s).text,/new alternative/);
 s=transitionLearningSession(c,s,{type:'PROPOSE_HYPOTHESIS',text:'Use fixed coordinates'});
 assert.match(selectSocraticQuestion(c,s).text,/different approaches/);
});
test('actual computed observation selects evidence-bound authored question',()=>{
 const c=compileLearningModule(fixture());let s=createLearningSession(c);
 s=transitionLearningSession(c,s,{type:'NEXT'});s=transitionLearningSession(c,s,{type:'NEXT'});
 s=transitionLearningSession(c,s,{type:'SKIP'});s=transitionLearningSession(c,s,{type:'NEXT'});
 s=transitionLearningSession(c,s,{type:'NEXT'});
 assert.match(selectSocraticQuestion(c,s).text,/Run an experiment/);
 s=transitionLearningSession(c,s,{type:'OBSERVE',observation:{schemaVersion:'1.0.0',experimentId:'vision',runId:'r1',kind:'computed',description:'50 pixels changed',value:50,sourceId:'generated'}});
 assert.match(selectSocraticQuestion(c,s).text,/computed changes/);
});
test('unknown or duplicate question conditions fail closed at source validation',()=>{
 const bad=fixture();bad.nodes[1].questionVariants[0].when='unreviewed';
 assert.throws(()=>compileLearningModule(bad),/condition/);
 const dup=fixture();dup.nodes[1].questionVariants[1].id='multiple';
 assert.throws(()=>compileLearningModule(dup),/Duplicate/);
});
test('another compiled lesson release cannot borrow the learner state',()=>{
 const a=compileLearningModule(fixture()),b=compileLearningModule({...fixture(),title:'Different release'});
 assert.throws(()=>selectSocraticQuestion(b,createLearningSession(a)),/release/);
});

const counterexampleFixture=()=>{
 const f=fixture(),challenge=f.nodes[4];challenge.stage='challenge';challenge.counterexamples=[
  {id:'moved',prompt:'The target moved.',triggerTerms:['fixed','position'],competingApproach:'Try a selective recognizer.'},
  {id:'overbroad',prompt:'Useful information must remain visible.',triggerTerms:['blur','everything'],competingApproach:'Try a bounded mask.'},
  {id:'neutral',prompt:'The target is absent.',triggerTerms:[],competingApproach:'Compare every method on the same absent-target frame.'}
 ];return f;
};
function challengedSession(text){
 const c=compileLearningModule(counterexampleFixture());let s=createLearningSession(c);
 s=transitionLearningSession(c,s,{type:'NEXT'});
 s=transitionLearningSession(c,s,{type:'PROPOSE_HYPOTHESIS',text});
 s=transitionLearningSession(c,s,{type:'NEXT'});
 s=transitionLearningSession(c,s,{type:'SKIP'});
 s=transitionLearningSession(c,s,{type:'NEXT'});
 s=transitionLearningSession(c,s,{type:'NEXT'});
 return {c,s};
}
test('technical assumptions select a concrete authored counterexample and competing approach',()=>{
 const {c,s}=challengedSession('Use one fixed position for the mask');
 const result=selectCounterexample(c,s);
 assert.equal(result.id,'moved');assert.deepEqual(result.matchedTerms,['fixed','position']);
 assert.match(result.competingApproach,/selective/);assert.equal(result.source,'authored-lesson');
});
test('opposite political positions receive the same neutral scrutiny',()=>{
 const support=challengedSession('I support the bill because creators deserve protection');
 const oppose=challengedSession('I oppose the bill because students deserve access');
 const a=selectCounterexample(support.c,support.s),b=selectCounterexample(oppose.c,oppose.s);
 assert.equal(a.id,'neutral');assert.equal(b.id,'neutral');assert.equal(a.prompt,b.prompt);
 assert.deepEqual(a.matchedTerms,[]);assert.deepEqual(b.matchedTerms,[]);
});
test('counterexamples fail closed outside challenge nodes, for unknown hypotheses, and without neutral fallback',()=>{
 const {c,s}=challengedSession('Use fixed coordinates');
 assert.throws(()=>selectCounterexample(c,s,'missing'),/known learner hypothesis/);
 assert.throws(()=>selectCounterexample(c,{...s,nodeId:'a',stage:'encounter'}),/challenge node/);
 const raw=counterexampleFixture();raw.nodes[4].counterexamples=raw.nodes[4].counterexamples.filter(x=>x.triggerTerms.length);
 const noFallback=compileLearningModule(raw);
 const mismatched={...s,releaseDigest:noFallback.digest};
 assert.throws(()=>selectCounterexample(noFallback,mismatched),/neutral fallback/);
});
test('malformed or unbounded authored counterexamples fail content validation',()=>{
 const malformed=counterexampleFixture();malformed.nodes[4].counterexamples[0].triggerTerms=['political position'];
 assert.throws(()=>compileLearningModule(malformed),/trigger term/);
 const sparse=counterexampleFixture();sparse.nodes[4].counterexamples=[sparse.nodes[4].counterexamples[0]];
 assert.throws(()=>compileLearningModule(sparse),/bounded array/);
});
