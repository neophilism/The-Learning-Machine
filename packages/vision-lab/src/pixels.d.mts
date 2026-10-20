import type {Scene} from './scene.mjs';
export const PIXEL_OPERATIONS:readonly ['grayscale','invert','threshold'];
export type PixelOperation=typeof PIXEL_OPERATIONS[number];
export interface PixelFrame {readonly width:24;readonly height:16;readonly rgba:readonly number[]}
export interface PixelStep {readonly operation:PixelOperation;readonly inputDigest:string;readonly outputDigest:string;readonly changedPixels:number}
export interface PixelTrace {readonly source:PixelFrame;readonly final:PixelFrame;readonly sourceDigest:string;readonly finalDigest:string;readonly steps:readonly PixelStep[]}
export function frameDigest(frame:PixelFrame):string;
export function rasterizeScene(scene:Scene):PixelFrame;
export function transformFrame(frame:PixelFrame,operation:PixelOperation):{readonly operation:PixelOperation;readonly inputDigest:string;readonly outputDigest:string;readonly changedPixels:number;readonly output:PixelFrame};
export function processScene(scene:Scene,operations?:readonly PixelOperation[]):PixelTrace;
