import test from 'node:test';
import assert from 'node:assert/strict';
import {addSymbol,createScene,describeScene,MAX_SYMBOLS,removeLastSymbol,snapshotScene} from '../src/scene.mjs';

test('seeded original scenes have a stable inspectable snapshot',()=>{
 const first=createScene(20261020,6),second=createScene(20261020,6);
 assert.deepEqual(first,second);
 assert.equal(snapshotScene(first),'diamond:blue:21,9|diamond:magenta:9,5|circle:green:20,16|triangle:gold:4,6|diamond:blue:6,13|bar:magenta:8,1');
 assert.ok(Object.isFrozen(first));assert.ok(Object.isFrozen(first.symbols));
});

test('text equivalents identify every color, shape and grid position',()=>{
 const scene=createScene(9,4),description=describeScene(scene);
 assert.match(description.summary,/seed 9/);assert.equal(description.items.length,4);
 scene.symbols.forEach((symbol,index)=>assert.equal(description.items[index],`${index+1}. ${symbol.color} ${symbol.kind} at column ${symbol.x}, row ${symbol.y}.`));
});

test('keyboard-authored symbols use canonical IDs and bounded coordinates',()=>{
 let scene=createScene(1,1);scene=addSymbol(scene,{kind:'triangle',color:'gold',x:24,y:16});
 assert.equal(scene.symbols.at(-1).id,'symbol-2');assert.match(describeScene(scene).items.at(-1),/column 24, row 16/);
 assert.throws(()=>addSymbol(scene,{kind:'logo',color:'gold',x:1,y:1}),/Unknown symbol kind/);
 assert.throws(()=>addSymbol(scene,{kind:'circle',color:'gold',x:0,y:1}),/x must be an integer/);
});

test('scene size and removal fail closed',()=>{
 let scene=createScene(5,MAX_SYMBOLS);assert.throws(()=>addSymbol(scene,{kind:'bar',color:'blue',x:1,y:1}),/full/);
 for(let index=0;index<MAX_SYMBOLS;index++)scene=removeLastSymbol(scene);
 assert.throws(()=>removeLastSymbol(scene),/empty/);assert.throws(()=>createScene(-1),/seed/);assert.throws(()=>createScene(1,0),/count/);
});
