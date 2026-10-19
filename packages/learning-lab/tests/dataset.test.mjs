import test from 'node:test';import assert from 'node:assert/strict';
import {GRID_SIZE,PIXEL_COUNT,MAX_EXAMPLES,blankDrawing,setDrawingCell,presetDrawing,createShapeDataset,addShapeExample,removeShapeExample,relabelShapeExample,shapeCounts} from '../src/dataset.mjs';
test('drawings are immutable binary grids and support keyboard-style single cell painting',()=>{
 const blank=blankDrawing(),modified=setDrawingCell(blank,2,5);
 assert.equal(blank.length,PIXEL_COUNT);assert.equal(blank[2*GRID_SIZE+5],0);assert.equal(modified[2*GRID_SIZE+5],1);
 assert.equal(setDrawingCell(modified,2,5,false)[2*GRID_SIZE+5],0);
 assert.ok(Object.isFrozen(modified));
});
test('original presets produce distinct nonempty shapes',()=>{
 for(const kind of ['diagonal','square','cross','horizontal'])assert.ok(presetDrawing(kind).includes(1));
 assert.notDeepEqual(presetDrawing('cross'),presetDrawing('horizontal'));
});
test('users create, relabel and remove competing classes without remote storage',()=>{
 let d=createShapeDataset();d=addShapeExample(d,'Shape A',presetDrawing('square'));d=addShapeExample(d,'Shape B',presetDrawing('cross'));
 assert.deepEqual(shapeCounts(d),[{label:'Shape A',count:1},{label:'Shape B',count:1}]);
 d=relabelShapeExample(d,'ex-1','Shape B');assert.deepEqual(shapeCounts(d),[{label:'Shape B',count:2}]);
 d=removeShapeExample(d,'ex-2');assert.equal(d.examples.length,1);assert.equal(d.nextId,3);
});
test('reject malformed drawings, missing labels and unknown edits',()=>{
 let d=createShapeDataset();assert.throws(()=>addShapeExample(d,'',presetDrawing('cross')),TypeError);
 assert.throws(()=>addShapeExample(d,'A',blankDrawing()),RangeError);
 assert.throws(()=>setDrawingCell(blankDrawing(),-1,0),RangeError);
 assert.throws(()=>setDrawingCell([1],1,1),TypeError);
 assert.throws(()=>removeShapeExample(d,'missing'),RangeError);
});
test('bounded dataset rejects the 65th sample while preserving 64 originals',()=>{
 let d=createShapeDataset();for(let i=0;i<MAX_EXAMPLES;i++)d=addShapeExample(d,'A',presetDrawing('diagonal'));
 assert.equal(d.examples.length,64);assert.throws(()=>addShapeExample(d,'B',presetDrawing('cross')),RangeError);
});
test('stored drawings are detached snapshots, not pointers to the working canvas',()=>{
 const drawing=[...presetDrawing('square')];const d=addShapeExample(createShapeDataset(),'A',drawing);
 drawing[1]=1;assert.equal(d.examples[0].pixels[1],0);
});
