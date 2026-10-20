import type {ShapeDataset} from './dataset.mjs';
export interface HoldoutSplit {readonly algorithm:string;readonly seed:number;readonly testFraction:number;readonly trainIds:readonly string[];readonly testIds:readonly string[];
 readonly classes:readonly {readonly label:string;readonly total:number;readonly train:number;readonly test:number}[];readonly warnings:readonly string[];readonly ready:boolean;readonly source:string}
export function stratifiedHoldout(dataset:ShapeDataset,options?:{seed?:number;testFraction?:number}):HoldoutSplit;
export function validateHoldout(split:HoldoutSplit,dataset:ShapeDataset):boolean;
