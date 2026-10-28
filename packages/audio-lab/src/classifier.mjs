import {extractMelodyFeatures} from './features.mjs';
import {NOTE_NAMES,validateMelody} from './melody.mjs';

const FEATURE_COUNT=8;
function vectorFor(notes,tempo=110){
 const valid=validateMelody(notes);if(valid.length<2)throw new RangeError('Musical classifier requires at least two notes');
 const extracted=extractMelodyFeatures(valid,tempo);
 if(extracted.noteFeatures.length!==valid.length||extracted.waveformTruncated)throw new RangeError('Melody exceeds the bounded feature window');
 const pitches=extracted.noteFeatures.map(n=>NOTE_NAMES.indexOf(n.observedAudio.pitch?.name));
 if(pitches.some(index=>index<0))throw new RangeError('Every note requires a resolved audio-derived pitch');
 const intervals=pitches.slice(1).map((pitch,index)=>pitch-pitches[index]);
 const mean=array=>array.reduce((sum,value)=>sum+value,0)/array.length;
 return Object.freeze([
  mean(pitches)/7,(Math.max(...pitches)-Math.min(...pitches))/7,
  mean(intervals)/7,intervals.filter(value=>value>0).length/intervals.length,
  intervals.filter(value=>value===0).length/intervals.length,
  mean(valid.map(note=>note.beats))/4,extracted.rhythm.tempoBpm/220,
  mean(extracted.noteFeatures.map(n=>n.observedAudio.timbre?.spectralCentroidHz??0))/1600
 ]);
}
function probabilities(logits){const peak=Math.max(...logits),values=logits.map(value=>Math.exp(value-peak)),total=values.reduce((sum,value)=>sum+value,0);return values.map(value=>value/total)}
function validateExamples(examples){
 if(!Array.isArray(examples)||examples.length<4||examples.length>128)throw new RangeError('Expected 4–128 labeled melody examples');
 const ids=new Set();return examples.map((example,index)=>{
  if(!example||typeof example.id!=='string'||example.id.length===0||ids.has(example.id))throw new TypeError('Melody example IDs must be unique nonempty strings');ids.add(example.id);
  if(typeof example.label!=='string'||example.label.length===0||example.label.length>40)throw new TypeError('Melody labels must be nonempty and bounded');
  const tempo=example.tempo??110;return Object.freeze({id:example.id,label:example.label,vector:vectorFor(example.notes,tempo)});
 });
}
function resolveSplit(examples,split){
 if(!split||!Array.isArray(split.trainIds)||!Array.isArray(split.testIds))throw new TypeError('Expected explicit training and held-out IDs');
 const all=[...split.trainIds,...split.testIds];if(new Set(all).size!==all.length||all.length!==examples.length)throw new TypeError('Split IDs must be disjoint and cover every example');
 const map=new Map(examples.map(example=>[example.id,example]));if(all.some(id=>!map.has(id)))throw new TypeError('Split references an unknown melody example');
 const training=split.trainIds.map(id=>map.get(id)),heldOut=split.testIds.map(id=>map.get(id));
 const labels=[...new Set(examples.map(example=>example.label))].sort((a,b)=>a.localeCompare(b));
 if(labels.length<2||labels.length>8||labels.some(label=>!training.some(example=>example.label===label)||!heldOut.some(example=>example.label===label)))throw new RangeError('Every one of 2–8 classes requires training and held-out examples');
 return {training,heldOut,labels};
}
function infer(model,vector){const logits=model.weights.map((row,k)=>row.reduce((sum,value,i)=>sum+value*vector[i],model.bias[k])),scores=probabilities(logits),winner=scores.indexOf(Math.max(...scores));return Object.freeze({predictedLabel:model.labels[winner],confidence:scores[winner],classScores:Object.freeze(model.labels.map((label,i)=>Object.freeze({label,probability:scores[i]}))),origin:'computed-from-local-musical-features'})}

export function trainMusicalPatternClassifier(examples,split,{epochs=100,learningRate=0.12}={}){
 const prepared=validateExamples(examples),{training,heldOut,labels}=resolveSplit(prepared,split);
 if(!Number.isInteger(epochs)||epochs<1||epochs>200)throw new RangeError('Epochs out of bounds');
 if(!Number.isFinite(learningRate)||learningRate<0.001||learningRate>0.3)throw new RangeError('Learning rate out of bounds');
 const weights=labels.map(()=>new Float64Array(FEATURE_COUNT)),bias=new Float64Array(labels.length);
 for(let epoch=0;epoch<epochs;epoch++)for(const example of training){
  const scores=probabilities(weights.map((row,k)=>row.reduce((sum,value,i)=>sum+value*example.vector[i],bias[k]))),target=labels.indexOf(example.label),step=learningRate/(1+epoch*.015);
  for(let k=0;k<labels.length;k++){const delta=scores[k]-(k===target?1:0);bias[k]-=step*delta;for(let i=0;i<FEATURE_COUNT;i++)weights[k][i]-=step*delta*example.vector[i]}
 }
 return Object.freeze({algorithm:'musical-feature-softmax-sgd-v1',labels:Object.freeze(labels),weights:Object.freeze(weights.map(row=>Object.freeze([...row]))),bias:Object.freeze([...bias]),
  epochs,learningRate,trainingExampleIds:Object.freeze([...split.trainIds]),heldOutExampleIds:Object.freeze([...split.testIds]),
  featureNames:Object.freeze(['mean-pitch','pitch-range','mean-interval','ascending-ratio','repeat-ratio','mean-note-length','tempo','spectral-centroid']),
  source:'trained locally from bounded waveform-derived and authored-timing melody features'});
}
export function classifyMusicalPattern(model,notes,tempo=110){
 if(!model||model.algorithm!=='musical-feature-softmax-sgd-v1'||!Array.isArray(model.labels)||!Array.isArray(model.weights)||!Array.isArray(model.bias)||model.weights.some(row=>!Array.isArray(row)||row.length!==FEATURE_COUNT||row.some(value=>!Number.isFinite(value)))||model.bias.some(value=>!Number.isFinite(value)))throw new TypeError('Invalid musical pattern classifier');
 return infer(model,vectorFor(notes,tempo));
}
export function evaluateMusicalHoldout(model,examples,split){
 const prepared=validateExamples(examples),{heldOut}=resolveSplit(prepared,split),expected=new Set(split.trainIds),actual=new Set(model?.trainingExampleIds??[]);
 if(expected.size!==actual.size||[...expected].some(id=>!actual.has(id)))throw new TypeError('Classifier was not trained on this split');
 let correctCount=0;const byId=new Map(examples.map(example=>[example.id,example]));
 const predictions=heldOut.map(example=>{const source=byId.get(example.id),result=classifyMusicalPattern(model,source.notes,source.tempo??110),correct=result.predictedLabel===example.label;if(correct)correctCount++;return Object.freeze({id:example.id,actualLabel:example.label,predictedLabel:result.predictedLabel,confidence:result.confidence,correct})});
 return Object.freeze({algorithm:'musical-heldout-evaluation-v1',exampleCount:predictions.length,correctCount,accuracy:correctCount/predictions.length,predictions:Object.freeze(predictions),source:'computed only from melody IDs excluded from training'});
}
