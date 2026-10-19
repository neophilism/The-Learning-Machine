import type {Observation} from '@learning-machine/contracts';
export type MaskMethod='selective'|'blanket'|'known-position';
export interface MaskInput {width:number;height:number;method:MaskMethod;target:{x:number;y:number;width:number;height:number}}
export interface MaskMetrics {totalPixels:number;maskedPixels:number;targetPixels:number;targetPixelsMasked:number;otherPixelsMasked:number;recognitionPixelReads:number;recognitionPerformed:boolean;targetFullyConcealed:boolean;source:string;algorithm:string}
export function validateMaskInput(input:unknown):MaskInput;
export function maskSyntheticFrame(input:MaskInput):{input:MaskInput;original:Uint8ClampedArray;output:Uint8ClampedArray;metrics:MaskMetrics};
export interface ExperimentDefinition {manifest:{schemaVersion:string;id:string;version:string;title:string;capabilities:string[];timeoutMs:number};validateInput(input:unknown):unknown;execute(input:any,context:{signal:AbortSignal;runId:string}):Promise<{observation:Observation;metrics?:unknown}>}
export const syntheticMaskExperiment:ExperimentDefinition;
export type RunResult={status:'completed';runId:string;observation:Observation;metrics:MaskMetrics}|{status:'cancelled'|'timed_out';runId:string}|{status:'failed';runId:string;error:string};
export function createExperimentRunner(definitions?:ExperimentDefinition[]):{run(experimentId:string,input:unknown):Promise<RunResult>;cancel(reason?:string):boolean;available():string[]};
