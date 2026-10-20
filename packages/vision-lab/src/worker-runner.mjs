export const VISION_WORKER_MAX_BUDGET_MS=2000;

const abortError=message=>{const error=new Error(message);error.name='AbortError';return error};

export function createVisionWorkerController(createWorker){
 if(typeof createWorker!=='function')throw new TypeError('createWorker must be a function');
 let active=null,nextRequestId=1;
 const finish=(record,settle,value)=>{if(active!==record)return false;active=null;clearTimeout(record.timer);record.worker.terminate();settle(value);return true};
 const cancel=(reason='Vision work cancelled')=>{if(!active)return false;const record=active;return finish(record,record.reject,abortError(reason))};
 const run=(task,{budgetMs=750}={})=>{
  if(!task||typeof task!=='object')return Promise.reject(new TypeError('Vision task must be an object'));
  if(!Number.isInteger(budgetMs)||budgetMs<1||budgetMs>VISION_WORKER_MAX_BUDGET_MS)return Promise.reject(new RangeError(`Worker budget must be from 1 to ${VISION_WORKER_MAX_BUDGET_MS} milliseconds`));
  cancel('Vision work superseded');
  const worker=createWorker();
  if(!worker||typeof worker.postMessage!=='function'||typeof worker.terminate!=='function')return Promise.reject(new TypeError('createWorker returned an invalid worker'));
  const requestId=nextRequestId++;
  return new Promise((resolve,reject)=>{
   const record={worker,reject,timer:null,requestId};
   active=record;
   worker.onmessage=event=>{const message=event?.data;if(active!==record||!message||message.requestId!==requestId)return;if(message.ok===true)finish(record,resolve,message.result);else finish(record,reject,new Error(typeof message.error==='string'?message.error:'Vision worker failed'))};
   worker.onerror=()=>finish(record,reject,new Error('Vision worker failed'));
   record.timer=setTimeout(()=>finish(record,reject,new Error(`Vision worker exceeded ${budgetMs} ms budget`)),budgetMs);
   try{worker.postMessage({requestId,budgetMs,task})}catch(error){finish(record,reject,error instanceof Error?error:new Error('Vision worker dispatch failed'))}
  });
 };
 return Object.freeze({run,cancel,get active(){return active!==null}});
}
