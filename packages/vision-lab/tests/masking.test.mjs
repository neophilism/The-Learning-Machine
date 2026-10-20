import test from 'node:test';
import assert from 'node:assert/strict';
import {maskScene} from '../src/masking.mjs';
import {addSymbol,createScene} from '../src/scene.mjs';

const scene=addSymbol(addSymbol(createScene(91,1),{kind:'circle',color:'blue',x:24,y:16}),{kind:'bar',color:'gold',x:1,y:1});
const pixelAt=(frame,x,y)=>frame.rgba.slice(((y-1)*frame.width+x-1)*4,((y-1)*frame.width+x-1)*4+4);

test('manual masking changes only requested output cells without recognition',()=>{const result=maskScene(scene,{mode:'manual',manualCells:[{x:2,y:2}]});assert.equal(result.maskedPixels,1);assert.equal(result.recognitionRuns,0);assert.deepEqual(pixelAt(result.frame,2,2),[28,41,54,255])});
test('blanket masking covers every non-white scene pixel without recognition',()=>{const result=maskScene(scene,{mode:'blanket'});assert.equal(result.maskedPixels,scene.symbols.length);assert.equal(result.recognitionRuns,0);for(const symbol of scene.symbols)assert.deepEqual(pixelAt(result.frame,symbol.x,symbol.y),[28,41,54,255])});
test('selective masking invokes recognition and masks only the predicted target',()=>{const result=maskScene(scene,{mode:'selective',target:'circle'});assert.equal(result.recognitionRuns,scene.symbols.length);assert.equal(result.maskedPixels,scene.symbols.filter(symbol=>symbol.kind==='circle').length);assert.deepEqual(pixelAt(result.frame,24,16),[28,41,54,255]);assert.notDeepEqual(pixelAt(result.frame,1,1),[28,41,54,255])});
test('invalid modes, targets and manual coordinates fail closed',()=>{assert.throws(()=>maskScene(scene,{mode:'blur'}),/Unknown mask/);assert.throws(()=>maskScene(scene,{mode:'selective',target:'star'}),/Unknown selective/);assert.throws(()=>maskScene(scene,{mode:'manual',manualCells:[{x:0,y:1}]}),/outside/)});
