import test from 'node:test';import assert from 'node:assert/strict';
import {createShapeDataset,addShapeExample,presetDrawing} from '../src/dataset.mjs';
import {stratifiedHoldout} from '../src/split.mjs';
import {trainLinearClassifier,classifyDrawing,evaluateHoldout,summarizeClassificationMetrics,trainNearestExampleMemorizer,classifyNearestExample,compareMemorizationGeneralization} from '../src/classifier.mjs';
function trainingData(){
 let d=createShapeDataset();for(let i=0;i<4;i++)d=addShapeExample(d,'Line',presetDrawing('horizontal'));
 for(let i=0;i<4;i++)d=addShapeExample(d,'Square',presetDrawing('square'));return d;
}
test('SGD truly changes learned weights, reduces cross entropy and classifies distinct original shapes',()=>{
 const d=trainingData(),s=stratifiedHoldout(d,{seed:6}),model=trainLinearClassifier(d,s,{epochs:45,learningRate:.05});
 assert.equal(model.trainingExampleIds.length,6);assert.equal(model.heldOutExampleCount,2);
 assert.ok(model.history.at(-1).loss<model.initialTrainingLoss);
 assert.ok(model.weights.some(row=>row.some(w=>Math.abs(w)>.001)));
 assert.equal(classifyDrawing(model,presetDrawing('horizontal')).predictedLabel,'Line');
 assert.equal(classifyDrawing(model,presetDrawing('square')).predictedLabel,'Square');
 assert.ok(model.history.at(-1).trainingAccuracy>.95);
});
test('fixed data and seed produce exactly reproducible model parameters',()=>{
 const d=trainingData(),s=stratifiedHoldout(d,{seed:81});
 assert.deepEqual(trainLinearClassifier(d,s),trainLinearClassifier(d,s));
});
test('mutating only held-out pixels cannot influence training',()=>{
 const d=trainingData(),s=stratifiedHoldout(d,{seed:7});
 const base=trainLinearClassifier(d,s);
 const held=new Set(s.testIds);
 const altered={...d,examples:d.examples.map(x=>held.has(x.id)?{...x,pixels:[...presetDrawing('cross')]}:x)};
 const changed=trainLinearClassifier(altered,s);
 assert.deepEqual(base.weights,changed.weights);assert.deepEqual(base.bias,changed.bias);
});
test('prediction probabilities are normalized from learned parameters',()=>{
 const d=trainingData(),s=stratifiedHoldout(d),m=trainLinearClassifier(d,s);
 const x=classifyDrawing(m,presetDrawing('square'));
 assert.ok(Math.abs(x.classScores.reduce((n,c)=>n+c.probability,0)-1)<1e-10);
 assert.equal(x.origin,'computed-from-learned-parameters');
});
test('inadequate data and unsafe hyperparameters fail closed',()=>{
 const d=trainingData(),s=stratifiedHoldout(d);
 assert.throws(()=>trainLinearClassifier(d,s,{epochs:0}),RangeError);
 assert.throws(()=>trainLinearClassifier(d,s,{learningRate:100}),RangeError);
 assert.throws(()=>classifyDrawing({},presetDrawing('horizontal')),TypeError);
 assert.throws(()=>classifyDrawing({...trainLinearClassifier(d,s),weights:[[1]]},presetDrawing('horizontal')),/dimensions/);
 assert.throws(()=>classifyDrawing({...trainLinearClassifier(d,s),bias:[0]},presetDrawing('horizontal')),/dimensions/);
 assert.throws(()=>trainLinearClassifier(d,{...s,classes:s.classes.map((c,i)=>({...c,label:i?'Square':'Forged'}))}),/metadata/);
 let tiny=createShapeDataset();tiny=addShapeExample(tiny,'A',presetDrawing('square'));
 assert.throws(()=>trainLinearClassifier(tiny,stratifiedHoldout(tiny)),/two classes/);
});

test('held-out inference evaluates only examples excluded from training',()=>{
 const d=trainingData(),s=stratifiedHoldout(d,{seed:19}),m=trainLinearClassifier(d,s);
 const report=evaluateHoldout(m,d,s),training=new Set(m.trainingExampleIds);
 assert.equal(report.exampleCount,s.testIds.length);
 assert.equal(report.correctCount,report.exampleCount);
 assert.equal(report.accuracy,1);
 assert.deepEqual(report.predictions.map(p=>p.id),s.testIds);
 assert.ok(report.predictions.every(p=>!training.has(p.id)&&p.origin==='computed-from-learned-parameters'));
 assert.ok(report.predictions.every(p=>Math.abs(p.classScores.reduce((sum,x)=>sum+x.probability,0)-1)<1e-10));
});
test('new drawing scores come from learned parameters and matching split evidence is required',()=>{
 const d=trainingData(),s=stratifiedHoldout(d,{seed:23}),m=trainLinearClassifier(d,s);
 const line=classifyDrawing(m,presetDrawing('horizontal')),square=classifyDrawing(m,presetDrawing('square'));
 assert.equal(line.predictedLabel,'Line');assert.equal(square.predictedLabel,'Square');
 assert.notDeepEqual(line.classScores,square.classScores);
 assert.throws(()=>evaluateHoldout(m,d,{...s,trainIds:s.trainIds.slice(1)}),/split|cover/i);
 const mismatched={...m,trainingExampleIds:m.trainingExampleIds.slice(1)};
 assert.throws(()=>evaluateHoldout(mismatched,d,s),/not trained on this split/);
});

test('balanced metrics preserve imbalanced confusion counts and exact denominators',()=>{
 const metrics=summarizeClassificationMetrics(['A','B','C'],[{actualLabel:'A',predictedLabel:'A'},{actualLabel:'A',predictedLabel:'A'},{actualLabel:'A',predictedLabel:'B'},{actualLabel:'B',predictedLabel:'A'},{actualLabel:'C',predictedLabel:'C'}]);
 assert.deepEqual(metrics.matrix,[[2,1,0],[1,0,0],[0,0,1]]);
 assert.deepEqual(metrics.perClass.map(x=>({label:x.label,tp:x.truePositive,actual:x.actualCount,predicted:x.predictedCount})),[{label:'A',tp:2,actual:3,predicted:3},{label:'B',tp:0,actual:1,predicted:1},{label:'C',tp:1,actual:1,predicted:1}]);
 assert.equal(metrics.perClass[0].precision,2/3);assert.equal(metrics.perClass[0].recall,2/3);assert.equal(metrics.exampleCount,5);
});
test('balanced metrics report empty-class denominators without invented zero scores',()=>{
 const metrics=summarizeClassificationMetrics(['A','B','C'],[{actualLabel:'A',predictedLabel:'A'},{actualLabel:'A',predictedLabel:'B'}]);
 assert.deepEqual(metrics.matrix,[[1,1,0],[0,0,0],[0,0,0]]);
 assert.equal(metrics.perClass[1].precision,0);assert.equal(metrics.perClass[1].recall,null);
 assert.equal(metrics.perClass[2].precision,null);assert.equal(metrics.perClass[2].recall,null);
 assert.throws(()=>summarizeClassificationMetrics(['A','B'],[{actualLabel:'A',predictedLabel:'C'}]),/unknown class/);
 assert.throws(()=>summarizeClassificationMetrics(['A','A'],[]),/unique class/);
});


test('memorizing and generalizing methods run against the identical held-out IDs',()=>{
 const d=trainingData(),s=stratifiedHoldout(d,{seed:29}),learner=trainLinearClassifier(d,s);
 const memorizer=trainNearestExampleMemorizer(d,s),comparison=compareMemorizationGeneralization(learner,memorizer,d,s);
 assert.deepEqual(comparison.holdoutExampleIds,s.testIds);
 assert.deepEqual(comparison.trainingExampleIds,s.trainIds);
 assert.equal(comparison.exampleCount,s.testIds.length);
 assert.equal(comparison.trials.length,s.testIds.length);
 assert.deepEqual(comparison.trials.map(trial=>trial.id),s.testIds);
 assert.ok(comparison.trials.every(trial=>typeof trial.learnerCorrect==='boolean'&&typeof trial.memorizerCorrect==='boolean'&&typeof trial.disagree==='boolean'));
 assert.equal(comparison.source,'both methods evaluated against the identical held-out IDs; outcomes do not prove generalization beyond this split');
});

test('nearest-example memorization exposes successes, failures and deterministic ties on unseen examples',()=>{
 const horizontal=[...presetDrawing('horizontal')],square=[...presetDrawing('square')];
 const dataset={nextId:7,examples:[
  {id:'ex-1',label:'Line',pixels:horizontal},{id:'ex-2',label:'Line',pixels:horizontal},
  {id:'ex-3',label:'Square',pixels:square},{id:'ex-4',label:'Square',pixels:square},
  {id:'ex-5',label:'Line',pixels:horizontal},{id:'ex-6',label:'Square',pixels:horizontal}
 ]};
 const split={algorithm:'fixture',seed:0,testFraction:1/3,trainIds:['ex-1','ex-2','ex-3','ex-4'],testIds:['ex-5','ex-6'],
  classes:[{label:'Line',total:3,train:2,test:1},{label:'Square',total:3,train:2,test:1}],warnings:[],ready:true,source:'fixture'};
 const learner=trainLinearClassifier(dataset,split,{epochs:45,learningRate:.05}),memorizer=trainNearestExampleMemorizer(dataset,split);
 const comparison=compareMemorizationGeneralization(learner,memorizer,dataset,split);
 assert.equal(comparison.trials[0].memorizerCorrect,true);
 assert.equal(comparison.trials[1].memorizerCorrect,false);
 assert.equal(comparison.memorizerCorrectCount,1);
 const tieModel={...memorizer,trainingExamples:[
  {id:'a',label:'Line',pixels:horizontal},{id:'b',label:'Square',pixels:horizontal}
 ]};
 const tied=classifyNearestExample(tieModel,horizontal);
 assert.equal(tied.tie,true);assert.deepEqual(tied.nearestExampleIds,['a','b']);assert.equal(tied.predictedLabel,'Line');
});

test('comparison rejects mismatched training evidence and malformed memorizer inputs',()=>{
 const d=trainingData(),s=stratifiedHoldout(d,{seed:31}),learner=trainLinearClassifier(d,s),memorizer=trainNearestExampleMemorizer(d,s);
 assert.throws(()=>compareMemorizationGeneralization(learner,{...memorizer,trainingExampleIds:memorizer.trainingExampleIds.slice(1)},d,s),/not trained on this split/);
 assert.throws(()=>classifyNearestExample({},presetDrawing('horizontal')),/Invalid nearest-example/);
 assert.throws(()=>trainNearestExampleMemorizer(d,{...s,ready:false}),/two classes/);
});
