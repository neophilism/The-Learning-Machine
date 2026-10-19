import {validateObservation} from '@learning-machine/contracts';
const freeze=v=>{if(v&&typeof v==='object'){for(const child of Object.values(v))freeze(child);Object.freeze(v)}return v};
const clone=v=>structuredClone(v);
function node(compiled,id){const result=compiled.nodes.find(n=>n.id===id);if(!result)throw new Error('Unknown learning node: '+id);return result}
function validModule(compiled){
 if(!compiled||typeof compiled.lessonId!=='string'||!Array.isArray(compiled.nodes)||!compiled.digest||!compiled.startNodeId)throw new TypeError('Expected compiled learning module');
}
function ensureSession(compiled,session){validModule(compiled);if(!session||session.lessonId!==compiled.lessonId||session.releaseDigest!==compiled.digest)throw new TypeError('Session refers to another lesson release');node(compiled,session.nodeId);}
export function createLearningSession(compiled,sessionId='anonymous'){
 validModule(compiled);
 if(typeof sessionId!=='string'||!sessionId.trim()||sessionId.length>256)throw new TypeError('Invalid session ID');
 const start=node(compiled,compiled.startNodeId);
 return freeze({sessionId,lessonId:compiled.lessonId,releaseDigest:compiled.digest,nodeId:start.id,stage:start.stage,answers:{},observations:[],skipped:[],history:[],actions:[],complete:start.stage==='complete'});
}
function commit(s,action,update){
 const next=clone(s);next.actions.push(clone(action));Object.assign(next,update);return freeze(next);
}
function navigate(s,compiled,target,action){
 const n=node(compiled,target);
 return commit(s,action,{nodeId:n.id,stage:n.stage,history:[...s.history,s.nodeId],complete:n.stage==='complete'||n.terminal===true});
}
function edgeAllowed(edge,type){return edge.when==='always'&&type==='NEXT'||edge.when==='alternative'&&type==='CHOOSE'||edge.when==='retry'&&type==='RETRY'||edge.when==='on_request'&&type==='REQUEST_EXPLANATION';}
export function availableRoutes(compiled,s){
 ensureSession(compiled,s);return node(compiled,s.nodeId).edges.map(e=>({to:e.to,when:e.when,available:['always','alternative','retry','on_request'].includes(e.when)}));
}
export function transitionLearningSession(compiled,s,action){
 ensureSession(compiled,s);
 if(!action||typeof action!=='object'||typeof action.type!=='string')throw new TypeError('Invalid learner action');
 if(s.actions.length>=2000&&action.type!=='RESET')throw new RangeError('Session action budget exceeded');
 switch(action.type){
  case 'RESET':return createLearningSession(compiled,s.sessionId);
  case 'ANSWER': {
    if(typeof action.text!=='string'||!action.text.trim()||action.text.length>10000)throw new TypeError('An answer must be a bounded nonempty string');
    const answers={...s.answers,[s.nodeId]:action.text.trim()};
    return commit(s,action,{answers});
  }
  case 'SKIP': {
    if(s.complete)throw new RangeError('Cannot skip a completed experience');
    return commit(s,action,{skipped:[...s.skipped,s.nodeId]});
  }
  case 'OBSERVE':{
    if(!['experiment','observation'].includes(s.stage))throw new RangeError('Observations require an experimental or observation stage');
    const observation=validateObservation(action.observation);
    return commit(s,action,{observations:[...s.observations,observation]});
  }
  case 'BACK':{
    if(s.history.length===0)return s;
    const previous=s.history[s.history.length-1],n=node(compiled,previous);
    return commit(s,action,{nodeId:n.id,stage:n.stage,complete:false,history:s.history.slice(0,-1)});
  }
  case 'REQUEST_EXPLANATION': {
    const direct=node(compiled,s.nodeId).edges.find(e=>e.when==='on_request');
    if(direct)return navigate(s,compiled,direct.to,action);
    const reflection=compiled.nodes.find(n=>n.stage==='reflection');
    if(!reflection)throw new RangeError('This lesson does not provide an authored direct explanation');
    return navigate(s,compiled,reflection.id,action);
  }
  case 'NEXT':case 'CHOOSE':case 'RETRY':{
    if(s.complete)throw new RangeError('Experience is already complete');
    const candidates=node(compiled,s.nodeId).edges.filter(e=>edgeAllowed(e,action.type));
    const edge=action.to!==undefined?candidates.find(e=>e.to===action.to):candidates.length===1?candidates[0]:undefined;
    if(!edge)throw new RangeError('No permitted unambiguous route for '+action.type);
    return navigate(s,compiled,edge.to,action);
  }
  default:throw new RangeError('Unknown learner action '+action.type);
 }
}
export function replayLearningActions(compiled,actions,sessionId='anonymous'){
 if(!Array.isArray(actions)||actions.length>2000)throw new TypeError('Invalid replay actions');
 let state=createLearningSession(compiled,sessionId);
 for(const action of actions)state=transitionLearningSession(compiled,state,action);
 return state;
}
