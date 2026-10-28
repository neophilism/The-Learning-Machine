import {useEffect,useRef,useState} from 'react';
import {MUSIC_LESSON_CANDIDATES,recordMusicRevision,runMusicLearningExperiment,runMusicTransfer} from '../../../../packages/audio-lab/src/lesson.mjs';
import {compileMelody} from '../../../../packages/audio-lab/src/melody.mjs';

type Label='rising'|'falling';
type Experiment=ReturnType<typeof runMusicLearningExperiment>;
type Revision=ReturnType<typeof recordMusicRevision>;
type Transfer=ReturnType<typeof runMusicTransfer>;
type Voice={osc:OscillatorNode;gain:GainNode};

export default function MusicLearningLesson(){
 const [candidateId,setCandidateId]=useState('transfer-rise'),[prediction,setPrediction]=useState<Label>('rising'),[experiment,setExperiment]=useState<Experiment|null>(null);
 const [revisionText,setRevisionText]=useState(''),[revision,setRevision]=useState<Revision|null>(null),[transfer,setTransfer]=useState<Transfer|null>(null),[error,setError]=useState('');
 const [previewing,setPreviewing]=useState(false);
 const audio=useRef<AudioContext|null>(null),voices=useRef<Voice[]>([]);
 const candidate=MUSIC_LESSON_CANDIDATES.find(item=>item.id===candidateId)!;
 function stopPreview(){
  for(const voice of voices.current){try{voice.osc.stop()}catch{}try{voice.osc.disconnect();voice.gain.disconnect()}catch{}}
  voices.current=[];setPreviewing(false);
 }
 useEffect(()=>()=>{for(const voice of voices.current){try{voice.osc.stop()}catch{}}voices.current=[];if(audio.current)void audio.current.close();},[]);
 async function playPreview(){
  stopPreview();setError('');
  try{
   const context=audio.current??new AudioContext();audio.current=context;await context.resume();
   const start=context.currentTime+0.05,schedule=compileMelody(candidate.notes,candidate.tempo),current:Voice[]=[];
   for(const note of schedule.events){
    const osc=context.createOscillator(),gain=context.createGain();osc.type='sine';osc.frequency.setValueAtTime(note.frequencyHz,start+note.startSeconds);
    gain.gain.setValueAtTime(0,start+note.startSeconds);gain.gain.linearRampToValueAtTime(0.16,start+note.startSeconds+0.015);
    gain.gain.setValueAtTime(0.16,start+note.startSeconds+Math.max(0.015,note.durationSeconds-0.04));gain.gain.linearRampToValueAtTime(0,start+note.startSeconds+note.durationSeconds);
    osc.connect(gain);gain.connect(context.destination);osc.start(start+note.startSeconds);osc.stop(start+note.startSeconds+note.durationSeconds+0.02);current.push({osc,gain});
   }
   voices.current=current;setPreviewing(true);if(current.length)current.at(-1)!.osc.onended=()=>{voices.current=[];setPreviewing(false)};
  }catch(reason){setError(reason instanceof Error?reason.message:'Audio preview unavailable');setPreviewing(false)}
 }
 function observe(){try{setError('');setExperiment(runMusicLearningExperiment({prediction,candidateId}));setRevision(null);setTransfer(null)}catch(reason){setError(reason instanceof Error?reason.message:'Experiment failed')}}
 function revise(){try{setError('');setRevision(recordMusicRevision(experiment!,revisionText));setTransfer(null)}catch(reason){setError(reason instanceof Error?reason.message:'Revision failed')}}
 function testTransfer(){try{setError('');const other=candidateId==='transfer-rise'?'transfer-fall':'transfer-rise';setTransfer(runMusicTransfer(revision!,other))}catch(reason){setError(reason instanceof Error?reason.message:'Transfer failed')}}
 return <section className="learning-card" aria-labelledby="music-lesson-heading">
  <p className="eyebrow">Predict - experiment - revise - transfer</p><h2 id="music-lesson-heading">Teach and challenge a musical pattern learner</h2>
  <p>The training set contains only original synthesized note events. Commit a prediction before the local model reveals its result.</p>
  <label>Unseen melody <select value={candidateId} disabled={Boolean(experiment)} onChange={event=>{stopPreview();setCandidateId(event.target.value)}}>{MUSIC_LESSON_CANDIDATES.map(item=><option key={item.id} value={item.id}>{item.id==='transfer-rise'?'Melody A':'Melody B'}</option>)}</select></label>
  <p>Notes: {candidate.notes.map(note=>note.pitch).join(' - ')} at {candidate.tempo} BPM.</p>
  <button type="button" className="action" aria-pressed={previewing} onClick={()=>{if(previewing)stopPreview();else void playPreview()}}>{previewing?'Stop unseen melody preview':'Play unseen melody preview'}</button>
  <p className="status-note">Listening is optional. The visible note sequence and all model evidence provide the complete non-audio route.</p>
  <label>Your prediction <select value={prediction} disabled={Boolean(experiment)} onChange={event=>setPrediction(event.target.value as Label)}><option value="rising">Rising pattern</option><option value="falling">Falling pattern</option></select></label>
  <div className="controls"><button type="button" className="action action-primary" disabled={Boolean(experiment)} onClick={observe}>Commit prediction and run experiment</button><button type="button" className="action" onClick={()=>{stopPreview();setExperiment(null);setRevision(null);setTransfer(null);setRevisionText('');setError('')}}>Reset lesson</button></div>
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
