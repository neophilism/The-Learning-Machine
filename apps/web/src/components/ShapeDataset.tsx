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
 const [splitSeed,setSplitSeed]=useState(42);
 const [testFraction,setTestFraction]=useState(0.25);
 useEffect(()=>setHydrated(true),[]);
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
 return <section className="learning-card drawing-lab" aria-label="Create local training examples">
  <h2>Create examples for a future classifier</h2>
  <p>Draw a simple shape, assign it a label, and save it as a training example. Create examples for at least two different labels to prepare for a classification experiment. Everything remains on this device, in this page, until you reset or leave.</p>
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
      <p>This is a dataset split only. No model is trained by this action.</p>
    </section>
    {dataset.examples.length>0&&<p className="status-note">You have created real labeled examples. No model has been trained yet; the next laboratory step is an actual train/test split.</p>}
   </div>
  </div>
 </section>;
}
