import type {PixelFrame} from './pixels.mjs';
import type {Scene,SymbolKind} from './scene.mjs';
export const MASK_MODES:readonly ['manual','blanket','selective'];
export type MaskMode=typeof MASK_MODES[number];
export interface MaskResult {readonly mode:MaskMode;readonly target:SymbolKind|null;readonly maskedPixels:number;readonly recognitionRuns:number;readonly frame:PixelFrame}
export function maskScene(scene:Scene,options?:{mode?:MaskMode;manualCells?:readonly {x:number;y:number}[];target?:SymbolKind}):MaskResult;
