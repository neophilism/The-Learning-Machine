import {validateHoldout} from './split.mjs';
import {PIXEL_COUNT} from './dataset.mjs';
// Genuine multiclass linear softmax learner: SGD modifies numerical parameters from training IDs only.
function logits(weights,bias,pixels){
 return weights.map((row,k)=>{let n=bias[k];for(let i=0;i<PIXEL_COUNT;i++)n+=row[i]*pixels[i];return n});
}
function probabilities(raw){
 const peak=Math.max(...raw),exps=raw.map(v=>Math.exp(v-peak)),total=exps.reduce((a,b)=>a+b,0);
 return exps.map(v=>v/total);
}
function verifyPixels(pixels){
 if(!Array.isArray(pixels)||pixels.length!==PIXEL_COUNT||pixels.some(v=>v!==0&&v!==1))throw new TypeError('Expected a binary 16×16 drawing');
}
function evaluate(weights,bias,samples,labels){
 let totalLoss=0,correct=0;
 for(const example of samples){
  const p=probabilities(logits(weights,bias,example.pixels));
  const target=labels.indexOf(example.label);
  totalLoss-=Math.log(Math.max(p[target],1e-12));
  if(p.indexOf(Math.max(...p))===target)correct++;
 }
 return {loss:totalLoss/samples.length,accuracy:correct/samples.length};
}
export function trainLinearClassifier(dataset,split,{epochs=60,learningRate=0.06}={}){
 validateHoldout(split,dataset);
 if(!split.ready)throw new RangeError('At least two classes with both training and held-out examples are required');
 if(!Number.isInteger(epochs)||epochs<1||epochs>150)throw new RangeError('Epochs out of bounds');
 if(!Number.isFinite(learningRate)||learningRate<0.001||learningRate>0.25)throw new RangeError('Learning rate out of bounds');
 const labels=split.classes.map(c=>c.label);
 if(labels.length<2||labels.length>16)throw new RangeError('Classifier supports 2–16 classes');
 const map=new Map(dataset.examples.map(e=>[e.id,e]));
 const training=split.trainIds.map(id=>map.get(id));
 if(training.some(x=>!x))throw new TypeError('Training split references unknown examples');
 for(const example of training)verifyPixels(example.pixels);
 const weights=labels.map(()=>new Float64Array(PIXEL_COUNT)),bias=new Float64Array(labels.length),history=[];
 const before=evaluate(weights,bias,training,labels);
 for(let epoch=0;epoch<epochs;epoch++){
  const step=learningRate/(1+epoch*0.012);
  for(const example of training){
   const probs=probabilities(logits(weights,bias,example.pixels));
   const target=labels.indexOf(example.label);
   for(let k=0;k<labels.length;k++){
    const delta=probs[k]-(k===target?1:0);
    bias[k]-=step*delta;
    for(let i=0;i<PIXEL_COUNT;i++)if(example.pixels[i])weights[k][i]-=step*delta;
   }
  }
  const state=evaluate(weights,bias,training,labels);
  history.push(Object.freeze({epoch:epoch+1,loss:state.loss,trainingAccuracy:state.accuracy}));
 }
 const frozenWeights=Object.freeze(weights.map(row=>Object.freeze([...row])));
 return Object.freeze({algorithm:'multiclass-softmax-sgd-v1',labels:Object.freeze([...labels]),weights:frozenWeights,
  bias:Object.freeze([...bias]),epochs,learningRate,trainingExampleIds:Object.freeze([...split.trainIds]),
  heldOutExampleCount:split.testIds.length,initialTrainingLoss:before.loss,history:Object.freeze(history),
  inputShape:Object.freeze([16,16]),source:'trained from browser-local selected training examples only'});
}
export function classifyDrawing(model,pixels){
 verifyPixels(pixels);
 if(!model||model.algorithm!=='multiclass-softmax-sgd-v1'||!Array.isArray(model.weights)||!Array.isArray(model.labels)||!Array.isArray(model.bias))throw new TypeError('Invalid trained classifier');
 const p=probabilities(logits(model.weights,model.bias,pixels));
 const winner=p.indexOf(Math.max(...p));
 return Object.freeze({predictedLabel:model.labels[winner],confidence:p[winner],classScores:Object.freeze(model.labels.map((label,i)=>Object.freeze({label,probability:p[i]}))),origin:'computed-from-learned-parameters'});
}
