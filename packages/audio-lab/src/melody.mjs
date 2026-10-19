// Original synthetic tone notation and deterministic melody scheduling.
export const NOTE_NAMES=Object.freeze(['C4','D4','E4','F4','G4','A4','B4','C5']);
const frequencies=Object.freeze({C4:261.625565,D4:293.664768,E4:329.627557,F4:349.228231,G4:391.995436,A4:440,B4:493.883301,C5:523.251131});
export function validateMelody(value){
 if(!Array.isArray(value)||value.length>32)throw new TypeError('Melody must contain up to 32 notes');
 return value.map((note,i)=>{
  if(!note||typeof note!=='object'||!Object.hasOwn(frequencies,note.pitch))throw new TypeError('Invalid pitch at note '+i);
  if(!Number.isInteger(note.beats)||note.beats<1||note.beats>4)throw new RangeError('Beats must be an integer between 1 and 4');
  return Object.freeze({pitch:note.pitch,beats:note.beats});
 });
}
export function compileMelody(notes,tempo=110){
 const valid=validateMelody(notes);
 if(!Number.isFinite(tempo)||tempo<45||tempo>220)throw new RangeError('Tempo out of range');
 const beatSeconds=60/tempo;let offset=0;
 const events=valid.map((note,i)=>{const result=Object.freeze({index:i,pitch:note.pitch,frequencyHz:frequencies[note.pitch],startSeconds:offset,durationSeconds:note.beats*beatSeconds});offset+=result.durationSeconds;return result});
 return Object.freeze({events,totalSeconds:offset,tempo,origin:'locally-computed-original-notes'});
}
export function defaultMelody(){return Object.freeze([{pitch:'C4',beats:1},{pitch:'E4',beats:1},{pitch:'G4',beats:1},{pitch:'C5',beats:2}]);}
