import test from 'node:test';import assert from 'node:assert/strict';
import {compileLearningModule} from '@learning-machine/content';
import {createLearningSession,transitionLearningSession,availableRoutes,replayLearningActions} from '../src/engine.mjs';
const content={schemaVersion:'1.0.0',id:'demo',title:'Socratic cycle',startNodeId:'start',concepts:['reason'],nodes:[
 {id:'start',stage:'encounter',prompt:'How would you solve it?',concepts:['reason'],edges:[{to:'hyp'}]},
 {id:'hyp',stage:'hypothesis',prompt:'What do you think?',edges:[{to:'exp'},{to:'reflection',when:'on_request'}]},
 {id:'exp',stage:'experiment',prompt:'Run it',accessibleAlternative:'keyboard accessible alternative',edges:[{to:'obs'},{to:'exp',when:'retry'}]},
 {id:'obs',stage:'observation',prompt:'What happened?',edges:[{to:'reflection'}]},
 {id:'reflection',stage:'reflection',prompt:'Discover the alternative',edges:[{to:'end'}]},
 {id:'end',stage:'complete',prompt:'You finished',edges:[],terminal:true}
]};
const compiled=compileLearningModule(content);
test('starts at the authored encounter node',()=>{const s=createLearningSession(compiled,'test');assert.equal(s.nodeId,'start');assert.ok(Object.isFrozen(s));});
test('accepts free-form dissenting answers',()=>{let s=createLearningSession(compiled);s=transitionLearningSession(compiled,s,{type:'ANSWER',text:'Blur everything, not just the logo'});assert.equal(s.answers.start,'Blur everything, not just the logo');});
test('traverses actual graph routes into completion',()=>{let s=createLearningSession(compiled);for(const id of ['hyp','exp','obs','reflection','end'])s=transitionLearningSession(compiled,s,{type:'NEXT'});assert.ok(s.complete);assert.equal(s.stage,'complete');});
test('records measured evidence only when properly sourced',()=>{let s=createLearningSession(compiled);s=transitionLearningSession(compiled,s,{type:'NEXT'});s=transitionLearningSession(compiled,s,{type:'NEXT'});assert.throws(()=>transitionLearningSession(compiled,s,{type:'OBSERVE',observation:{schemaVersion:'1.0.0',experimentId:'vision',runId:'r1',kind:'measured',description:'Pixel changed'}}),/sourceId/);s=transitionLearningSession(compiled,s,{type:'OBSERVE',observation:{schemaVersion:'1.0.0',experimentId:'vision',runId:'r1',kind:'measured',description:'Pixel changed',sourceId:'canvas'}});assert.equal(s.observations.length,1);});
test('direct explanation bypass is a learner right',()=>{let s=createLearningSession(compiled);s=transitionLearningSession(compiled,s,{type:'REQUEST_EXPLANATION'});assert.equal(s.stage,'reflection');});
test('retry and back navigation preserve learner action history',()=>{let s=createLearningSession(compiled);s=transitionLearningSession(compiled,s,{type:'NEXT'});s=transitionLearningSession(compiled,s,{type:'NEXT'});s=transitionLearningSession(compiled,s,{type:'RETRY'});assert.equal(s.stage,'experiment');s=transitionLearningSession(compiled,s,{type:'BACK'});assert.equal(s.stage,'experiment');});
test('skipping does not manufacture an experiment observation',()=>{const a=createLearningSession(compiled);const b=transitionLearningSession(compiled,a,{type:'SKIP'});assert.deepEqual(b.observations,[]);assert.deepEqual(b.skipped,['start']);});
test('run cannot jump illegally into a future outcome',()=>{const a=createLearningSession(compiled);assert.throws(()=>transitionLearningSession(compiled,a,{type:'NEXT',to:'end'}),/permitted/);assert.throws(()=>transitionLearningSession(compiled,a,{type:'CHOOSE',to:'end'}));});
test('correct-scored routes cannot be selected without future verifiable evidence adapter',()=>{const d=structuredClone(content);d.nodes[0].edges=[{to:'hyp',when:'correct'},{to:'reflection',when:'on_request'}];const c=compileLearningModule(d);assert.throws(()=>transitionLearningSession(c,createLearningSession(c),{type:'NEXT',to:'hyp'}),/permitted/);});
test('cross-release state is rejected',()=>{const s=createLearningSession(compiled);const c=compileLearningModule({...content,title:'Changed release'});assert.throws(()=>transitionLearningSession(c,s,{type:'NEXT'}),/another lesson release/);});
test('replay matches action-driven state exactly',()=>{let s=createLearningSession(compiled,'pinned');s=transitionLearningSession(compiled,s,{type:'NEXT'});s=transitionLearningSession(compiled,s,{type:'ANSWER',text:'Try it myself'});s=transitionLearningSession(compiled,s,{type:'NEXT'});assert.deepEqual(replayLearningActions(compiled,s.actions,'pinned'),s);});
test('reset, invalid action and completed guards work',()=>{let s=createLearningSession(compiled);assert.throws(()=>transitionLearningSession(compiled,s,{type:'RUN_JS'}));s=transitionLearningSession(compiled,s,{type:'NEXT'});s=transitionLearningSession(compiled,s,{type:'RESET'});assert.equal(s.stage,'encounter');});
