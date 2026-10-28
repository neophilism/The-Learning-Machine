import type {MelodyNote} from './melody.mjs';
export type MusicLessonExample={id:string;label:string|null;tempo:number;notes:readonly MelodyNote[]};
export const MUSIC_LESSON_EXAMPLES:readonly MusicLessonExample[];
export const MUSIC_LESSON_SPLIT:Readonly<{trainIds:readonly string[];testIds:readonly string[]}>;
export const MUSIC_LESSON_CANDIDATES:readonly MusicLessonExample[];
export function runMusicLearningExperiment(input:{prediction:'rising'|'falling';candidateId:string}):Readonly<Record<string,unknown>>;
export function recordMusicRevision(experiment:Readonly<Record<string,unknown>>,text:string):Readonly<Record<string,unknown>>;
export function runMusicTransfer(revision:Readonly<Record<string,unknown>>,candidateId:string):Readonly<Record<string,unknown>>;
