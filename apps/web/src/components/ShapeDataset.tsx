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
  try{setDataset(addShapeExample(dataset,label,pixels));setError('');}
  catch(e){setError(e instanceof Error?e.message:'Cannot save drawing');}
 }
 function relabel(id:string,value:string){
  try{setDataset(d=>relabelShapeExample(d,id,value));setError('');}
  catch(e){setError(e instanceof Error?e.message:'Invalid class label');}
 }
 const filled=pixels.reduce((n,p)=>n+p,0),counts=shapeCounts(dataset);
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
      <button className="action" type="button" onClick={()=>{try{setPixels(p=>setDrawingCell(p,brushRow-1,brushCol-1,true));setError('')}catch{setError('Choose row and column from 1 to 16.')}}}>Mark cell</button>
      <button className="action" type="button" onClick={()=>{try{setPixels(p=>setDrawingCell(p,brushRow-1,brushCol-1,false));setError('')}catch{setError('Choose row and column from 1 to 16.')}}}>Erase cell</button>
     </div>
    </fieldset>
   </div>
   <div>
    <label htmlFor="shape-preset">Original drawing preset</label>
    <select id="shape-preset" value={preset} onChange={e=>setPreset(e.target.value as Preset)}>
     <option value="diagonal">Diagonal</option><option value="square">Square</option><option value="cross">Cross</option><option value="horizontal">Horizontal line</option>
    </select>
    <div className="controls"><button type="button" className="action" onClick={()=>{setPixels(presetDrawing(preset));setError('')}}>Load selected preset</button><button type="button" className="action" onClick={()=>{setPixels(blankDrawing());setError('')}}>Clear drawing</button></div>
    <label htmlFor="shape-label">Training class label</label>
    <input id="shape-label" type="text" maxLength={40} value={label} onChange={e=>setLabel(e.target.value)}/>
    <div className="controls"><button className="action action-primary" type="button" onClick={save}>Save example</button><button className="action" type="button" onClick={()=>{setDataset(createShapeDataset());setPixels(blankDrawing());setError('')}}>Reset entire dataset</button></div>
    {error&&<p role="alert" className="error">{error}</p>}
    <h3>Examples saved: {dataset.examples.length} / 64</h3>
    {counts.length>0&&<p>Classes: {counts.map(c=>c.label+' ('+c.count+')').join(', ')}</p>}
    <ol aria-label="Saved training examples">{dataset.examples.map(ex=><li key={ex.id}>
     <label htmlFor={'label-'+ex.id}>{ex.id}: <input id={'label-'+ex.id} type="text" maxLength={40} defaultValue={ex.label} onBlur={e=>relabel(ex.id,e.target.value)} aria-label={'Change label of '+ex.id}/></label>
     {' '}{ex.pixels.reduce((n,p)=>n+p,0)} marked cells.{' '}
     <button type="button" className="action" onClick={()=>setDataset(d=>removeShapeExample(d,ex.id))}>Remove {ex.id}</button>
    </li>)}</ol>
    {dataset.examples.length>0&&<p className="status-note">You have created real labeled examples. No model has been trained yet; the next laboratory step is an actual train/test split.</p>}
   </div>
  </div>
 </section>;
}
