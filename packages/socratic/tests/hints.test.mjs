import test from 'node:test';import assert from 'node:assert/strict';
import {compileLearningModule} from '@learning-machine/content';
import {createLearningSession,transitionLearningSession,replayLearningActions} from '../src/engine.mjs';
const content=()=>({schemaVersion:'1.0.0',id:'hints',title:'Guidance without forced answer',startNodeId:'begin',concepts:['reason'],nodes:[
{id:'begin',stage:'encounter',prompt:'What is the problem?',concepts:['reason'],hints:['Look for the objective','What exactly must the machine do?'],edges:[{to:'reflect',when:'on_request'},{to:'end',when:'always'}]},
{id:'reflect',stage:'reflection',prompt:'The explanation is available directly.',edges:[{to:'end',when:'always'}]},
{id:'end',stage:'complete',prompt:'Done',terminal:true,edges:[]}]});
test('bounded authored hints advance without changing learner beliefs or route',()=>{
 const c=compileLearningModule(content());let s=createLearningSession(c);
 s=transitionLearningSession(c,s,{type:'REQUEST_HINT'});assert.equal(s.hints.begin,1);assert.equal(s.nodeId,'begin');
 s=transitionLearningSession(c,s,{type:'REQUEST_HINT'});assert.equal(s.hints.begin,2);assert.equal(s.stage,'encounter');
 const already=s;assert.equal(transitionLearningSession(c,s,{type:'REQUEST_HINT'}),already);
 assert.deepEqual(replayLearningActions(c,s.actions),s);
});
test('direct explanation remains available after using hints',()=>{
 const c=compileLearningModule(content());let s=transitionLearningSession(c,createLearningSession(c),{type:'REQUEST_HINT'});
 s=transitionLearningSession(c,s,{type:'REQUEST_EXPLANATION'});assert.equal(s.stage,'reflection');
});
test('unauthored hints cannot be invented',()=>{
 const c=compileLearningModule(content());let s=transitionLearningSession(c,createLearningSession(c),{type:'REQUEST_EXPLANATION'});
 assert.throws(()=>transitionLearningSession(c,s,{type:'REQUEST_HINT'}),/No authored hint/);
});
test('hint count and text are bounded in the lesson contract',()=>{
 const tooMany=content();tooMany.nodes[0].hints=['1','2','3','4','5'];
 assert.throws(()=>compileLearningModule(tooMany),/bounded/);
 const blank=content();blank.nodes[0].hints=['   '];
 assert.throws(()=>compileLearningModule(blank),/nonempty/);
});
