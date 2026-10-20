import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateTarget,perturbIconSample,recognizeIcon,renderIconSample,SAMPLE_SIZE} from '../src/recognizer.mjs';

const fixtures=[
 {actual:'circle',sample:renderIconSample('circle',0,0)},
 {actual:'circle',sample:renderIconSample('circle',4,4)},
 {actual:'circle',sample:renderIconSample('circle',1,3)},
 {actual:'diamond',sample:renderIconSample('diamond',4,0)},
 {actual:'triangle',sample:renderIconSample('triangle',0,4)},
 {actual:'bar',sample:renderIconSample('bar',3,1)}
];

test('recognizer identifies every icon at novel placements',()=>{
 for(const fixture of fixtures){const result=recognizeIcon(fixture.sample);assert.equal(result.kind,fixture.actual);assert.equal(result.score,1)}
});

test('target evaluation reports exact counts, denominators, precision and recall',()=>{
 const report=evaluateTarget(fixtures,'circle');
 assert.deepEqual(report.counts,{truePositive:3,falsePositive:0,falseNegative:0,trueNegative:3,uncertain:0});
 assert.deepEqual(report.denominators,{precision:3,recall:3});
 assert.equal(report.precision,1);assert.equal(report.recall,1);
});

test('pixel changes and thresholds produce computed misses and uncertainty',()=>{
 const challenged=fixtures.map(fixture=>({...fixture,sample:perturbIconSample(fixture.sample,1)}));
 const strict=evaluateTarget(challenged,'circle',{minimumScore:.95,uncertaintyMargin:.05});
 assert.deepEqual(strict.counts,{truePositive:0,falsePositive:0,falseNegative:3,trueNegative:3,uncertain:5});
 assert.deepEqual(strict.denominators,{precision:0,recall:3});
 assert.equal(strict.precision,null);assert.equal(strict.recall,0);
 const permissive=evaluateTarget(challenged,'circle',{minimumScore:.85,uncertaintyMargin:.05});
 assert.equal(permissive.counts.truePositive,3);assert.equal(permissive.counts.falseNegative,0);
});

test('false positives and empty metric denominators remain explicit',()=>{
 const mislabeled=[{actual:'diamond',sample:renderIconSample('circle')}];
 const falsePositive=evaluateTarget(mislabeled,'circle');
 assert.deepEqual(falsePositive.counts,{truePositive:0,falsePositive:1,falseNegative:0,trueNegative:0,uncertain:0});
 assert.deepEqual(falsePositive.denominators,{precision:1,recall:0});
 assert.equal(falsePositive.precision,0);assert.equal(falsePositive.recall,null);
 const noDetections=evaluateTarget([{actual:'circle',sample:perturbIconSample(renderIconSample('circle'),2)}],'circle');
 assert.equal(noDetections.precision,null);assert.equal(noDetections.recall,0);
});

test('blank and sufficiently corrupted samples are rejected',()=>{
 const blank={width:SAMPLE_SIZE,height:SAMPLE_SIZE,pixels:Array(SAMPLE_SIZE*SAMPLE_SIZE).fill(false)};
 assert.equal(recognizeIcon(blank).kind,null);
 const pixels=renderIconSample('circle',2,2).pixels.slice();
 for(let index=0;index<pixels.length;index+=2)pixels[index]=!pixels[index];
 assert.equal(recognizeIcon({width:SAMPLE_SIZE,height:SAMPLE_SIZE,pixels}).kind,null);
});

test('malformed samples, targets, offsets, perturbations and thresholds fail closed',()=>{
 assert.throws(()=>renderIconSample('star'),/Unknown/);
 assert.throws(()=>renderIconSample('circle',5,0),/offsetX/);
 assert.throws(()=>recognizeIcon({width:9,height:9,pixels:[true]}),/Invalid/);
 assert.throws(()=>perturbIconSample(renderIconSample('circle'),17),/changes/);
 assert.throws(()=>recognizeIcon(renderIconSample('circle'),{minimumScore:2}),/minimumScore/);
 assert.throws(()=>evaluateTarget(fixtures,'circle',{uncertaintyMargin:-1}),/uncertaintyMargin/);
 assert.throws(()=>evaluateTarget([], 'circle'),/non-empty/);
});
