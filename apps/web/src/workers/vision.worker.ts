import {processScene} from '../../../../packages/vision-lab/src/pixels.mjs';
import {evaluateTarget,perturbIconSample,renderIconSample} from '../../../../packages/vision-lab/src/recognizer.mjs';
import type {PixelOperation} from '../../../../packages/vision-lab/src/pixels.mjs';
import type {Scene,SymbolKind} from '../../../../packages/vision-lab/src/scene.mjs';

type PixelTask={kind:'pixels';scene:Scene;operations:readonly PixelOperation[]};
type RecognitionTask={kind:'recognition';scene:Scene;target:SymbolKind;minimumScore:number;challenging:boolean};
type Request={requestId:number;budgetMs:number;task:PixelTask|RecognitionTask};

const scope=self as unknown as {onmessage:((event:MessageEvent<Request>)=>void)|null;postMessage(message:unknown):void};
scope.onmessage=(event:MessageEvent<Request>)=>{
 const request=event.data,started=performance.now();
 try{
  if(!request||!Number.isInteger(request.requestId)||!Number.isInteger(request.budgetMs)||request.budgetMs<1)throw new TypeError('Invalid vision worker request');
  let result;
  if(request.task.kind==='pixels')result=processScene(request.task.scene,request.task.operations);
  else if(request.task.kind==='recognition'){
   const fixtures=request.task.scene.symbols.map(symbol=>{const sample=renderIconSample(symbol.kind,(symbol.x-1)%5,(symbol.y-1)%5);return {actual:symbol.kind,sample:request.task.challenging?perturbIconSample(sample,1):sample}});
   result=fixtures.length===0?null:evaluateTarget(fixtures,request.task.target,{minimumScore:request.task.minimumScore,uncertaintyMargin:.05});
  }else throw new TypeError('Unknown vision worker task');
  if(performance.now()-started>request.budgetMs)throw new Error('Vision computation exceeded its budget');
  scope.postMessage({requestId:request.requestId,ok:true,result});
 }catch(error){scope.postMessage({requestId:request?.requestId,ok:false,error:error instanceof Error?error.message:'Vision computation failed'})}
};
