export const SCENE_WIDTH:24;
export const SCENE_HEIGHT:16;
export const MAX_SYMBOLS:12;
export const SYMBOL_KINDS:readonly ['circle','diamond','triangle','bar'];
export const SYMBOL_COLORS:readonly ['blue','gold','magenta','green'];
export type SymbolKind=typeof SYMBOL_KINDS[number];
export type SymbolColor=typeof SYMBOL_COLORS[number];
export interface SceneSymbol {readonly id:string;readonly kind:SymbolKind;readonly color:SymbolColor;readonly x:number;readonly y:number}
export interface Scene {readonly version:1;readonly seed:number;readonly symbols:readonly SceneSymbol[]}
export function createScene(seed?:number,count?:number):Scene;
export function addSymbol(scene:Scene,input:{kind:SymbolKind;color:SymbolColor;x:number;y:number}):Scene;
export function removeLastSymbol(scene:Scene):Scene;
export function symbolColor(color:SymbolColor):string;
export function describeScene(scene:Scene):{readonly summary:string;readonly items:readonly string[]};
export function snapshotScene(scene:Scene):string;
