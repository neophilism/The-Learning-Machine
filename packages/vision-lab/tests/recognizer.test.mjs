import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateTarget,recognizeIcon,renderIconSample,SAMPLE_SIZE} from '../src/recognizer.mjs';

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

test('target evaluation reports exact precision and recall while rejecting distractors',()=>{
 const report=evaluateTarget(fixtures,'circle');
 assert.deepEqual(report.counts,{truePositive:3,falsePositive:0,falseNegative:0,trueNegative:3});
 assert.equal(report.precision,1);assert.equal(report.recall,1);
});

test('blank and sufficiently corrupted samples are rejected',()=>{
 const blank={width:SAMPLE_SIZE,height:SAMPLE_SIZE,pixels:Array(SAMPLE_SIZE*SAMPLE_SIZE).fill(false)};
 assert.equal(recognizeIcon(blank).kind,null);
 const pixels=renderIconSample('circle',2,2).pixels.slice();
 for(let index=0;index<pixels.length;index+=2)pixels[index]=!pixels[index];
 assert.equal(recognizeIcon({width:SAMPLE_SIZE,height:SAMPLE_SIZE,pixels}).kind,null);
});

test('malformed samples, targets, offsets and thresholds fail closed',()=>{
 assert.throws(()=>renderIconSample('star'),/Unknown/);
 assert.throws(()=>renderIconSample('circle',5,0),/offsetX/);
 assert.throws(()=>recognizeIcon({width:9,height:9,pixels:[true]}),/Invalid/);
 assert.throws(()=>recognizeIcon(renderIconSample('circle'),{minimumScore:2}),/minimumScore/);
 assert.throws(()=>evaluateTarget([], 'circle'),/non-empty/);
});
