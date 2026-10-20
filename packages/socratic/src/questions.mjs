// Socratic questions are selected from versioned authored content, never fabricated by the evaluator.
export function selectSocraticQuestion(compiled,session){
 if(!compiled||!session||compiled.lessonId!==session.lessonId||compiled.digest!==session.releaseDigest)throw new TypeError('Question session must match a compiled release');
 const node=compiled.nodes.find(n=>n.id===session.nodeId);
 if(!node)throw new RangeError('Unknown active question node');
 const hypotheses=Array.isArray(session.hypotheses)?session.hypotheses:[];
 const predictions=Array.isArray(session.predictions)?session.predictions:[];
 const observations=Array.isArray(session.observations)?session.observations:[];
 const conditions={
  multiple_hypotheses:()=>hypotheses.length>=2,
  has_hypothesis:()=>hypotheses.length>0,
  has_prediction:()=>predictions.length>0,
  computed_observation:()=>observations.some(o=>o.kind==='computed'),
  has_observation:()=>observations.length>0,
  no_observation:()=>observations.length===0,
  always:()=>true
 };
 const match=(node.questionVariants||[]).find(v=>Object.hasOwn(conditions,v.when)&&conditions[v.when]());
 return Object.freeze({id:match?.id??node.id+':default',text:match?.prompt??node.prompt,nodeId:node.id,source:'authored-lesson',matchedCondition:match?.when??'default'});
}
