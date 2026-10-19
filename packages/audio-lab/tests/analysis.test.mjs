import test from 'node:test';import assert from 'node:assert/strict';
import {synthesizeSamples,waveformPeaks,spectrogram} from '../src/analysis.mjs';
const notes=[{pitch:'A4',beats:2}];
test('generated samples contain actual periodic signal',()=>{const x=synthesizeSamples(notes,120);assert.equal(x.samples.length,4096);assert.ok(x.samples.some(v=>Math.abs(v)>0.25));assert.equal(x.origin,'locally-synthesized-samples');});
test('waveform envelope covers source range',()=>{let x=synthesizeSamples(notes,120);let peak=waveformPeaks(x.samples,32);assert.equal(peak.length,32);assert.ok(peak.some(p=>p.max>0.2&&p.min<0));});
test('windowed spectrum is computed from samples and changes with pitch',()=>{const a=spectrogram(synthesizeSamples([{pitch:'A4',beats:2}],120).samples),c=spectrogram(synthesizeSamples([{pitch:'C4',beats:2}],120).samples);assert.equal(a.windows,24);assert.equal(a.bins,32);assert.notDeepEqual(a.powers,c.powers);});
test('inspection is explicitly capped for very long melody',()=>{let x=synthesizeSamples(Array(32).fill({pitch:'A4',beats:4}),60);assert.equal(x.truncated,true);assert.equal(x.durationSeconds,12);});
test('reject invalid analysis input',()=>{assert.throws(()=>waveformPeaks([],20),TypeError);assert.throws(()=>spectrogram(new Float32Array(5)),TypeError);});
