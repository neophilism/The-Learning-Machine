import {useEffect,useRef,useState} from 'react';
import {MUSIC_LESSON_CANDIDATES,recordMusicRevision,runMusicLearningExperiment,runMusicTransfer} from '../../../../packages/audio-lab/src/lesson.mjs';
import {compileMelody} from '../../../../packages/audio-lab/src/melody.mjs';

type Label='rising'|'falling';
type AudioMode='sound'|'visual';
type Experiment=ReturnType<typeof runMusicLearningExperiment>;
type Revision=ReturnType<typeof recordMusicRevision>;
type Transfer=ReturnType<typeof runMusicTransfer>;
type Voice={osc:OscillatorNode;gain:GainNode};

export default function MusicLearningLesson(){
 const [hydrated,setHydrated]=useState(false);
 const [audioMode,setAudioMode]=useState<AudioMode>('sound'),[caption,setCaption]=useState('Preview idle. The visual transcript is available below.');
 useEffect(()=>{setHydrated(true);if(typeof AudioContext==='undefined'){setAudioMode('visual');setCaption('Audio is unavailable. Use the complete visual transcript.')}},[]);
 const [candidateId,setCandidateId]=useState('transfer-rise'),[prediction,setPrediction]=useState<Label>('rising'),[experiment,setExperiment]=useState<Experiment|null>(null);
 const [revisionText,setRevisionText]=useState(''),[revision,setRevision]=useState<Revision|null>(null),[transfer,setTransfer]=useState<Transfer|null>(null),[error,setError]=useState('');
 const [previewing,setPreviewing]=useState(false);
 const audio=useRef<AudioContext|null>(null),voices=useRef<Voice[]>([]),captionTimers=useRef<Array<ReturnType<typeof setTimeout>>>([]);
 const candidate=MUSIC_LESSON_CANDIDATES.find(item=>item.id===candidateId)!;
 const audioAvailable=hydrated&&typeof AudioContext!=='undefined';
 function clearCaptionTimers(){for(const timer of captionTimers.current)clearTimeout(timer);captionTimers.current=[]}
 function stopPreview(nextCaption='Preview stopped. Continue with the visual transcript.'){
  clearCaptionTimers();
  for(const voice of voices.current){try{voice.osc.stop()}catch{}try{voice.osc.disconnect();voice.gain.disconnect()}catch{}}
  voices.current=[];setPreviewing(false);setCaption(nextCaption);
 }
 useEffect(()=>()=>{clearCaptionTimers();for(const voice of voices.current){try{voice.osc.stop()}catch{}}voices.current=[];if(audio.current)void audio.current.close();},[]);
 async function playPreview(){
  stopPreview('Preparing local preview.');setError('');
  try{
   const context=audio.current??new AudioContext();audio.current=context;await context.resume();
   const start=context.currentTime+0.05,schedule=compileMelody(candidate.notes,candidate.tempo),current:Voice[]=[];
   setCaption('Preview started. Captions will announce each synthesized note.');
   schedule.events.forEach((note,index)=>{
    const osc=context.createOscillator(),gain=context.createGain();osc.type='sine';osc.frequency.setValueAtTime(note.frequencyHz,start+note.startSeconds);
    gain.gain.setValueAtTime(0,start+note.startSeconds);gain.gain.linearRampToValueAtTime(0.16,start+note.startSeconds+0.015);
    gain.gain.setValueAtTime(0.16,start+note.startSeconds+Math.max(0.015,note.durationSeconds-0.04));gain.gain.linearRampToValueAtTime(0,start+note.startSeconds+note.durationSeconds);
    osc.connect(gain);gain.connect(context.destination);osc.start(start+note.startSeconds);osc.stop(start+note.startSeconds+note.durationSeconds+0.02);current.push({osc,gain});
    captionTimers.current.push(setTimeout(()=>setCaption(`Cue ${index+1} of ${schedule.events.length}: ${candidate.notes[index]!.pitch}, one beat.`),Math.max(0,note.startSeconds*1000+50)));
   });
   const duration=schedule.totalSeconds;
   captionTimers.current.push(setTimeout(()=>{setCaption('Preview ended. The transcript remains available.');setPreviewing(false);voices.current=[]},duration*1000+100));
   voices.current=current;setPreviewing(true);
  }catch(reason){setError(reason instanceof Error?reason.message:'Audio preview unavailable');setAudioMode('visual');setCaption('Audio could not start. The complete visual transcript remains available.');setPreviewing(false)}
 }
 function chooseAudioMode(mode:AudioMode){stopPreview(mode==='visual'?'Visual-only route selected. No audio will be created.':'Sound preview enabled. Playback still requires the preview button.');setAudioMode(mode);setError('')}
 function observe(){try{setError('');setExperiment(runMusicLearningExperiment({prediction,candidateId}));setRevision(null);setTransfer(null)}catch(reason){setError(reason instanceof Error?reason.message:'Experiment failed')}}
 function revise(){try{setError('');setRevision(recordMusicRevision(experiment!,revisionText));setTransfer(null)}catch(reason){setError(reason instanceof Error?reason.message:'Revision failed')}}
 function testTransfer(){try{setError('');const other=candidateId==='transfer-rise'?'transfer-fall':'transfer-rise';setTransfer(runMusicTransfer(revision!,other))}catch(reason){setError(reason instanceof Error?reason.message:'Transfer failed')}}
 return <section className="learning-card" aria-labelledby="music-lesson-heading">
  <p className="eyebrow">Predict - experiment - revise - transfer</p><h2 id="music-lesson-heading">Teach and challenge a musical pattern learner</h2>
  <p>The training set contains only original synthesized note events. Commit a prediction before the local model reveals its result.</p>
  <fieldset><legend>Preview preference</legend>
   <label><input type="radio" name="music-preview-mode" checked={audioMode==='sound'} disabled={!audioAvailable} onChange={()=>chooseAudioMode('sound')}/> Use optional sound preview</label>
   <label><input type="radio" name="music-preview-mode" checked={audioMode==='visual'} onChange={()=>chooseAudioMode('visual')}/> Use visual transcript only</label>
  </fieldset>
  {!audioAvailable&&hydrated&&<p className="status-note">This browser does not expose audio playback. The transcript and model journey remain complete.</p>}
  <label>Unseen melody <select value={candidateId} disabled={!hydrated||Boolean(experiment)} onChange={event=>{stopPreview();setCandidateId(event.target.value)}}>{MUSIC_LESSON_CANDIDATES.map(item=><option key={item.id} value={item.id}>{item.id==='transfer-rise'?'Melody A':'Melody B'}</option>)}</select></label>
  <p>Notes: {candidate.notes.map(note=>note.pitch).join(' - ')} at {candidate.tempo} BPM.</p>
  <ol aria-label="Visual melody transcript">{candidate.notes.map((note,index)=><li key={`${candidate.id}-${index}`}>Cue {index+1}: pitch {note.pitch}, duration {note.beats} beat{note.beats===1?'':'s'}.</li>)}</ol>
  <button type="button" className="action" aria-pressed={previewing} disabled={!audioAvailable||audioMode==='visual'} onClick={()=>{if(previewing)stopPreview();else void playPreview()}}>{previewing?'Stop unseen melody preview':'Play unseen melody preview'}</button>
  <p role="status" aria-live="polite" aria-atomic="true" data-music-caption="true">{caption}</p>
  <p className="status-note">Listening is optional. The visible transcript and all model evidence provide the complete non-audio route.</p>
  <label>Your prediction <select value={prediction} disabled={!hydrated||Boolean(experiment)} onChange={event=>setPrediction(event.target.value as Label)}><option value="rising">Rising pattern</option><option value="falling">Falling pattern</option></select></label>
  <div className="controls"><button type="button" className="action action-primary" disabled={!hydrated||Boolean(experiment)} onClick={observe}>Commit prediction and run experiment</button><button type="button" className="action" onClick={()=>{stopPreview('Preview idle. The visual transcript is available below.');setExperiment(null);setRevision(null);setTransfer(null);setRevisionText('');setError('')}}>Reset lesson</button></div>
  {experiment&&<section aria-label="Observed model evidence"><h3>Observe the evidence</h3>
   <p role="status">You predicted {experiment.committedPrediction}. The locally trained model computed {experiment.inference.predictedLabel} at {(experiment.inference.confidence*100).toFixed(1)}% model confidence. {experiment.predictionMatched?'Your prediction matched this model output.':'Your prediction differed from this model output; disagreement is allowed.'}</p>
   <p>Held-out evidence: {experiment.heldOut.correctCount} of {experiment.heldOut.exampleCount} original examples classified as labeled. Training IDs and held-out IDs were disjoint.</p>
   <p>{experiment.comparison.disclosure}</p>
   <details><summary>Inspect held-out predictions</summary><ol>{experiment.heldOut.predictions.map(row=><li key={row.id}>{row.id}: labeled {row.actualLabel}, computed {row.predictedLabel}, {row.correct?'match':'difference'}</li>)}</ol></details>
  </section>}
  {experiment&&<section aria-label="Revise explanation"><h3>Revise your explanation</h3><label htmlFor="music-revision">What would you test next?</label><textarea id="music-revision" rows={3} maxLength={500} value={revisionText} onChange={event=>setRevisionText(event.target.value)}/><button type="button" className="action" onClick={revise}>Record revision</button></section>}
  {revision&&<section aria-label="Transfer revised idea"><h3>Transfer to a different melody</h3><p>Your revision is preserved: {revision.revision}</p><button type="button" className="action action-primary" onClick={testTransfer}>Test revision on the other unseen melody</button></section>}
  {transfer&&<p role="status" data-music-lesson-complete="true">Transfer complete on {transfer.candidateId}: the model computed {transfer.inference.predictedLabel}. Completion records your reasoning, not agreement with the model.</p>}
  {error&&<p role="alert">{error}</p>}
  <p className="status-note">All examples are original note sequences synthesized and analyzed locally. No copyrighted recording, microphone, account, remote AI, or political agreement is required.</p>
 </section>;
}
