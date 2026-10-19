import {createHash} from 'node:crypto';
import {validateLearningModule} from '@learning-machine/contracts';
const isTerminal=n=>n.stage==='complete'||n.terminal===true;
function stableJson(v) {
 if(Array.isArray(v))return '['+v.map(stableJson).join(',')+']';
 if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stableJson(v[k])).join(',')+'}';
 return JSON.stringify(v);
}
export class LessonCompileError extends Error {
 constructor(message){super(message);this.name='LessonCompileError'}
}
export function compileLearningModule(raw) {
 const lesson=validateLearningModule(raw);
 const nodes=new Map(lesson.nodes.map(n=>[n.id,n]));
 if(nodes.get(lesson.startNodeId).stage!=='encounter')throw new LessonCompileError('Lesson must begin with encounter');
 const reverse=new Map(lesson.nodes.map(n=>[n.id,[]]));
 const terminals=[];
 for(const node of lesson.nodes){
   if(isTerminal(node)) {
     if(node.edges.length)throw new LessonCompileError('Terminal node has outgoing edges: '+node.id);
     terminals.push(node.id);
   } else if(node.edges.length===0)throw new LessonCompileError('Nonterminal dead end: '+node.id);
   if(node.stage==='experiment'&&!(node.accessibleAlternative||'').trim())throw new LessonCompileError('Experiment lacks accessible alternative: '+node.id);
   for(const concept of node.concepts||[])if(!lesson.concepts.includes(concept))throw new LessonCompileError('Undeclared concept '+concept);
   const seenEdges=new Set();
   for(const edge of node.edges){
     if(!nodes.has(edge.to))throw new LessonCompileError('Unknown destination '+edge.to);
     const key=edge.to+'|'+(edge.when||'always');
     if(seenEdges.has(key))throw new LessonCompileError('Duplicate edge from '+node.id+' to '+edge.to);
     seenEdges.add(key);
     reverse.get(edge.to).push(node.id);
   }
 }
 if(!terminals.length)throw new LessonCompileError('No terminal node');
 const reachable=new Set([lesson.startNodeId]),queue=[lesson.startNodeId];
 while(queue.length){const id=queue.shift();for(const e of nodes.get(id).edges)if(!reachable.has(e.to)){reachable.add(e.to);queue.push(e.to)}}
 if(reachable.size!==lesson.nodes.length)throw new LessonCompileError('Unreachable nodes: '+lesson.nodes.filter(n=>!reachable.has(n.id)).map(n=>n.id).join(', '));
 const canFinish=new Set(terminals), backwards=[...terminals];
 while(backwards.length){const id=backwards.shift();for(const predecessor of reverse.get(id))if(!canFinish.has(predecessor)){canFinish.add(predecessor);backwards.push(predecessor)}}
 const trapped=lesson.nodes.filter(n=>!canFinish.has(n.id)).map(n=>n.id);
 if(trapped.length)throw new LessonCompileError('Trapped cycle without exit: '+trapped.join(', '));
 const covered=new Set(lesson.nodes.flatMap(n=>n.concepts||[]));
 for(const concept of lesson.concepts)if(!covered.has(concept))throw new LessonCompileError('Required concept never taught: '+concept);
 const digest=createHash('sha256').update(stableJson(lesson)).digest('hex');
 const compiled={schemaVersion:lesson.schemaVersion,lessonId:lesson.id,digest,startNodeId:lesson.startNodeId,concepts:[...lesson.concepts],terminalNodeIds:terminals,nodes:lesson.nodes.map(n=>({...n,edges:n.edges.map(e=>({...e,when:e.when||'always'}))}))};
 Object.freeze(compiled.nodes);Object.freeze(compiled.concepts);Object.freeze(compiled.terminalNodeIds);
 return Object.freeze(compiled);
}
export function nextCandidates(compiled,nodeId){
 const node=compiled.nodes.find(n=>n.id===nodeId);
 if(!node)throw new LessonCompileError('Unknown node '+nodeId);
 return node.edges.map(e=>({to:e.to,when:e.when}));
}
