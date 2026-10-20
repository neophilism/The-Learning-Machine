import test from 'node:test';
import assert from 'node:assert/strict';
import {createVisionWorkerController} from '../src/worker-runner.mjs';

class FakeWorker{
 constructor(){this.onmessage=null;this.onerror=null;this.messages=[];this.terminated=false}
 postMessage(message){this.messages.push(message)}
 terminate(){this.terminated=true}
 reply(data){this.onmessage?.({data})}
 fail(){this.onerror?.(new Error('private worker detail'))}
}

test('new work terminates old work and ignores its stale result',async()=>{
 const workers=[],controller=createVisionWorkerController(()=>{const worker=new FakeWorker();workers.push(worker);return worker});
 const first=controller.run({kind:'pixels'}),firstRejected=assert.rejects(first,error=>error.name==='AbortError'&&/superseded/.test(error.message));
 const second=controller.run({kind:'recognition'});
 await firstRejected;
 assert.equal(workers[0].terminated,true);
 workers[0].reply({requestId:1,ok:true,result:'stale'});
 workers[1].reply({requestId:2,ok:true,result:'current'});
 assert.equal(await second,'current');
 assert.equal(controller.active,false);
});

test('reset cancellation prevents a late frame from resolving',async()=>{
 const worker=new FakeWorker(),controller=createVisionWorkerController(()=>worker);
 const pending=controller.run({kind:'pixels'}),rejected=assert.rejects(pending,error=>error.name==='AbortError'&&/reset/.test(error.message));
 assert.equal(controller.cancel('Vision reset'),true);
 worker.reply({requestId:1,ok:true,result:{finalDigest:'stale'}});
 await rejected;
 assert.equal(worker.terminated,true);
 assert.equal(controller.cancel(),false);
});

test('time budgets terminate unresponsive work',async()=>{
 const worker=new FakeWorker(),controller=createVisionWorkerController(()=>worker);
 await assert.rejects(controller.run({kind:'pixels'},{budgetMs:5}),/exceeded 5 ms budget/);
 assert.equal(worker.terminated,true);
 assert.equal(controller.active,false);
});

test('invalid budgets and worker failures fail closed without leaking event detail',async()=>{
 const worker=new FakeWorker(),controller=createVisionWorkerController(()=>worker);
 await assert.rejects(controller.run({kind:'pixels'},{budgetMs:0}),/budget/);
 const pending=controller.run({kind:'pixels'});worker.fail();await assert.rejects(pending,/Vision worker failed/);
});
