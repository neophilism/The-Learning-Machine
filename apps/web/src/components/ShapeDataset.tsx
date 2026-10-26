import {trainLinearClassifier,classifyDrawing,evaluateHoldout,trainNearestExampleMemorizer,compareMemorizationGeneralization,runReproduciblePerturbationTrial} from '../../../../packages/learning-lab/src/classifier.mjs';
import type {LinearModel,PerturbationTrial} from '../../../../packages/learning-lab/src/classifier.mjs';
import {stratifiedHoldout} from '../../../../packages/learning-lab/src/split.mjs';
import type {HoldoutSplit} from '../../../../packages/learning-lab/src/split.mjs';
import {useEffect,useRef,useState} from 'react';
import {GRID_SIZE,blankDrawing,setDrawingCell,presetDrawing,createShapeDataset,addShapeExample,removeShapeExample,relabelShapeExample,shapeCounts} from '../../../../packages/learning-lab/src/dataset.mjs';
import type {DrawingPixels} from '../../../../packages/learning-lab/src/dataset.mjs';
type Preset='diagonal'|'square'|'cross'|'horizontal';
export default function ShapeDatasetLab(){
 const [pixels,setPixels]=useState<DrawingPixels>(()=>blankDrawing());
 const [dataset,setDataset]=useState(()=>createShapeDataset());
 const [label,setLabel]=useState('Shape A');
 const [preset,setPreset]=useState<Preset>('diagonal');
 const [brushRow,setBrushRow]=useState(8);const [brushCol,setBrushCol]=useState(8);
 const [error,setError]=useState('');
 const [hydrated,setHydrated]=useState(false);
 const [split,setSplit]=useState<HoldoutSplit|null>(null);
 const [model,setModel]=useState<LinearModel|null>(null);
 const [prediction,setPrediction]=useState<ReturnType<typeof classifyDrawing>|null>(null);
 const [splitSeed,setSplitSeed]=useState(42);
 const [testFraction,setTestFraction]=useState(0.25);
 const [perturbationSeed,setPerturbationSeed]=useState(73);
 const [pixelFlips,setPixelFlips]=useState(8);
 const [includeMisleadingLabel,setIncludeMisleadingLabel]=useState(false);
 const [perturbation,setPerturbation]=useState<PerturbationTrial|null>(null);
 const [lessonQuestion,setLessonQuestion]=useState('');
 const [revisionNote,setRevisionNote]=useState('');
 const [revisionCount,setRevisionCount]=useState(0);
 useEffect(()=>setHydrated(true),[]);
 useEffect(()=>{setModel(null);setPrediction(null);setPerturbation(null)},[split,dataset]);
 useEffect(()=>setPrediction(null),[pixels,model]);
 const drawing=useRef(false);const canvas=useRef<HTMLCanvasElement|null>(null);
 useEffect(()=>{
  const c=canvas.current;if(!c)return;const ctx=c.getContext('2d');if(!ctx)return;
  ctx.fillStyle='#f5f8fb';ctx.fillRect(0,0,256,256);
  ctx.fillStyle='#205b84';
  for(let row=0;row<GRID_SIZE;row++)for(let col=0;col<GRID_SIZE;col++)if(pixels[row*GRID_SIZE+col])ctx.fillRect(col*16,row*16,16,16);
  ctx.strokeStyle='#bdd0dc';ctx.lineWidth=0.5;
  for(let step=0;step<=GRID_SIZE;step++){ctx.beginPath();ctx.moveTo(step*16,0);ctx.lineTo(step*16,256);ctx.stroke();ctx.beginPath();ctx.moveTo(0,step*16);ctx.lineTo(256,step*16);ctx.stroke();}
 },[pixels]);
 function markAtPointer(e:React.PointerEvent<HTMLCanvasElement>){
  const rect=e.currentTarget.getBoundingClientRect(),col=Math.min(15,Math.max(0,Math.floor((e.clientX-rect.left)*16/rect.width))),row=Math.min(15,Math.max(0,Math.floor((e.clientY-rect.top)*16/rect.height)));
  setPixels(p=>setDrawingCell(p,row,col));setError('');
 }
 function save(){
  try{setSplit(null);setDataset(addShapeExample(dataset,label,pixels));setError('');}
  catch(e){setError(e instanceof Error?e.message:'Cannot save drawing');}
 }
 function relabel(id:string,value:string){
  try{setSplit(null);setDataset(d=>relabelShapeExample(d,id,value));setError('');}
  catch(e){setError(e instanceof Error?e.message:'Invalid class label');}
 }
 const filled=pixels.reduce<number>((n,p)=>n+p,0),counts=shapeCounts(dataset);
 const holdoutReport=model&&split?evaluateHoldout(model,dataset,split):null;
 const comparison=model&&split?compareMemorizationGeneralization(model,trainNearestExampleMemorizer(dataset,split),dataset,split):null;
 const lessonSteps=[
  {label:'Build labeled examples',complete:dataset.examples.length>=4},
  {label:'Reserve an unseen test',complete:Boolean(split?.ready)},
  {label:'Train and inspect failures',complete:Boolean(model&&holdoutReport)},
  {label:'Revise from evidence',complete:revisionCount>0},
  {label:'Transfer to a new drawing',complete:Boolean(prediction)}
 ];
 return <section className="learning-card drawing-lab" aria-label="Create local training examples">
  <h2>Teach a machine: from examples to transfer</h2>
  <nav aria-label="Teach a Machine lesson progress"><ol>{lessonSteps.map((step,index)=><li key={step.label} data-state={step.complete?'complete':'pending'}><span aria-hidden="true">{step.complete?'✓':'○'}</span> Step {index+1}: {step.label}</li>)}</ol></nav>
  <p>Draw a simple shape, assign it a label, and save it as a training example. Create examples for at least two different labels to prepare for a classification experiment. Everything remains on this device, in this page, until you reset or leave.</p>
  <label htmlFor="lesson-question">Before training, what visual pattern do you expect the model to learn?</label>
  <textarea id="lesson-question" rows={2} maxLength={240} value={lessonQuestion} onChange={e=>setLessonQuestion(e.target.value)} placeholder="Record a testable expectation in your own words."/>
  <div className="shape-workbench">
   <div>
    <canvas ref={canvas} width={256} height={256} className="shape-canvas" role="img" aria-label="16 by 16 drawing grid. Drag to mark cells, or use the keyboard coordinate controls below."
    onPointerDown={e=>{drawing.current=true;e.currentTarget.setPointerCapture(e.pointerId);markAtPointer(e)}}
    onPointerMove={e=>{if(drawing.current)markAtPointer(e)}}
    onPointerUp={()=>{drawing.current=false}}
    onPointerCancel={()=>{drawing.current=false}}/>
    <p role="status">{filled} of 256 cells marked.</p>
    <fieldset><legend>Keyboard drawing alternative</legend>
     <label htmlFor="draw-row">Row (1–16)</label> <input id="draw-row" type="number" min={1} max={16} value={brushRow} onChange={e=>setBrushRow(Number(e.target.value))}/>
     <label htmlFor="draw-col">Column (1–16)</label> <input id="draw-col" type="number" min={1} max={16} value={brushCol} onChange={e=>setBrushCol(Number(e.target.value))}/>
     <div className="controls">
      <button className="action" type="button" disabled={!hydrated} onClick={()=>{try{setPixels(p=>setDrawingCell(p,brushRow-1,brushCol-1,true));setError('')}catch{setError('Choose row and column from 1 to 16.')}}}>Mark cell</button>
      <button className="action" type="button" disabled={!hydrated} onClick={()=>{try{setPixels(p=>setDrawingCell(p,brushRow-1,brushCol-1,false));setError('')}catch{setError('Choose row and column from 1 to 16.')}}}>Erase cell</button>
     </div>
    </fieldset>
   </div>
   <div>
    <label htmlFor="shape-preset">Original drawing preset</label>
    <select id="shape-preset" value={preset} onChange={e=>setPreset(e.target.value as Preset)}>
     <option value="diagonal">Diagonal</option><option value="square">Square</option><option value="cross">Cross</option><option value="horizontal">Horizontal line</option>
    </select>
    <div className="controls"><button type="button" className="action" disabled={!hydrated} onClick={()=>{setPixels(presetDrawing(preset));setError('')}}>Load selected preset</button><button type="button" className="action" disabled={!hydrated} onClick={()=>{setPixels(blankDrawing());setError('')}}>Clear drawing</button></div>
    <label htmlFor="shape-label">Training class label</label>
    <input id="shape-label" type="text" maxLength={40} value={label} onChange={e=>setLabel(e.target.value)}/>
    <div className="controls"><button className="action action-primary" type="button" disabled={!hydrated} onClick={save}>Save example</button><button className="action" type="button" disabled={!hydrated} onClick={()=>{setSplit(null);setDataset(createShapeDataset());setPixels(blankDrawing());setError('')}}>Reset entire dataset</button></div>
    {error&&<p role="alert" className="error">{error}</p>}
    <h3>Examples saved: {dataset.examples.length} / 64</h3>
    {counts.length>0&&<p>Classes: {counts.map(c=>c.label+' ('+c.count+')').join(', ')}</p>}
    <ol aria-label="Saved training examples">{dataset.examples.map(ex=><li key={ex.id}>
     <label htmlFor={'label-'+ex.id}>{ex.id}: <input id={'label-'+ex.id} type="text" maxLength={40} defaultValue={ex.label} onBlur={e=>relabel(ex.id,e.target.value)} aria-label={'Change label of '+ex.id}/></label>
     {' '}{ex.pixels.reduce<number>((n,p)=>n+p,0)} marked cells.{' '}
     <button type="button" className="action" disabled={!hydrated} onClick={()=>{setSplit(null);setDataset(d=>removeShapeExample(d,ex.id))}}>Remove {ex.id}</button>
    </li>)}</ol>
    <section aria-label="Held-out test split" className="status-note">
      <h3>Separate training data from unseen test data</h3>
      <p>Choose a reproducible random seed. We hold out samples within each class, so a future model cannot learn from the very examples used to test it.</p>
      <label htmlFor="holdout-seed">Random seed</label>{' '}
      <input id="holdout-seed" type="number" min={0} max={2147483647} value={splitSeed} onChange={e=>{setSplitSeed(Number(e.target.value));setSplit(null)}}/>
      <label htmlFor="holdout-fraction">Test fraction</label>{' '}
      <select id="holdout-fraction" value={testFraction} onChange={e=>{setTestFraction(Number(e.target.value));setSplit(null)}}>
       <option value={0.2}>20%</option><option value={0.25}>25%</option><option value={0.33}>33%</option><option value={0.5}>50%</option>
      </select>
      <div className="controls"><button type="button" className="action" disabled={!hydrated} onClick={()=>{
       try{setSplit(stratifiedHoldout(dataset,{seed:splitSeed,testFraction}));setError('')}
       catch(e){setError(e instanceof Error?e.message:'Could not split data')}
      }}>Create held-out split</button></div>
      {split&&<>
       <p role="status">{split.ready?'Ready for later classifier training':'More examples needed to produce a useful held-out test.'} {split.trainIds.length} training examples, {split.testIds.length} unseen test examples.</p>
       <ul>{split.classes.map(c=><li key={c.label}>{c.label}: {c.train} train, {c.test} test.</li>)}</ul>
       {split.warnings.length>0&&<ul aria-label="Split warnings">{split.warnings.map(w=><li key={w}>{w}</li>)}</ul>}
       <details><summary>Inspect separate example IDs</summary>
        <p>Training IDs: {split.trainIds.join(', ')||'none'}</p><p>Held-out IDs: {split.testIds.join(', ')||'none'}</p>
        <p>Seed {split.seed}; algorithm {split.algorithm}; no example appears in both groups.</p>
       </details>
      </>}
      {split?.ready&&<section aria-label="Train a real linear classifier">
       <h3>Train a classifier on your examples</h3>
       <p>Train a small multinomial logistic classifier locally. Its numerical weights change with your labeled training drawings. Held-out test examples are excluded from the training loop.</p>
       <button type="button" className="action action-primary" disabled={!hydrated} onClick={()=>{
        try{setModel(trainLinearClassifier(dataset,split,{epochs:60,learningRate:0.06}));setError('')}
        catch(e){setError(e instanceof Error?e.message:'Training failed')}
       }}>Train local classifier</button>
       {model&&<div role="status">
        <p><strong>Classifier trained on {model.trainingExampleIds.length} examples.</strong> {model.heldOutExampleCount} examples remained unseen during training.</p>
        <p>Initial cross-entropy loss {model.initialTrainingLoss.toFixed(4)}; final training loss {model.history.at(-1)?.loss.toFixed(4)}. Training accuracy {((model.history.at(-1)?.trainingAccuracy??0)*100).toFixed(1)}%.</p>
        <p>Algorithm {model.algorithm}. {model.epochs} epochs of numerical parameter updates across {model.labels.length} classes.</p>
        <p>These are training metrics, not held-out test accuracy. A classifier may memorize its inputs, so future tests will challenge generalization.</p>
       </div>}
       {holdoutReport&&<div className="status-note" role="region" aria-label="Held-out inference results">
        <p><strong>Held-out check:</strong> {holdoutReport.correctCount} of {holdoutReport.exampleCount} unseen examples matched their labels ({(holdoutReport.accuracy*100).toFixed(1)}%).</p>
        <ul>{holdoutReport.predictions.map(result=><li key={result.id}>{result.id}: actual {result.actualLabel}; predicted {result.predictedLabel}; top score {(result.confidence*100).toFixed(1)}%.</li>)}</ul>
        <table aria-label="Held-out confusion matrix">
         <caption>Actual labels by predicted labels</caption>
         <thead><tr><th scope="col">Actual / Predicted</th>{holdoutReport.metrics.labels.map(predicted=><th scope="col" key={predicted}>{predicted}</th>)}<th scope="col">Actual total</th></tr></thead>
         <tbody>{holdoutReport.metrics.labels.map((actual,row)=><tr key={actual}><th scope="row">{actual}</th>{holdoutReport.metrics.matrix[row].map((count,column)=><td key={holdoutReport.metrics.labels[column]}>{count}</td>)}<td>{holdoutReport.metrics.perClass[row].actualCount}</td></tr>)}</tbody>
        </table>
        <ul aria-label="Per-class held-out metrics">{holdoutReport.metrics.perClass.map(metric=><li key={metric.label}><strong>{metric.label}</strong>: precision {metric.precision===null?'not available (no examples were predicted as this class)':(metric.precision*100).toFixed(1)+'% ('+metric.truePositive+'/'+metric.predictedCount+')'}; recall {metric.recall===null?'not available (no held-out examples have this actual class)':(metric.recall*100).toFixed(1)+'% ('+metric.truePositive+'/'+metric.actualCount+')'}.</li>)}</ul>
       </div>}
       {comparison&&<section className="status-note" role="region" aria-label="Memorization versus generalization trial">
        <h3>Compare memorization with learned parameters</h3>
        <p>Both methods receive the same {comparison.exampleCount} held-out example IDs. The nearest-example method stores every training drawing and chooses the smallest pixel distance; the linear learner uses updated weights.</p>
        <p><strong>Held-out outcomes:</strong> learned parameters matched {comparison.learnerCorrectCount} of {comparison.exampleCount}; nearest-example memory matched {comparison.memorizerCorrectCount} of {comparison.exampleCount}; the methods disagreed on {comparison.disagreementCount}.</p>
        <table aria-label="Per-example memorization and generalization outcomes">
         <caption>Identical held-out examples, with success and failure shown separately</caption>
         <thead><tr><th scope="col">Example</th><th scope="col">Actual</th><th scope="col">Learned parameters</th><th scope="col">Nearest memory</th><th scope="col">Comparison</th></tr></thead>
         <tbody>{comparison.trials.map(trial=><tr key={trial.id}><th scope="row">{trial.id}</th><td>{trial.actualLabel}</td>
          <td>{trial.learnerPredictedLabel} — {trial.learnerCorrect?'success':'failure'}</td>
          <td>{trial.memorizerPredictedLabel} — {trial.memorizerCorrect?'success':'failure'}; distance {trial.memorizerDistance}{trial.memorizerTie?' (tie resolved by stable example ID)':''}</td>
          <td>{trial.disagree?'methods disagree':'same prediction'}</td></tr>)}</tbody>
        </table>
        <details><summary>Inspect the identical evaluation IDs</summary><p>Held-out IDs: {comparison.holdoutExampleIds.join(', ')}.</p><p>Training IDs: {comparison.trainingExampleIds.join(', ')}.</p></details>
        <p>Success on this small split does not prove either method will generalize to different drawings. Failures and disagreements are evidence to inspect, not scores of learner ability.</p>
       </section>}
       {model&&holdoutReport&&<section className="status-note" aria-label="Revise the lesson from test evidence">
        <h3>Revise from evidence</h3>
        <p>Inspect the held-out successes, failures, and disagreements above. Record one change you would make to the examples or labels, then return to the dataset and retrain rather than editing the test result.</p>
        <label htmlFor="revision-note">What will you revise, and what evidence led you there?</label>
        <textarea id="revision-note" rows={3} maxLength={320} value={revisionNote} onChange={e=>setRevisionNote(e.target.value)}/>
        <button type="button" className="action" disabled={!revisionNote.trim()} onClick={()=>{setRevisionCount(count=>count+1);setRevisionNote('');setSplit(null);setError('')}}>Record revision and return to examples</button>
       </section>}
       {revisionCount>0&&<p role="status" className="status-note">{revisionCount} evidence-based revision {revisionCount===1?'has':'have'} been recorded in this page session. Create a new held-out split and retrain to test the revised dataset.</p>}
       {model&&split&&<section className="status-note" aria-label="Noise outlier and misleading-label experiments">
        <h3>Challenge both the drawing and its label</h3>
        <p>Run a reproducible copy-only disturbance over the same held-out IDs. Pixel flips model noise or outliers. The optional misleading label is explicitly declared and scored separately from the source label.</p>
        <label htmlFor="perturbation-seed">Perturbation seed</label>{' '}
        <input id="perturbation-seed" type="number" min={0} max={2147483647} value={perturbationSeed} onChange={e=>{setPerturbationSeed(Number(e.target.value));setPerturbation(null)}}/>
        <label htmlFor="pixel-flips">Pixels flipped per held-out drawing</label>{' '}
        <input id="pixel-flips" type="number" min={0} max={64} value={pixelFlips} onChange={e=>{setPixelFlips(Number(e.target.value));setPerturbation(null)}}/>
        <label><input type="checkbox" checked={includeMisleadingLabel} onChange={e=>{setIncludeMisleadingLabel(e.target.checked);setPerturbation(null)}}/> Intentionally mislabel the first held-out example</label>
        <div className="controls"><button type="button" className="action" onClick={()=>{
         try{setPerturbation(runReproduciblePerturbationTrial(model,dataset,split,{seed:perturbationSeed,pixelFlips,misleadingIds:includeMisleadingLabel?[split.testIds[0]]:[]}));setError('')}
         catch(e){setError(e instanceof Error?e.message:'Perturbation trial failed')}
        }}>Run declared perturbation</button></div>
        {perturbation&&<div role="region" aria-label="Perturbation trial results">
         <p><strong>Baseline source-label matches:</strong> {perturbation.baselineCorrectCount} of {perturbation.exampleCount}. <strong>After {perturbation.pixelFlips} declared pixel flips:</strong> {perturbation.perturbedCorrectAgainstSourceCount} of {perturbation.exampleCount} against unchanged source labels.</p>
         <p>Seed {perturbation.seed}; held-out IDs {perturbation.holdoutExampleIds.join(', ')}. Declared-label score: {perturbation.perturbedCorrectAgainstDeclaredCount} of {perturbation.exampleCount}.</p>
         <table aria-label="Declared perturbation outcomes"><caption>Source truth remains separate from intentional label noise</caption>
          <thead><tr><th scope="col">Example</th><th scope="col">Source label</th><th scope="col">Declared evaluation label</th><th scope="col">Pixel changes</th><th scope="col">Prediction</th></tr></thead>
          <tbody>{perturbation.trials.map(row=><tr key={row.id}><th scope="row">{row.id}</th><td>{row.sourceActualLabel}</td><td>{row.declaredEvaluationLabel}{row.labelWasIntentionallyChanged?' (intentionally misleading)':' (unchanged)'}</td><td>{row.flippedPixelIndexes.length}: {row.flippedPixelIndexes.join(', ')||'none'}</td><td>{row.baselinePredictedLabel} before; {row.perturbedPredictedLabel} after — {row.perturbedCorrectAgainstSource?'source-label success':'source-label failure'}</td></tr>)}</tbody>
         </table>
         <p>The source dataset is unchanged. Every disturbance is listed, and perturbed accuracy is not presented as baseline performance.</p>
        </div>}
       </section>}
       {model&&<section aria-label="Predict a new drawing" className="status-note">
        <h3>Try an unseen drawing</h3>
        <p>Change or clear the drawing without saving it, then calculate scores from the learned parameters. The current drawing is not added to training automatically.</p>
        <button type="button" className="action" disabled={!hydrated} onClick={()=>{
         try{setPrediction(classifyDrawing(model,pixels));setError('')}
         catch(e){setError(e instanceof Error?e.message:'Inference failed')}
        }}>Predict current drawing</button>
        {prediction&&<div role="status">
         <p><strong>Predicted class: {prediction.predictedLabel}</strong>; top score {(prediction.confidence*100).toFixed(1)}%.</p>
         <ul aria-label="Calculated class scores">{prediction.classScores.map(score=><li key={score.label}>{score.label}: {(score.probability*100).toFixed(1)}%</li>)}</ul>
         <p>These relative model scores are calculated from this drawing and the learned weights. They are not calibrated certainty, proof of meaning, or evidence that the model will generalize beyond examples like this small local dataset.</p>
         <p><strong>Transfer complete:</strong> the trained local model evaluated a drawing that was not automatically added to its training set.</p>
        </div>}
       </section>}
      </section>}
      <p>{split?.ready?'You may train this real local model.':'Create a valid split before training a model.'}</p>
    </section>
    {dataset.examples.length>0&&!model&&<p className="status-note">You have created real labeled examples. No model has been trained yet; the next laboratory step is an actual train/test split.</p>}
   </div>
  </div>
 </section>;
}
