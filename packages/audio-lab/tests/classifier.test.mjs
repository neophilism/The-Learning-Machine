import test from 'node:test';import assert from 'node:assert/strict';
import {trainMusicalPatternClassifier,classifyMusicalPattern,evaluateMusicalHoldout} from '../src/classifier.mjs';
const n=(pitch,beats=1)=>({pitch,beats});
const examples=[
 {id:'up-1',label:'rising',notes:[n('C4'),n('D4'),n('E4'),n('G4')]},{id:'up-2',label:'rising',notes:[n('D4'),n('E4'),n('F4'),n('A4')]},
 {id:'up-3',label:'rising',notes:[n('C4'),n('E4'),n('G4'),n('C5')]},{id:'down-1',label:'falling',notes:[n('C5'),n('B4'),n('G4'),n('E4')]},
 {id:'down-2',label:'falling',notes:[n('A4'),n('G4'),n('E4'),n('C4')]},{id:'down-3',label:'falling',notes:[n('G4'),n('F4'),n('D4'),n('C4')]}
];
const split={trainIds:['up-1','up-2','down-1','down-2'],testIds:['up-3','down-3']};
test('trains on declared IDs and predicts genuinely novel melodies',()=>{const model=trainMusicalPatternClassifier(examples,split);assert.deepEqual(model.trainingExampleIds,split.trainIds);assert.equal(classifyMusicalPattern(model,[n('C4'),n('D4'),n('F4'),n('B4')]).predictedLabel,'rising');assert.equal(classifyMusicalPattern(model,[n('B4'),n('G4'),n('E4'),n('D4')]).predictedLabel,'falling')});
test('evaluates only the held-out musical examples',()=>{const result=evaluateMusicalHoldout(trainMusicalPatternClassifier(examples,split),examples,split);assert.equal(result.exampleCount,2);assert.equal(result.correctCount,2);assert.deepEqual(result.predictions.map(row=>row.id),split.testIds)});
test('rejects leakage, missing classes and oversized melodies',()=>{assert.throws(()=>trainMusicalPatternClassifier(examples,{trainIds:['up-1','up-2','down-1','down-2'],testIds:['up-1','up-3','down-3']}),/disjoint/);assert.throws(()=>trainMusicalPatternClassifier(examples,{trainIds:['up-1','up-2','up-3','down-1','down-2'],testIds:['down-3']}),/Every/);const model=trainMusicalPatternClassifier(examples,split);assert.throws(()=>classifyMusicalPattern(model,Array(32).fill(n('C4',4)),60),/bounded/)});
test('fails closed for a model trained on another split',()=>{const model=trainMusicalPatternClassifier(examples,split);assert.throws(()=>evaluateMusicalHoldout(model,examples,{trainIds:['up-1','up-3','down-1','down-3'],testIds:['up-2','down-2']}),/not trained/)});
