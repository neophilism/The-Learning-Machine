import type {SymbolKind} from './scene.mjs';
export const ICON_SIZE:5;
export const SAMPLE_SIZE:9;
export interface IconSample {readonly width:9;readonly height:9;readonly pixels:readonly boolean[]}
export interface Recognition {readonly kind:SymbolKind|null;readonly score:number;readonly offsetX:number|null;readonly offsetY:number|null}
export interface RecognitionFixture {readonly actual:SymbolKind;readonly sample:IconSample}
export interface TargetResult {readonly actual:SymbolKind;readonly expected:boolean;readonly detected:boolean;readonly predicted:SymbolKind|null;readonly score:number;readonly offsetX:number|null;readonly offsetY:number|null}
export interface TargetReport {readonly target:SymbolKind;readonly counts:{readonly truePositive:number;readonly falsePositive:number;readonly falseNegative:number;readonly trueNegative:number};readonly precision:number|null;readonly recall:number|null;readonly results:readonly TargetResult[]}
export function renderIconSample(kind:SymbolKind,offsetX?:number,offsetY?:number):IconSample;
export function recognizeIcon(sample:IconSample,options?:{minimumScore?:number}):Recognition;
export function evaluateTarget(fixtures:readonly RecognitionFixture[],target:SymbolKind,options?:{minimumScore?:number}):TargetReport;
