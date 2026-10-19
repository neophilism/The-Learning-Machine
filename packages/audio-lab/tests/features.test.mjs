import test from 'node:test';import assert from 'node:assert/strict';
import {analyzeAudioFrame,extractMelodyFeatures} from '../src/features.mjs';
import {synthesizeSamples} from '../src/analysis.mjs';
function one(pitch){return synthesizeSamples([{pitch,beats:2}],120).samples.subarray(400,912)}
test('pitch estimates come from PCM, identify independent sine signals',()=>{
 assert.equal(analyzeAudioFrame(one('A4')).pitch?.name,'A4');
 assert.equal(analyzeAudioFrame(one('C4')).pitch?.name,'C4');
 assert.equal(analyzeAudioFrame(one('G4')).pitch?.name,'G4');
});
test('measures RMS, sign transitions and spectrally derived timbre',()=>{
 const x=analyzeAudioFrame(one('A4'));
 assert.ok(x.rms>.14&&x.rms<.25);
 assert.ok(x.zeroCrossingRateHz>650&&x.zeroCrossingRateHz<1050);
 assert.ok(x.timbre.spectralCentroidHz>300&&x.timbre.spectralCentroidHz<600);
 assert.ok(x.timbre.spectralFlatness>=0&&x.timbre.spectralFlatness<=1);
 assert.equal(x.origin,'computed-from-waveform');
});
test('silent frames produce unknown pitch instead of invented note',()=>{
 const x=analyzeAudioFrame(new Float32Array(512));
 assert.equal(x.pitch,null);assert.equal(x.timbre,null);assert.equal(x.rms,0);
});
test('rhythm identifies authored score beats without pretending detected tempo',()=>{
 const x=extractMelodyFeatures([{pitch:'C4',beats:1},{pitch:'E4',beats:2},{pitch:'G4',beats:1}],120);
 assert.deepEqual(x.rhythm.scoreOnsetsSeconds,[0,0.5,1.5]);
 assert.deepEqual(x.rhythm.interOnsetIntervalsSeconds,[0.5,1]);
 assert.match(x.rhythm.source,/not automated/);
 assert.equal(x.noteFeatures[0].observedAudio.pitch.name,'C4');
 assert.equal(x.noteFeatures[1].observedAudio.pitch.name,'E4');
});
test('truncation reported rather than fabricating missing note observations',()=>{
 const x=extractMelodyFeatures(Array(32).fill({pitch:'A4',beats:4}),60);
 assert.equal(x.waveformTruncated,true);assert.ok(x.omittedFrames>0);
});
test('invalid PCM and unreasonable sample sizes fail safely',()=>{
 assert.throws(()=>analyzeAudioFrame(new Float32Array(10)),TypeError);
 const bad=new Float32Array(512);bad[22]=NaN;
 assert.throws(()=>analyzeAudioFrame(bad),TypeError);
 assert.throws(()=>analyzeAudioFrame(new Float32Array(512),1000),TypeError);
});
