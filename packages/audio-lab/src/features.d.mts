import type {MelodyNote,MusicalPitch} from './melody.mjs';
export interface AudioFrameFeatures {
 readonly origin:'computed-from-waveform';readonly algorithm:string;
 readonly rms:number;readonly zeroCrossingRateHz:number;
 readonly pitch:null|{readonly name:MusicalPitch;readonly hz:number;readonly confidenceRatio:number;readonly resolution:string};
 readonly timbre:null|{readonly spectralCentroidHz:number|null;readonly spectralFlatness:number|null;readonly interpretation:string};
 readonly durationSeconds:number;
}
export interface MelodyFeatures {
 readonly origin:string;
 readonly noteFeatures:readonly {readonly noteIndex:number;readonly scorePitch:MusicalPitch;readonly scoreOnsetSeconds:number;readonly observedAudio:AudioFrameFeatures}[];
 readonly observedFrames:number;
 readonly rhythm:{readonly tempoBpm:number;readonly scoreOnsetsSeconds:readonly number[];readonly interOnsetIntervalsSeconds:readonly number[];readonly source:string};
 readonly omittedFrames:number;readonly waveformTruncated:boolean;
}
export function analyzeAudioFrame(samples:Float32Array,sampleRate?:number):AudioFrameFeatures;
export function extractMelodyFeatures(notes:readonly MelodyNote[],tempo?:number):MelodyFeatures;
