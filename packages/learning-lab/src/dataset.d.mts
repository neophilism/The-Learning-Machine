export const GRID_SIZE:16;
export const PIXEL_COUNT:256;
export const MAX_EXAMPLES:64;
export type DrawingPixels=readonly (0|1)[];
export interface ShapeExample {readonly id:string;readonly label:string;readonly pixels:DrawingPixels}
export interface ShapeDataset {readonly nextId:number;readonly examples:readonly ShapeExample[]}
export function blankDrawing():DrawingPixels;
export function setDrawingCell(pixels:DrawingPixels,row:number,col:number,filled?:boolean):DrawingPixels;
export function presetDrawing(kind:'diagonal'|'square'|'cross'|'horizontal'):DrawingPixels;
export function createShapeDataset():ShapeDataset;
export function addShapeExample(state:ShapeDataset,label:string,pixels:DrawingPixels):ShapeDataset;
export function removeShapeExample(state:ShapeDataset,id:string):ShapeDataset;
export function relabelShapeExample(state:ShapeDataset,id:string,newLabel:string):ShapeDataset;
export function shapeCounts(state:ShapeDataset):readonly {readonly label:string;readonly count:number}[];
