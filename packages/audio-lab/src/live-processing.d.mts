export const FILTER_MODES:readonly ['bypass','lowpass','highpass'];
export type LiveProcessingSettings={mode?:'bypass'|'lowpass'|'highpass';cutoffHz?:number;inputGain?:number;monitor?:boolean};
export function validateLiveProcessingSettings(value?:LiveProcessingSettings):Readonly<{mode:'bypass'|'lowpass'|'highpass';cutoffHz:number;inputGain:number;monitor:boolean}>;
export function createLiveProcessingPlan(value?:LiveProcessingSettings):Readonly<{mode:'bypass'|'lowpass'|'highpass';cutoffHz:number;inputGain:number;monitor:boolean;nodeType:BiquadFilterType;q:number;outputGain:number;execution:string;retention:string}>;
export function classifyMicrophoneFailure(reason:unknown):Readonly<{state:'denied'|'unavailable'|'error';message:string}>;
export function summarizeLatency(context:{baseLatency?:number;outputLatency?:number}|null,setupStartedMs:number,setupCompletedMs:number):Readonly<{setupMilliseconds:number;browserReportedMilliseconds:number|null;measurement:string;caveat:string}>;
