import MelodyInspector from './MelodyInspector.tsx';
import {useEffect,useRef,useState} from 'react';
import {NOTE_NAMES,compileMelody,defaultMelody} from '../../../../packages/audio-lab/src/melody.mjs';
type Pitch=(typeof NOTE_NAMES)[number];
type Note={pitch:Pitch;beats:number};

export default function AudioComposer(){
 const [notes,setNotes]=useState<Note[]>(()=>defaultMelody().map(n=>({...n})));
 const [tempo,setTempo]=useState(110);
 const [playing,setPlaying]=useState(false);
 const [error,setError]=useState('');
 const audio=useRef<AudioContext|null>(null);
 const voices=useRef<Array<{osc:OscillatorNode;gain:GainNode}>>([]);
 const schedule=compileMelody(notes,tempo);
 function stop(){
  for(const v of voices.current){try{v.osc.stop()}catch{}try{v.osc.disconnect();v.gain.disconnect()}catch{}}
  voices.current=[];setPlaying(false);
 }
 useEffect(()=>()=>{for(const v of voices.current){try{v.osc.stop()}catch{}}voices.current=[];if(audio.current)void audio.current.close();},[]);
 async function play(){
  stop();setError('');
  if(!notes.length){setError('Add a note to play.');return;}
  try{
   const ctx=audio.current??new AudioContext();audio.current=ctx;
   await ctx.resume();const start=ctx.currentTime+0.05;
   const current:Array<{osc:OscillatorNode;gain:GainNode}>=[];
   for(const n of schedule.events){
    const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(n.frequencyHz,start+n.startSeconds);
    gain.gain.setValueAtTime(0,start+n.startSeconds);gain.gain.linearRampToValueAtTime(0.19,start+n.startSeconds+0.015);
    gain.gain.setValueAtTime(0.19,start+n.startSeconds+Math.max(0.015,n.durationSeconds-0.04));
    gain.gain.linearRampToValueAtTime(0,start+n.startSeconds+n.durationSeconds);
    osc.connect(gain);gain.connect(ctx.destination);osc.start(start+n.startSeconds);osc.stop(start+n.startSeconds+n.durationSeconds+0.02);
    current.push({osc,gain});
   }
   voices.current=current;setPlaying(true);
   // The completion state is derived from the oscillator lifecycle, not from a fabricated waveform.
   if(current.length)current[current.length-1].osc.onended=()=>{setPlaying(false);voices.current=[];};
  }catch(e){setError(e instanceof Error?e.message:'Audio playback unavailable');setPlaying(false);}
 }
 return <section className="learning-card" aria-labelledby="composer-heading">
  <h2 id="composer-heading">Compose an original melody</h2>
  <p>Choose pitches and durations, then hear the notes synthesized on your device. No recorded song or uploaded audio is needed.</p>
  <label htmlFor="tempo">Tempo: {tempo} beats per minute</label>
  <input id="tempo" type="range" min={45} max={220} value={tempo} onChange={e=>setTempo(Number(e.target.value))}/>
  <ol aria-label="Your melody">{notes.map((note,i)=><li key={i} style={{marginBottom:'0.75rem'}}>
   <label>Note {i+1} <select aria-label={'Pitch for note '+(i+1)} value={note.pitch} onChange={e=>setNotes(old=>old.map((n,j)=>j===i?{...n,pitch:e.target.value as Pitch}:n))}>{NOTE_NAMES.map(p=><option key={p} value={p}>{p}</option>)}</select></label>{' '}
   <label>Beats <select aria-label={'Duration for note '+(i+1)} value={note.beats} onChange={e=>setNotes(old=>old.map((n,j)=>j===i?{...n,beats:Number(e.target.value)}:n))}>{[1,2,3,4].map(b=><option key={b} value={b}>{b}</option>)}</select></label>{' '}
   <button type="button" className="action" onClick={()=>setNotes(old=>old.filter((_,j)=>j!==i))}>Remove note {i+1}</button>
  </li>)}</ol>
  <div className="controls">
   <button type="button" className="action" disabled={notes.length>=32} onClick={()=>setNotes(old=>[...old,{pitch:'C4',beats:1}])}>Add note</button>
   <button type="button" className="action action-primary" disabled={playing||!notes.length} onClick={()=>{void play()}}>Play original melody</button>
   <button type="button" className="action" onClick={stop}>Stop</button>
   <button type="button" className="action" onClick={()=>{stop();setNotes(defaultMelody().map(n=>({...n})));setTempo(110);}}>Reset</button>
  </div>
  {error&&<p role="alert">{error}</p>}
  <p role="status">Total melody duration: {schedule.totalSeconds.toFixed(2)} seconds. {playing?'Playing audio.':'Stopped.'}</p>
  <MelodyInspector notes={notes} tempo={tempo}/>
  <details><summary>Inspect exact note calculations</summary><ol>{schedule.events.map((n,i)=><li key={i}>{notes[i]?.pitch}: {n.frequencyHz.toFixed(2)} Hz, starts at {n.startSeconds.toFixed(2)} seconds, lasts {n.durationSeconds.toFixed(2)} seconds</li>)}</ol></details>
  <p className="status-note">These are newly synthesized sine tones. The sound is not a licensed recording, a copy of a song, or a machine-learning model. Later lessons will use original examples for analysis and learning.</p>
 </section>;
}
