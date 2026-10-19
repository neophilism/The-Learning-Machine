export type MusicalPitch='C4'|'D4'|'E4'|'F4'|'G4'|'A4'|'B4'|'C5';
export interface MelodyNote {pitch:MusicalPitch;beats:number}
export interface ScheduledNote {index:number;pitch:MusicalPitch;frequencyHz:number;startSeconds:number;durationSeconds:number}
export interface MelodySchedule {events:readonly ScheduledNote[];totalSeconds:number;tempo:number;origin:'locally-computed-original-notes'}
export const NOTE_NAMES:readonly MusicalPitch[];
export function validateMelody(value:unknown):readonly MelodyNote[];
export function compileMelody(notes:readonly MelodyNote[],tempo?:number):MelodySchedule;
export function defaultMelody():readonly MelodyNote[];
