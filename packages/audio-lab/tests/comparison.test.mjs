import test from 'node:test';import assert from 'node:assert/strict';
import {trainMusicalPatternClassifier} from '../src/classifier.mjs';
import {compareMusicalExpression} from '../src/comparison.mjs';
const n=(pitch,beats=1)=>({pitch,beats});
const examples=[
 {id:'up-1',label:'rising',notes:[n('C4'),n('D4'),n('E4'),n('G4')]},{id:'up-2',label:'rising',notes:[n('D4'),n('E4'),n('F4'),n('A4')]},
 {id:'up-3',label:'rising',notes:[n('C4'),n('E4'),n('G4'),n('C5')]},{id:'down-1',label:'falling',notes:[n('C5'),n('B4'),n('G4'),n('E4')]},
 {id:'down-2',label:'falling',notes:[n('A4'),n('G4'),n('E4'),n('C4')]},{id:'down-3',label:'falling',notes:[n('G4'),n('F4'),n('D4'),n('C4')]}
];
const split={trainIds:['up-1','up-2','down-1','down-2'],testIds:['up-3','down-3']};
const model=trainMusicalPatternClassifier(examples,split);
test('labels an exact authored expression as a direct replay',()=>{const result=compareMusicalExpression(model,examples,examples[0].notes);assert.equal(result.relationship,'direct-replay');assert.deepEqual(result.exactReplayIds,['up-1']);assert.equal(result.nearestStoredExample.distance,0);assert.match(result.disclosure,/does not establish authorship/)});
test('separates transformed patterns from exact replay and learned class',()=>{const candidate=[n('E4'),n('F4'),n('G4'),n('B4')],result=compareMusicalExpression(model,examples,candidate);assert.equal(result.relationship,'transformed-pattern');assert.deepEqual(result.exactReplayIds,[]);assert.deepEqual(result.transformedPatternIds,['up-1']);assert.equal(result.generalizedPattern.label,'rising');assert.equal(result.generalizedPattern.origin,'computed-from-local-musical-features')});
test('labels a different sequence without claiming legal originality',()=>{const result=compareMusicalExpression(model,examples,[n('C4',2),n('F4'),n('D4',3),n('B4')],130);assert.equal(result.relationship,'new-sequence');assert.ok(result.nearestStoredExample.distance>0);assert.match(result.disclosure,/No exact replay/);assert.match(result.disclosure,/copyrightability/)});
test('fails closed for malformed libraries, melodies, tempos and models',()=>{assert.throws(()=>compareMusicalExpression(model,[],examples[0].notes),/1–128/);assert.throws(()=>compareMusicalExpression(model,[examples[0],examples[0]],examples[0].notes),/unique/);assert.throws(()=>compareMusicalExpression(model,examples,[n('C4')]),/at least two/);assert.throws(()=>compareMusicalExpression(model,examples,examples[0].notes,300),/Tempo/);assert.throws(()=>compareMusicalExpression({},examples,examples[0].notes),/Invalid musical/)});
