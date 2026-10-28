import {useState} from 'react';
import {MUSIC_LESSON_CANDIDATES,recordMusicRevision,runMusicLearningExperiment,runMusicTransfer} from '../../../../packages/audio-lab/src/lesson.mjs';

type Label='rising'|'falling';
type Experiment=ReturnType<typeof runMusicLearningExperiment>;
type Revision=ReturnType<typeof recordMusicRevision>;
type Transfer=ReturnType<typeof runMusicTransfer>;

export default function MusicLearningLesson(){
 const [candidateId,setCandidateId]=useState('transfer-rise'),[prediction,setPrediction]=useState<Label>('rising'),[experiment,setExperiment]=useState<Experiment|null>(null);
 const [revisionText,setRevisionText]=useState(''),[revision,setRevision]=useState<Revision|null>(null),[transfer,setTransfer]=useState<Transfer|null>(null),[error,setError]=useState('');
 const candidate=MUSIC_LESSON_CANDIDATES.find(item=>item.id===candidateId)!;
 function observe(){try{setError('');setExperiment(runMusicLearningExperiment({prediction,candidateId}));setRevision(null);setTransfer(null)}catch(reason){setError(reason instanceof Error?reason.message:'Experiment failed')}}
 function revise(){try{setError('');setRevision(recordMusicRevision(experiment!,revisionText));setTransfer(null)}catch(reason){setError(reason instanceof Error?reason.message:'Revision failed')}}
 function testTransfer(){try{setError('');const other=candidateId==='transfer-rise'?'transfer-fall':'transfer-rise';setTransfer(runMusicTransfer(revision!,other))}catch(reason){setError(reason instanceof Error?reason.message:'Transfer failed')}}
 return <section className="learning-card" aria-labelledby="music-lesson-heading">
  <p className="eyebrow">Predict → experiment → revise → transfer</p><h2 id="music-lesson-heading">Teach and challenge a musical pattern learner</h2>
  <p>The training set contains only original synthesized note events. Commit a prediction before the local model reveals its result.</p>
  <label>Unseen melody <select value={candidateId} disabled={Boolean(experiment)} onChange={event=>setCandidateId(event.target.value)}>{MUSIC_LESSON_CANDIDATES.map(item=><option key={item.id} value={item.id}>{item.id==='transfer-rise'?'Melody A':'Melody B'}</option>)}</select></label>
  <p>Notes: {candidate.notes.map(note=>note.pitch).join(' → ')} at {candidate.tempo} BPM.</p>
  <label>Your prediction <select value={prediction} disabled={Boolean(experiment)} onChange={event=>setPrediction(event.target.value as Label)}><option value="rising">Rising pattern</option><option value="falling">Falling pattern</option></select></label>
  <div className="controls"><button type="button" className="action action-primary" disabled={Boolean(experiment)} onClick={observe}>Commit prediction and run experiment</button><button type="button" className="action" onClick={()=>{setExperiment(null);setRevision(null);setTransfer(null);setRevisionText('');setError('')}}>Reset lesson</button></div>
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
