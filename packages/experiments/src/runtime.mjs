import {validateExperimentDefinition,validateObservation} from '@learning-machine/contracts';

const deepFreeze=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))deepFreeze(x);Object.freeze(v)}return v};
function normalize(v,depth=0,stack=new WeakSet()){
 if(depth>32)throw new TypeError('Experiment input too deeply nested');
 if(v===null||typeof v==='string'||typeof v==='boolean')return v;
 if(typeof v==='number'){if(!Number.isFinite(v))throw new TypeError('Nonfinite input');return v;}
 if(!v||typeof v!=='object')throw new TypeError('Experiment input must contain JSON values only');
 if(stack.has(v))throw new TypeError('Cyclic experiment input');
 stack.add(v);
 let out;
 if(Array.isArray(v)){if(v.length>10000)throw new TypeError('Oversized input array');out=v.map(x=>normalize(x,depth+1,stack))}
 else {
   if(Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)throw new TypeError('Nonplain experiment input');
   const keys=Object.keys(v).sort();if(keys.length>10000)throw new TypeError('Too many experiment properties');
   out=Object.create(null);
   for(const k of keys) {if(k==='__proto__'||k==='constructor'||k==='prototype')throw new TypeError('Unsafe property name');out[k]=normalize(v[k],depth+1,stack)}
 }
 stack.delete(v);
 return out;
}
export function canonicalExperimentInput(value){
 const normalized=normalize(value);const str=JSON.stringify(normalized);
 if(str===undefined||str.length>250000)throw new TypeError('Experiment input too large');
 return str;
}
async function sha256(value){
 const subtle=globalThis.crypto?.subtle;
 if(!subtle)throw new Error('Secure WebCrypto SHA-256 unavailable');
 const digest=await subtle.digest('SHA-256',new TextEncoder().encode(value));
 return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
}
export function seededRandom(seed,namespace='default'){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw new RangeError('Seed must be uint32');
 if(typeof namespace!=='string'||namespace.length>256)throw new TypeError('Invalid random namespace');
 let h=2166136261;for(const code of namespace){h^=code.codePointAt(0);h=Math.imul(h,16777619)}
 let state=(seed^h)>>>0;if(state===0)state=0x9e3779b9;
 return ()=>{state^=state<<13;state^=state>>>17;state^=state<<5;state>>>=0;return state/0x100000000};
}
export async function createExperimentRun(definition,input,{seed=1,engineVersion='1.0.0'}={}){
 const d=validateExperimentDefinition(definition);
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw new RangeError('Seed must be uint32');
 if(typeof engineVersion!=='string'||!engineVersion.trim())throw new TypeError('Engine version required');
 const canonicalInput=canonicalExperimentInput(input);
 const id=await sha256(JSON.stringify({id:d.id,version:d.version,engineVersion,seed,input:canonicalInput}));
 return deepFreeze({runId:id,experimentId:d.id,experimentVersion:d.version,engineVersion,seed,input:JSON.parse(canonicalInput),status:'running',observations:[],sealDigest:null});
}
export function appendExperimentObservation(run,raw){
 if(run?.status!=='running')throw new TypeError('Run not active');
 const observation=validateObservation(raw);
 if(observation.runId!==run.runId||observation.experimentId!==run.experimentId)throw new TypeError('Observation refers to another experiment run');
 if(run.observations.length>=10000)throw new RangeError('Observation limit reached');
 return deepFreeze({...run,observations:[...run.observations,observation]});
}
export async function sealExperimentRun(run,status='completed'){
 if(run?.status!=='running')throw new TypeError('Cannot seal inactive run');
 if(!['completed','cancelled','failed'].includes(status))throw new TypeError('Invalid final status');
 const data={...run,status,sealDigest:null};
 const sealDigest=await sha256(canonicalExperimentInput(data));
 return deepFreeze({...data,sealDigest});
}
export function compareExperimentRuns(a,b){
 for(const key of ['experimentId','experimentVersion','engineVersion','seed'])
   if(a?.[key]!==b?.[key])return {comparable:false,sameResults:null,reason:'Run configuration differs: '+key};
 if(canonicalExperimentInput(a.input)!==canonicalExperimentInput(b.input))return {comparable:false,sameResults:null,reason:'Input differs'};
 const resultA=canonicalExperimentInput(a.observations),resultB=canonicalExperimentInput(b.observations);
 return {comparable:true,sameResults:resultA===resultB,reason:resultA===resultB?'Recorded results match':'Recorded results differ'};
}
