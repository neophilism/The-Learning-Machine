import {useEffect,useMemo,useState} from 'react';
import {evaluateTarget,perturbIconSample,renderIconSample} from '../../../../packages/vision-lab/src/recognizer.mjs';
import {SYMBOL_KINDS} from '../../../../packages/vision-lab/src/scene.mjs';
import type {Scene,SymbolKind} from '../../../../packages/vision-lab/src/scene.mjs';

const percent=(value:number|null)=>value===null?'not applicable':`${Math.round(value*100)}%`;
const metric=(value:number|null,numerator:number,denominator:number)=>`${percent(value)} (${numerator}/${denominator})`;

export default function IconRecognizer({scene}:{scene:Scene}){
 const [hydrated,setHydrated]=useState(false);
 const [target,setTarget]=useState<SymbolKind>('circle');
 const [minimumPercent,setMinimumPercent]=useState(90);
 const [challenging,setChallenging]=useState(false);
 useEffect(()=>setHydrated(true),[]);
 const report=useMemo(()=>{
  const fixtures=scene.symbols.map(symbol=>{
   const sample=renderIconSample(symbol.kind,(symbol.x-1)%5,(symbol.y-1)%5);
   return {actual:symbol.kind,sample:challenging?perturbIconSample(sample,1):sample};
  });
  return fixtures.length===0?null:evaluateTarget(fixtures,target,{minimumScore:minimumPercent/100,uncertaintyMargin:.05});
 },[scene,target,minimumPercent,challenging]);
 return <section className="icon-recognizer" aria-labelledby="recognizer-title"><h3 id="recognizer-title">Run a selective icon recognizer</h3><p>Each scene symbol is rendered into a separate 9 by 9 pixel sample at an offset derived from its grid position. The recognizer scans every possible location for bounded geometric templates; it does not read the symbol label to make its prediction.</p><div className="vision-controls"><label htmlFor="recognizer-target">Target shape</label><select id="recognizer-target" disabled={!hydrated} value={target} onChange={event=>setTarget(event.target.value as SymbolKind)}>{SYMBOL_KINDS.map(value=><option key={value}>{value}</option>)}</select><label htmlFor="recognizer-threshold">Minimum score</label><input id="recognizer-threshold" type="range" min="70" max="100" step="5" disabled={!hydrated} value={minimumPercent} onChange={event=>setMinimumPercent(Number(event.target.value))}/><output htmlFor="recognizer-threshold">{minimumPercent}%</output><label htmlFor="recognizer-challenge"><input id="recognizer-challenge" type="checkbox" disabled={!hydrated} checked={challenging} onChange={event=>setChallenging(event.target.checked)}/> Apply one deterministic pixel change per sample</label></div>{report?<><p role="status">Target {target}. Precision {metric(report.precision,report.counts.truePositive,report.denominators.precision)}. Recall {metric(report.recall,report.counts.truePositive,report.denominators.recall)}. False positives {report.counts.falsePositive}. Missed targets {report.counts.falseNegative}. Near-threshold uncertain results {report.counts.uncertain}.</p><table><caption>Position-independent recognition results</caption><thead><tr><th>Scene symbol</th><th>Actual shape</th><th>Predicted shape</th><th>Template score</th><th>Target detected</th><th>Uncertainty</th></tr></thead><tbody>{report.results.map((result,index)=><tr key={scene.symbols[index].id}><td>{scene.symbols[index].id} at column {scene.symbols[index].x}, row {scene.symbols[index].y}</td><td>{result.actual}</td><td>{result.predicted??'none'}</td><td>{result.score.toFixed(2)}</td><td>{result.detected?'yes':'no'}</td><td>{result.uncertain?'within 5 points of threshold':'outside threshold margin'}</td></tr>)}</tbody></table></>:<p role="status">Add a symbol to run recognition.</p>}</section>;
}
