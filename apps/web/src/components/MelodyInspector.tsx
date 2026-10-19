import {useMemo} from 'react';
import type {MelodyNote} from '../../../../packages/audio-lab/src/melody.mjs';
import {synthesizeSamples,waveformPeaks,spectrogram} from '../../../../packages/audio-lab/src/analysis.mjs';
import {extractMelodyFeatures} from '../../../../packages/audio-lab/src/features.mjs';
export default function MelodyInspector({notes,tempo}:{notes:readonly MelodyNote[];tempo:number}){
 const analysis=useMemo(()=>{
  if(!notes.length)return null;
  const signal=synthesizeSamples(notes,tempo);
  const peaks=waveformPeaks(signal.samples,96);
  const bands=spectrogram(signal.samples,{sampleRate:signal.sampleRate,windows:24,bins:24});
  return {signal,peaks,bands,features:extractMelodyFeatures(notes,tempo)};
 },[notes,tempo]);
 if(!analysis)return <p>Add some notes to inspect their sound.</p>;
 const {signal,peaks,bands,features}=analysis;
 return <section aria-label="Measured waveform and frequency analysis">
  <h3>Waveform and spectrum</h3>
  <p>These measurements are computed from the exact sine tones specified by your melody. The waveform shows amplitude; the spectrogram shows frequency energy changing over time.</p>
  <svg role="img" aria-label="Waveform amplitude by time, computed from local sine samples" viewBox="0 0 480 120" width="100%" preserveAspectRatio="xMidYMid meet">
   <rect x="0" y="0" width="480" height="120" rx="8" fill="#e8f0f7"/>
   <path d="M0 60 H480" stroke="#60768b" strokeWidth="1"/>
   {peaks.map((p,i)=><line key={i} x1={i*5+2} x2={i*5+2} y1={60-p.max*160} y2={60-p.min*160} stroke="#1d527c" strokeWidth="2"/>)}
  </svg>
  <svg role="img" aria-label="Spectrogram of measured frequency amplitudes across 24 time windows and 24 frequency bands, bottom indicates lower frequency" viewBox="0 0 480 144" width="100%" preserveAspectRatio="xMidYMid meet">
   <rect x="0" y="0" width="480" height="144" rx="8" fill="#e8f0f7"/>
   {bands.powers.map((col,x)=>col.map((power,y)=><rect key={x+'-'+y} x={x*20} y={(23-y)*6} width="20" height="6" fill="#164c78" opacity={Math.min(1,Math.max(.07,power*110))}/>))}
  </svg>
  <details><summary>Inspect measured pitch, rhythm and timbre</summary>
   <p>Pitch detection examines each generated audio frame against eight C4–C5 reference frequencies. RMS and spectrum are measured from the waveform. Onset timing is known from the notes you entered, <strong>not</strong> automatically recovered from sound.</p>
   <p>Score-derived note onsets (seconds): {features.rhythm.scoreOnsetsSeconds.map(t=>t.toFixed(2)).join(', ')||'none'}. Tempo: {features.rhythm.tempoBpm} BPM.</p>
   <ol>{features.noteFeatures.map(n=><li key={n.noteIndex}>
    Score: {n.scorePitch} at {n.scoreOnsetSeconds.toFixed(2)}s; audio-derived pitch: {n.observedAudio.pitch?.name??'unresolved'};
    RMS {n.observedAudio.rms.toFixed(3)};
    zero crossings {n.observedAudio.zeroCrossingRateHz.toFixed(0)}/s;
    spectral centroid {n.observedAudio.timbre?.spectralCentroidHz?.toFixed(0)??'unknown'} Hz;
    flatness {n.observedAudio.timbre?.spectralFlatness?.toFixed(3)??'unknown'}.
   </li>)}</ol>
   {features.omittedFrames>0&&<p>{features.omittedFrames} notes were not analyzed because they fall beyond the bounded audio inspection window.</p>}
  </details>
  <p className="status-note">Analysis sample rate: {signal.sampleRate} samples/s; inspected {signal.durationSeconds.toFixed(2)} seconds{signal.truncated?' (first 12 seconds of a longer melody)':''}. Frequency analysis uses a 128-sample Hann window and a direct discrete Fourier calculation, not a decorative animation.</p>
 </section>;
}
