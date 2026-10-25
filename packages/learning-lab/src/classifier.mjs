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
 const labels=split.classes.map(c=>c.label),datasetLabels=[...new Set(dataset.examples.map(e=>e.label))].sort((a,b)=>a.localeCompare(b));
 if(labels.length<2||labels.length>16)throw new RangeError('Classifier supports 2–16 classes');
 if(new Set(labels).size!==labels.length||labels.length!==datasetLabels.length||labels.some((label,i)=>label!==datasetLabels[i]))throw new TypeError('Split class metadata does not match dataset labels');
 const map=new Map(dataset.examples.map(e=>[e.id,e]));
 const training=split.trainIds.map(id=>map.get(id)),heldOut=split.testIds.map(id=>map.get(id));
 if(training.some(x=>!x)||heldOut.some(x=>!x))throw new TypeError('Split references unknown examples');
 if(labels.some(label=>!training.some(e=>e.label===label)||!heldOut.some(e=>e.label===label)))throw new RangeError('Every class requires training and held-out examples');
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
 if(model.labels.length<2||model.weights.length!==model.labels.length||model.bias.length!==model.labels.length||model.weights.some(row=>!Array.isArray(row)||row.length!==PIXEL_COUNT||row.some(v=>!Number.isFinite(v)))||model.bias.some(v=>!Number.isFinite(v)))throw new TypeError('Invalid trained classifier dimensions');
 const p=probabilities(logits(model.weights,model.bias,pixels));
 const winner=p.indexOf(Math.max(...p));
 return Object.freeze({predictedLabel:model.labels[winner],confidence:p[winner],classScores:Object.freeze(model.labels.map((label,i)=>Object.freeze({label,probability:p[i]}))),origin:'computed-from-learned-parameters'});
}

export function summarizeClassificationMetrics(labels,predictions){
 if(!Array.isArray(labels)||labels.length<2||labels.length>16||labels.some(label=>typeof label!=='string'||label.length===0)||new Set(labels).size!==labels.length)throw new TypeError('Metrics require 2–16 unique class labels');
 if(!Array.isArray(predictions))throw new TypeError('Metrics require labeled predictions');
 const index=new Map(labels.map((label,i)=>[label,i])),matrix=labels.map(()=>labels.map(()=>0));
 for(const prediction of predictions){
  const actual=index.get(prediction?.actualLabel),predicted=index.get(prediction?.predictedLabel);
  if(actual===undefined||predicted===undefined)throw new TypeError('Prediction references an unknown class label');
  matrix[actual][predicted]++;
 }
 const frozenMatrix=Object.freeze(matrix.map(row=>Object.freeze([...row])));
 const perClass=Object.freeze(labels.map((label,i)=>{
  const truePositive=matrix[i][i],actualCount=matrix[i].reduce((sum,count)=>sum+count,0),predictedCount=matrix.reduce((sum,row)=>sum+row[i],0);
  return Object.freeze({label,truePositive,actualCount,predictedCount,precision:predictedCount===0?null:truePositive/predictedCount,recall:actualCount===0?null:truePositive/actualCount});
 }));
 return Object.freeze({algorithm:'confusion-matrix-v1',labels:Object.freeze([...labels]),matrix:frozenMatrix,perClass,exampleCount:predictions.length,source:'computed from actual and predicted labels for held-out examples'});
}

export function evaluateHoldout(model,dataset,split){
 validateHoldout(split,dataset);
 if(!split.ready||split.testIds.length===0)throw new RangeError('A ready split with held-out examples is required');
 if(!model||!Array.isArray(model.trainingExampleIds))throw new TypeError('Invalid trained classifier');
 const trained=new Set(model.trainingExampleIds),expected=new Set(split.trainIds);
 if(trained.size!==expected.size||[...expected].some(id=>!trained.has(id)))throw new TypeError('Classifier was not trained on this split');
 const examples=new Map(dataset.examples.map(example=>[example.id,example]));
 let correctCount=0;
 const predictions=split.testIds.map(id=>{
  const example=examples.get(id);
  if(!example)throw new TypeError('Split references unknown examples');
  const result=classifyDrawing(model,example.pixels),correct=result.predictedLabel===example.label;
  if(correct)correctCount++;
  return Object.freeze({id,actualLabel:example.label,predictedLabel:result.predictedLabel,confidence:result.confidence,classScores:result.classScores,correct,origin:result.origin});
 });
 const frozenPredictions=Object.freeze(predictions),metrics=summarizeClassificationMetrics(model.labels,frozenPredictions);
 return Object.freeze({algorithm:'heldout-inference-v1',exampleCount:predictions.length,correctCount,accuracy:correctCount/predictions.length,
  predictions:frozenPredictions,metrics,trainingExampleIds:Object.freeze([...model.trainingExampleIds]),
  source:'computed from held-out browser-local examples excluded from training'});
}


function assertMatchingTrainingIds(model,split,name){
 if(!model||!Array.isArray(model.trainingExampleIds))throw new TypeError('Invalid '+name);
 const actual=new Set(model.trainingExampleIds),expected=new Set(split.trainIds);
 if(actual.size!==expected.size||[...expected].some(id=>!actual.has(id)))throw new TypeError(name+' was not trained on this split');
}
function hammingDistance(left,right){
 let distance=0;for(let i=0;i<PIXEL_COUNT;i++)if(left[i]!==right[i])distance++;return distance;
}
export function trainNearestExampleMemorizer(dataset,split){
 validateHoldout(split,dataset);
 if(!split.ready)throw new RangeError('At least two classes with both training and held-out examples are required');
 const examples=new Map(dataset.examples.map(example=>[example.id,example]));
 const trainingExamples=split.trainIds.map(id=>{
  const example=examples.get(id);if(!example)throw new TypeError('Split references unknown examples');
  verifyPixels(example.pixels);
  return Object.freeze({id:example.id,label:example.label,pixels:Object.freeze([...example.pixels])});
 });
 return Object.freeze({algorithm:'nearest-example-memorizer-v1',trainingExampleIds:Object.freeze([...split.trainIds]),
  trainingExamples:Object.freeze(trainingExamples),inputShape:Object.freeze([16,16]),
  source:'stores every selected browser-local training example and chooses the smallest Hamming distance'});
}
export function classifyNearestExample(model,pixels){
 verifyPixels(pixels);
 if(!model||model.algorithm!=='nearest-example-memorizer-v1'||!Array.isArray(model.trainingExamples)||model.trainingExamples.length===0)throw new TypeError('Invalid nearest-example memorizer');
 const ranked=model.trainingExamples.map(example=>{
  if(!example||typeof example.id!=='string'||typeof example.label!=='string')throw new TypeError('Invalid nearest-example memorizer');
  verifyPixels(example.pixels);return {example,distance:hammingDistance(example.pixels,pixels)};
 }).sort((left,right)=>left.distance-right.distance||left.example.id.localeCompare(right.example.id));
 const nearestDistance=ranked[0].distance,ties=ranked.filter(item=>item.distance===nearestDistance);
 return Object.freeze({predictedLabel:ties[0].example.label,nearestDistance,
  nearestExampleIds:Object.freeze(ties.map(item=>item.example.id)),tie:ties.length>1,
  origin:'computed-from-stored-training-examples'});
}
export function compareMemorizationGeneralization(linearModel,memorizer,dataset,split){
 validateHoldout(split,dataset);
 if(!split.ready||split.testIds.length===0)throw new RangeError('A ready split with held-out examples is required');
 assertMatchingTrainingIds(linearModel,split,'Classifier');
 assertMatchingTrainingIds(memorizer,split,'Memorizer');
 const examples=new Map(dataset.examples.map(example=>[example.id,example]));
 let learnerCorrectCount=0,memorizerCorrectCount=0,disagreementCount=0;
 const trials=split.testIds.map(id=>{
  const example=examples.get(id);if(!example)throw new TypeError('Split references unknown examples');
  const learner=classifyDrawing(linearModel,example.pixels),memory=classifyNearestExample(memorizer,example.pixels);
  const learnerCorrect=learner.predictedLabel===example.label,memorizerCorrect=memory.predictedLabel===example.label;
  if(learnerCorrect)learnerCorrectCount++;if(memorizerCorrect)memorizerCorrectCount++;
  const disagree=learner.predictedLabel!==memory.predictedLabel;if(disagree)disagreementCount++;
  return Object.freeze({id,actualLabel:example.label,learnerPredictedLabel:learner.predictedLabel,
   memorizerPredictedLabel:memory.predictedLabel,learnerCorrect,memorizerCorrect,disagree,
   memorizerDistance:memory.nearestDistance,memorizerTie:memory.tie});
 });
 return Object.freeze({algorithm:'memorization-generalization-trial-v1',holdoutExampleIds:Object.freeze([...split.testIds]),
  trainingExampleIds:Object.freeze([...split.trainIds]),exampleCount:trials.length,learnerCorrectCount,memorizerCorrectCount,
  disagreementCount,trials:Object.freeze(trials),
  source:'both methods evaluated against the identical held-out IDs; outcomes do not prove generalization beyond this split'});
}
