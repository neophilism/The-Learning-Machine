import {compileMelody,NOTE_NAMES} from './melody.mjs';
import {synthesizeSamples} from './analysis.mjs';
// Frequencies are measured from PCM using a bounded Goertzel pitch bank;
// note identities from the source score are not used to select the detected pitch.
const FREQUENCIES=Object.freeze([261.625565,293.664768,329.627557,349.228231,391.995436,440,493.883301,523.251131]);
function powerAt(samples,sampleRate,hz){
 const coefficient=2*Math.cos(2*Math.PI*hz/sampleRate);
 let previous=0,previous2=0;
 for(let i=0;i<samples.length;i++){
   const hann=0.5-0.5*Math.cos(2*Math.PI*i/(samples.length-1));
   const current=samples[i]*hann+coefficient*previous-previous2;
   previous2=previous;previous=current;
 }
 return Math.max(0,previous*previous+previous2*previous2-coefficient*previous*previous2);
}
function validateFrame(samples,sampleRate){
 if(!(samples instanceof Float32Array)||samples.length<256||samples.length>32768||!Number.isInteger(sampleRate)||sampleRate<2048||sampleRate>48000)throw new TypeError('Expected 256–32768 PCM samples and valid sample rate');
 for(let i=0;i<samples.length;i++)if(!Number.isFinite(samples[i])||Math.abs(samples[i])>1)throw new TypeError('Invalid normalized PCM sample');
}
export function analyzeAudioFrame(samples,sampleRate=4096){
 validateFrame(samples,sampleRate);
 let sumSquares=0,zeroCrossings=0;
 for(let i=0;i<samples.length;i++){
  sumSquares+=samples[i]*samples[i];
  if(i>0&&((samples[i]>=0)!==(samples[i-1]>=0)))zeroCrossings++;
 }
 const rms=Math.sqrt(sumSquares/samples.length);
 const silent=rms<0.0002;
 const peaks=FREQUENCIES.map(f=>powerAt(samples,sampleRate,f));
 const max=Math.max(...peaks);
 const pitchIndex=peaks.indexOf(max);
 // Spectral timbre features are derived independently of the eight-note pitch bank.
 const spectrum=[];
 for(let hz=125;hz<=1575;hz+=50)spectrum.push({hz,power:powerAt(samples,sampleRate,hz)});
 const total=spectrum.reduce((acc,s)=>acc+s.power,0);
 const centroid=total>0?spectrum.reduce((acc,s)=>acc+s.hz*s.power,0)/total:null;
 const arithmetic=spectrum.reduce((acc,s)=>acc+s.power,0)/spectrum.length;
 const geometric=Math.exp(spectrum.reduce((acc,s)=>acc+Math.log(s.power+1e-12),0)/spectrum.length);
 const flatness=arithmetic>1e-10?Math.min(1,geometric/arithmetic):null;
 return Object.freeze({
  origin:'computed-from-waveform',algorithm:'Goertzel windowed frequency bank',
  rms,zeroCrossingRateHz:zeroCrossings*sampleRate/(samples.length-1),
  pitch:silent?null:Object.freeze({name:NOTE_NAMES[pitchIndex],hz:FREQUENCIES[pitchIndex],confidenceRatio:max/(peaks.reduce((a,b)=>a+b,0)+1e-12),resolution:'eight-note palette C4–C5, not unconstrained pitch transcription'}),
  timbre:silent?null:Object.freeze({spectralCentroidHz:centroid,spectralFlatness:flatness,interpretation:'Windowed spectrum describes this audio frame; it does not identify a musical genre'}),
  durationSeconds:samples.length/sampleRate
 });
}
export function extractMelodyFeatures(notes,tempo=110){
 const score=compileMelody(notes,tempo);
 const sound=synthesizeSamples(notes,tempo,{sampleRate:4096,maxSeconds:12});
 const frameSize=512,sampleRate=sound.sampleRate;
 const noteFeatures=[];
 for(const event of score.events){
  const start=Math.round((event.startSeconds+Math.min(0.055,event.durationSeconds*0.16))*sampleRate);
  const end=Math.min(sound.samples.length,start+frameSize,Math.round((event.startSeconds+event.durationSeconds)*sampleRate));
  if(end-start<256)break; // A truncated audio sample cannot supply a valid frame.
  const frame=sound.samples.subarray(start,end);
  noteFeatures.push(Object.freeze({noteIndex:event.index,scorePitch:event.pitch,scoreOnsetSeconds:event.startSeconds,
   observedAudio:analyzeAudioFrame(frame,sampleRate)}));
 }
 const onsets=score.events.map(e=>e.startSeconds);
 return Object.freeze({
  origin:'original locally synthesized music',
  noteFeatures,observedFrames:noteFeatures.length,
  rhythm:Object.freeze({tempoBpm:score.tempo,scoreOnsetsSeconds:onsets,
   interOnsetIntervalsSeconds:onsets.slice(1).map((t,i)=>t-onsets[i]),
   source:'authored score timing, not automated beat detection'}),
  omittedFrames:score.events.length-noteFeatures.length,
  waveformTruncated:sound.truncated
 });
}
