import test from 'node:test';import assert from 'node:assert/strict';
import {createExperimentRunner,maskSyntheticFrame,syntheticMaskExperiment} from '../src/runtime.mjs';
const input=method=>({width:48,height:28,method,target:{x:12,y:8,width:10,height:7}});
test('actual synthetic pixel processing distinguishes three methods',()=>{
 const sel=maskSyntheticFrame(input('selective')),all=maskSyntheticFrame(input('blanket')),known=maskSyntheticFrame(input('known-position'));
 assert.equal(sel.metrics.targetPixelsMasked,70);assert.equal(sel.metrics.otherPixelsMasked,0);
 assert.equal(sel.metrics.recognitionPixelReads,48*28);assert.equal(known.metrics.recognitionPixelReads,0);
 assert.equal(all.metrics.maskedPixels,48*28);assert.equal(all.metrics.otherPixelsMasked,48*28-70);
 assert.notDeepEqual(sel.output,sel.original);
});
test('runner executes real computation with validated bound source and unique run identifiers',async()=>{
 const runner=createExperimentRunner();let a=await runner.run('synthetic-masking-v1',input('selective'));
 assert.equal(a.status,'completed');assert.equal(a.observation.kind,'computed');assert.equal(a.observation.value,70);
 assert.equal(a.observation.experimentId,'synthetic-masking-v1');assert.equal(a.metrics.recognitionPerformed,true);
 let b=await runner.run('synthetic-masking-v1',input('blanket'));assert.equal(b.status,'completed');assert.notEqual(a.runId,b.runId);
});
test('malformed pixel targets and unknown registered experiments fail closed',async()=>{
 assert.throws(()=>maskSyntheticFrame({...input('selective'),target:{x:50,y:5,width:7,height:7}}),RangeError);
 assert.throws(()=>maskSyntheticFrame(input('undocumented')),TypeError);
 await assert.rejects(()=>createExperimentRunner().run('not-registered',input('blanket')),RangeError);
});
test('cancellation prevents a late uncooperative result replacing a newer run',async()=>{
 const slow={manifest:{schemaVersion:'1.0.0',id:'slow',version:'1.0',title:'Test slow experiment',capabilities:['keyboard'],timeoutMs:1000},validateInput:x=>x,
  async execute(input,{runId}){await new Promise(resolve=>setTimeout(resolve,input.delay));return {observation:{schemaVersion:'1.0.0',experimentId:'slow',runId,kind:'computed',description:'Finished'}};}};
 const runner=createExperimentRunner([slow]);
 const first=runner.run('slow',{delay:100});
 const second=runner.run('slow',{delay:1});
 const [a,b]=await Promise.all([first,second]);
 assert.equal(a.status,'cancelled');assert.equal(b.status,'completed');
});
test('timeout and manual cancellation do not leave an accepted result',async()=>{
 const slow={manifest:{schemaVersion:'1.0.0',id:'slow',version:'1.0',title:'Test slow experiment',capabilities:['keyboard'],timeoutMs:10},validateInput:x=>x,
  async execute(input,{runId}){await new Promise(resolve=>setTimeout(resolve,50));return {observation:{schemaVersion:'1.0.0',experimentId:'slow',runId,kind:'computed',description:'Finished'}};}};
 const runner=createExperimentRunner([slow]);
 const first=await runner.run('slow',{});assert.equal(first.status,'timed_out');
 const pending=runner.run('slow',{});assert.equal(runner.cancel(),true);assert.equal((await pending).status,'cancelled');
});
test('invalid experimental results cannot masquerade as valid observations',async()=>{
 const broken={...syntheticMaskExperiment,execute:async()=>({observation:{schemaVersion:'1.0.0',experimentId:'wrong',runId:'wrong',kind:'computed',description:'Forged'}})};
 const runner=createExperimentRunner([broken]);const r=await runner.run('synthetic-masking-v1',input('selective'));
 assert.equal(r.status,'failed');assert.match(r.error,/unexpected run/);
});
