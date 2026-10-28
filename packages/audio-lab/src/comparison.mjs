import {classifyMusicalPattern} from './classifier.mjs';
import {NOTE_NAMES,validateMelody} from './melody.mjs';

function validateTempo(value){
 if(!Number.isFinite(value)||value<45||value>220)throw new RangeError('Tempo out of range');
 return value;
}
function prepareMelody(notes,tempo=110){
 const valid=validateMelody(notes);
 if(valid.length<2)throw new RangeError('Expression comparison requires at least two notes');
 return Object.freeze({notes:valid,tempo:validateTempo(tempo)});
}
function intervals(notes){return notes.slice(1).map((note,index)=>NOTE_NAMES.indexOf(note.pitch)-NOTE_NAMES.indexOf(notes[index].pitch))}
function sameNumbers(left,right){return left.length===right.length&&left.every((value,index)=>value===right[index])}
function exactExpression(left,right){
 return left.tempo===right.tempo&&left.notes.length===right.notes.length&&left.notes.every((note,index)=>note.pitch===right.notes[index].pitch&&note.beats===right.notes[index].beats);
}
function sequenceDistance(left,right){
 const rows=left.notes.length+1,columns=right.notes.length+1,matrix=Array.from({length:rows},()=>new Float64Array(columns));
 for(let row=0;row<rows;row++)matrix[row][0]=row;
 for(let column=0;column<columns;column++)matrix[0][column]=column;
 for(let row=1;row<rows;row++)for(let column=1;column<columns;column++){
  const a=left.notes[row-1],b=right.notes[column-1];
  const substitution=Math.abs(NOTE_NAMES.indexOf(a.pitch)-NOTE_NAMES.indexOf(b.pitch))/7*.7+Math.abs(a.beats-b.beats)/3*.3;
  matrix[row][column]=Math.min(matrix[row-1][column]+1,matrix[row][column-1]+1,matrix[row-1][column-1]+substitution);
 }
 const noteDistance=matrix[rows-1][columns-1]/Math.max(left.notes.length,right.notes.length);
 const tempoDistance=Math.abs(left.tempo-right.tempo)/175;
 return Math.min(1,noteDistance*.85+tempoDistance*.15);
}
function prepareLibrary(examples){
 if(!Array.isArray(examples)||examples.length<1||examples.length>128)throw new RangeError('Expected 1–128 authored melody examples');
 const ids=new Set();
 return examples.map(example=>{
  if(!example||typeof example.id!=='string'||example.id.length===0||ids.has(example.id))throw new TypeError('Authored example IDs must be unique nonempty strings');
  ids.add(example.id);
  return Object.freeze({id:example.id,label:typeof example.label==='string'&&example.label?example.label:null,...prepareMelody(example.notes,example.tempo??110)});
 });
}

export function compareMusicalExpression(model,authoredExamples,candidateNotes,candidateTempo=110){
 const library=prepareLibrary(authoredExamples),candidate=prepareMelody(candidateNotes,candidateTempo),candidateIntervals=intervals(candidate.notes);
 const comparisons=library.map(example=>Object.freeze({
  id:example.id,
  distance:sequenceDistance(example,candidate),
  exactReplay:exactExpression(example,candidate),
  sameIntervalPattern:sameNumbers(intervals(example.notes),candidateIntervals)
 })).sort((left,right)=>left.distance-right.distance||left.id.localeCompare(right.id));
 const exactReplayIds=comparisons.filter(row=>row.exactReplay).map(row=>row.id);
 const transformedPatternIds=comparisons.filter(row=>!row.exactReplay&&row.sameIntervalPattern).map(row=>row.id);
 const prediction=classifyMusicalPattern(model,candidate.notes,candidate.tempo);
 const relationship=exactReplayIds.length?'direct-replay':transformedPatternIds.length?'transformed-pattern':'new-sequence';
 const disclosure=relationship==='direct-replay'
  ?'The candidate exactly replays stored pitches, note lengths, and tempo.'
  :relationship==='transformed-pattern'
   ?'The candidate is not an exact replay, but it preserves a stored interval pattern.'
   :'No exact replay or identical stored interval pattern was detected in this bounded library.';
 return Object.freeze({
  algorithm:'musical-expression-comparison-v1',
  relationship,
  exactReplayIds:Object.freeze(exactReplayIds),
  transformedPatternIds:Object.freeze(transformedPatternIds),
  nearestStoredExample:Object.freeze({id:comparisons[0].id,distance:comparisons[0].distance}),
  generalizedPattern:Object.freeze({label:prediction.predictedLabel,confidence:prediction.confidence,origin:prediction.origin}),
  disclosure:disclosure+' This comparison does not establish authorship, copyrightability, independent creation, or legal originality.',
  source:'computed from authored note events, tempo, stored examples, and the local learned classifier'
 });
}
