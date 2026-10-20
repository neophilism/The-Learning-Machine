import {useMemo,useState} from 'react';
import {evaluateTarget,renderIconSample} from '../../../../packages/vision-lab/src/recognizer.mjs';
import {SYMBOL_KINDS} from '../../../../packages/vision-lab/src/scene.mjs';
import type {Scene,SymbolKind} from '../../../../packages/vision-lab/src/scene.mjs';

const percent=(value:number|null)=>value===null?'not applicable':`${Math.round(value*100)}%`;

export default function IconRecognizer({scene}:{scene:Scene}){
 const [target,setTarget]=useState<SymbolKind>('circle');
 const report=useMemo(()=>{
  const fixtures=scene.symbols.map(symbol=>({actual:symbol.kind,sample:renderIconSample(symbol.kind,(symbol.x-1)%5,(symbol.y-1)%5)}));
  return fixtures.length===0?null:evaluateTarget(fixtures,target);
 },[scene,target]);
 return <section className="icon-recognizer" aria-labelledby="recognizer-title"><h3 id="recognizer-title">Run a selective icon recognizer</h3><p>Each scene symbol is rendered into a separate 9 by 9 pixel sample at an offset derived from its grid position. The recognizer scans every possible location for bounded geometric templates; it does not read the symbol label to make its prediction.</p><div className="vision-controls"><label htmlFor="recognizer-target">Target shape</label><select id="recognizer-target" value={target} onChange={event=>setTarget(event.target.value as SymbolKind)}>{SYMBOL_KINDS.map(value=><option key={value}>{value}</option>)}</select></div>{report?<><p role="status">Target {target}. Precision {percent(report.precision)}. Recall {percent(report.recall)}. {report.counts.truePositive} detected target{report.counts.truePositive===1?'':'s'}; {report.counts.falsePositive} distractor{report.counts.falsePositive===1?'':'s'} incorrectly detected.</p><table><caption>Position-independent recognition results</caption><thead><tr><th>Scene symbol</th><th>Actual shape</th><th>Predicted shape</th><th>Template score</th><th>Target detected</th></tr></thead><tbody>{report.results.map((result,index)=><tr key={scene.symbols[index].id}><td>{scene.symbols[index].id} at column {scene.symbols[index].x}, row {scene.symbols[index].y}</td><td>{result.actual}</td><td>{result.predicted??'none'}</td><td>{result.score.toFixed(2)}</td><td>{result.detected?'yes':'no'}</td></tr>)}</tbody></table></>:<p role="status">Add a symbol to run recognition.</p>}</section>;
}
