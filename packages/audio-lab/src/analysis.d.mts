import type {MelodyNote} from './melody.mjs';
export function synthesizeSamples(notes:readonly MelodyNote[],tempo?:number,settings?:{sampleRate?:number;maxSeconds?:number}):{samples:Float32Array;sampleRate:number;durationSeconds:number;fullDurationSeconds:number;truncated:boolean;origin:string};
export function waveformPeaks(values:Float32Array,buckets?:number):Array<{min:number;max:number}>;
export function spectrogram(values:Float32Array,settings?:{sampleRate?:number;windows?:number;bins?:number;fftSize?:number}):{powers:number[][];windows:number;bins:number;frequencyMaxHz:number;algorithm:string;source:string};
