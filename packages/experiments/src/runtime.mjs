import {validateExperimentDefinition,validateObservation} from '@learning-machine/contracts';
const definition=Object.freeze({schemaVersion:'1.0.0',id:'synthetic-masking-v1',version:'1.0.0',title:'Local pixel-mask experiment',capabilities:['canvas','keyboard'],timeoutMs:3000});
function integer(value,name,min,max){if(!Number.isInteger(value)||value<min||value>max)throw new RangeError(name+' out of bounds');return value}
export function validateMaskInput(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('Expected synthetic scene input');
 const width=integer(input.width,'width',12,192),height=integer(input.height,'height',12,108);
 if(!['selective','blanket','known-position'].includes(input.method))throw new TypeError('Unknown masking method');
 const target=input.target;
 if(!target||typeof target!=='object'||Array.isArray(target))throw new TypeError('Missing target');
 const x=integer(target.x,'x',0,width-1),y=integer(target.y,'y',0,height-1);
 const tw=integer(target.width,'target width',1,width),th=integer(target.height,'target height',1,height);
 if(x+tw>width||y+th>height)throw new RangeError('Target escapes synthetic frame');
 return Object.freeze({width,height,method:input.method,target:Object.freeze({x,y,width:tw,height:th})});
}
export function maskSyntheticFrame(raw){
 const input=validateMaskInput(raw),pixels=new Uint8ClampedArray(input.width*input.height*3);
 const {x,y,width:tw,height:th}=input.target;
 for(let row=0;row<input.height;row++)for(let col=0;col<input.width;col++){
  const ix=(row*input.width+col)*3,inside=col>=x&&col<x+tw&&row>=y&&row<y+th;
  pixels[ix]=inside?240:190;pixels[ix+1]=inside?135:205;pixels[ix+2]=inside?45:220;
 }
 const original=pixels.slice(),output=pixels.slice();
 let maskedPixels=0,otherPixelsMasked=0,recognitionPixelReads=0,targetPixelsMasked=0;
 const mask=(pos,inside)=>{
  const ix=pos*3;output[ix]=35;output[ix+1]=57;output[ix+2]=76;
  maskedPixels++;if(inside)targetPixelsMasked++;else otherPixelsMasked++;
 };
 for(let row=0;row<input.height;row++)for(let col=0;col<input.width;col++){
  const pos=row*input.width+col,ix=pos*3;
  const inside=col>=x&&col<x+tw&&row>=y&&row<y+th;
  let maskHere;
  if(input.method==='blanket')maskHere=true;
  else if(input.method==='known-position')maskHere=inside;
  else{
   recognitionPixelReads++;
   maskHere=original[ix]>225&&original[ix+1]>95&&original[ix+1]<170&&original[ix+2]<80;
  }
  if(maskHere)mask(pos,inside);
 }
 return {input,original,output,metrics:Object.freeze({
  totalPixels:input.width*input.height,maskedPixels,targetPixels:tw*th,targetPixelsMasked,
  otherPixelsMasked,recognitionPixelReads,recognitionPerformed:input.method==='selective',
  targetFullyConcealed:targetPixelsMasked===tw*th,
  source:'generated RGB pixels',algorithm:input.method==='selective'?'bounded RGB threshold scan':input.method==='blanket'?'unconditional frame masking':'authored coordinates'
 })};
}
export const syntheticMaskExperiment=Object.freeze({
 manifest:definition,
 validateInput:validateMaskInput,
 async execute(input,{signal,runId}){
  if(signal.aborted)throw new Error('Aborted');
  const result=maskSyntheticFrame(input);
  const d=result.metrics;
  return {metrics:d,observation:{
   schemaVersion:'1.0.0',experimentId:definition.id,runId,kind:'computed',
   description:`${input.method}: concealed ${d.targetPixelsMasked} of ${d.targetPixels} target pixels, and ${d.otherPixelsMasked} other pixels; inspected ${d.recognitionPixelReads} pixels for target recognition.`,
   value:d.targetPixelsMasked,unit:'pixels',sourceId:'original-synthetic-pixel-frame'
  }};
 }
});
export function createExperimentRunner(definitions=[syntheticMaskExperiment]){
 if(!Array.isArray(definitions)||!definitions.length)throw new TypeError('Experiment registry must not be empty');
 const registry=new Map();
 for(const d of definitions){
  if(!d||typeof d.validateInput!=='function'||typeof d.execute!=='function')throw new TypeError('Invalid experiment implementation');
  const m=validateExperimentDefinition(d.manifest);
  if(registry.has(m.id))throw new RangeError('Duplicate experiment identifier');
  registry.set(m.id,{...d,manifest:m});
 }
 let sequence=0,active=null;
 function cancel(reason='cancelled'){if(!active)return false;active.controller.abort(reason);active=null;return true}
 async function run(experimentId,rawInput){
  const d=registry.get(experimentId);if(!d)throw new RangeError('Unknown registered experiment');
  const input=d.validateInput(rawInput);
  cancel('superseded');const sequenceId=++sequence;
  const runId='local-run-'+sequenceId;
  const controller=new AbortController();active={sequenceId,controller};
  const timeout=setTimeout(()=>controller.abort('timeout'),d.manifest.timeoutMs);
  let rejectAbort;
  const stopped=new Promise((_,reject)=>{rejectAbort=()=>reject(new Error('aborted'));controller.signal.addEventListener('abort',rejectAbort,{once:true});});
  try{
   const response=await Promise.race([Promise.resolve().then(()=>d.execute(input,{signal:controller.signal,runId})),stopped]);
   if(active?.sequenceId!==sequenceId||controller.signal.aborted)return {status:'cancelled',runId};
   if(!response||typeof response!=='object')throw new TypeError('Experiment produced invalid result');
   const observation=validateObservation(response.observation);
   if(observation.experimentId!==experimentId||observation.runId!==runId)throw new TypeError('Experiment result is from an unexpected run');
   return {status:'completed',runId,observation,metrics:response.metrics};
  }catch(e){
   if(controller.signal.aborted)return {status:controller.signal.reason==='timeout'?'timed_out':'cancelled',runId};
   return {status:'failed',runId,error:e instanceof Error?e.message:'Unknown experiment failure'};
  }finally{
   clearTimeout(timeout);
   controller.signal.removeEventListener('abort',rejectAbort);
   if(active?.sequenceId===sequenceId)active=null;
  }
 }
 return Object.freeze({run,cancel,available:()=>[...registry.keys()]});
}
