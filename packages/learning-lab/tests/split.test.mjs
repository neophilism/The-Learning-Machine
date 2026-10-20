import test from 'node:test';import assert from 'node:assert/strict';
import {createShapeDataset,addShapeExample,presetDrawing} from '../src/dataset.mjs';
import {stratifiedHoldout,validateHoldout} from '../src/split.mjs';
function sampleDataset(){
 let d=createShapeDataset();
 for(let i=0;i<8;i++)d=addShapeExample(d,i<4?'A':'B',presetDrawing(i%2?'cross':'square'));
 return d;
}
test('deterministic split preserves all examples and never duplicates train/test IDs',()=>{
 const d=sampleDataset(),a=stratifiedHoldout(d,{seed:127,testFraction:.25}),b=stratifiedHoldout(d,{seed:127,testFraction:.25});
 assert.deepEqual(a,b);assert.equal(a.trainIds.length,6);assert.equal(a.testIds.length,2);
 assert.equal(new Set([...a.trainIds,...a.testIds]).size,8);assert.equal(validateHoldout(a,d),true);
 assert.deepEqual(a.classes.map(c=>[c.label,c.train,c.test]),[['A',3,1],['B',3,1]]);
});
test('different seeds can yield distinct held-out examples without changing class ratios',()=>{
 const d=sampleDataset(),combinations=new Set();
 for(let seed=0;seed<30;seed++)combinations.add(stratifiedHoldout(d,{seed}).testIds.join('|'));
 assert.ok(combinations.size>2);
});
test('inadequate class counts produce explicit warnings rather than fabricated tests',()=>{
 let d=createShapeDataset();d=addShapeExample(d,'A',presetDrawing('cross'));d=addShapeExample(d,'B',presetDrawing('square'));
 const x=stratifiedHoldout(d);assert.equal(x.ready,false);assert.equal(x.testIds.length,0);assert.equal(x.warnings.length,2);
});
test('empty datasets return an incomplete split with actionable warnings',()=>{
 const x=stratifiedHoldout(createShapeDataset());assert.equal(x.ready,false);assert.equal(x.trainIds.length,0);assert.ok(x.warnings.length>=1);
});
test('forged duplicated or overlapping train/test membership is rejected',()=>{
 const d=sampleDataset(),x=stratifiedHoldout(d);
 assert.throws(()=>validateHoldout({...x,testIds:[x.trainIds[0],...x.testIds]},d),/leakage/);
 assert.throws(()=>validateHoldout({...x,trainIds:[...x.trainIds,x.trainIds[0]]},d),/Repeated/);
});
test('invalid seeds, fractions and duplicate IDs are refused',()=>{
 const d=sampleDataset();assert.throws(()=>stratifiedHoldout(d,{seed:-1}),RangeError);assert.throws(()=>stratifiedHoldout(d,{testFraction:.99}),RangeError);
 const broken={...d,examples:[d.examples[0],d.examples[0]]};assert.throws(()=>stratifiedHoldout(broken),/duplicate/);
});
