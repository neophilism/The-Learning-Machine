import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyMicrophoneFailure,createLiveProcessingPlan,summarizeLatency,validateLiveProcessingSettings} from '../src/live-processing.mjs';

test('builds a bounded native audio-thread processing plan',()=>{
 const plan=createLiveProcessingPlan({mode:'lowpass',cutoffHz:1800,inputGain:0.8,monitor:true});
 assert.deepEqual(plan,{mode:'lowpass',cutoffHz:1800,inputGain:0.8,monitor:true,nodeType:'lowpass',q:0.707,outputGain:0.3,execution:'browser-web-audio-rendering-thread',retention:'none'});
 assert.equal(Object.isFrozen(plan),true);
});

test('fails closed for unsupported or unsafe settings',()=>{
 assert.throws(()=>validateLiveProcessingSettings({mode:'not-a-filter'}),TypeError);
 assert.throws(()=>validateLiveProcessingSettings({cutoffHz:40}),RangeError);
 assert.throws(()=>validateLiveProcessingSettings({inputGain:2}),RangeError);
 assert.throws(()=>validateLiveProcessingSettings({monitor:'yes'}),TypeError);
});

test('records setup time separately from browser-reported latency',()=>{
 const evidence=summarizeLatency({baseLatency:0.01,outputLatency:0.025},100,112.345);
 assert.deepEqual(evidence,{setupMilliseconds:12.35,browserReportedMilliseconds:35,measurement:'local-setup-clock-and-browser-reported-audio-latency',caveat:'This is not an acoustic round-trip measurement.'});
 assert.throws(()=>summarizeLatency({},20,10),TypeError);
});

test('permission denial and unavailable hardware have bounded public states',()=>{
 assert.deepEqual(classifyMicrophoneFailure({name:'NotAllowedError'}),{state:'denied',message:'Microphone permission was denied. No audio was captured.'});
 assert.equal(classifyMicrophoneFailure({name:'NotFoundError'}).state,'unavailable');
 assert.equal(classifyMicrophoneFailure(new Error('device path secret')).message,'Local audio processing could not start.');
});
