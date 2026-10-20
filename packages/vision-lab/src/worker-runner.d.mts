export const VISION_WORKER_MAX_BUDGET_MS:2000;
export interface WorkerLike {onmessage:((event:{data:unknown})=>void)|null;onerror:((event:unknown)=>void)|null;postMessage(message:unknown):void;terminate():void}
export interface VisionWorkerController {run<T>(task:object,options?:{budgetMs?:number}):Promise<T>;cancel(reason?:string):boolean;readonly active:boolean}
export function createVisionWorkerController(createWorker:()=>WorkerLike):VisionWorkerController;
