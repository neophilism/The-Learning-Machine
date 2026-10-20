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

const words=value=>new Set(String(value).toLocaleLowerCase().match(/[a-z0-9-]+/g)??[]);
export function selectCounterexample(compiled,session,hypothesisId){
 if(!compiled||!session||compiled.lessonId!==session.lessonId||compiled.digest!==session.releaseDigest)throw new TypeError('Counterexample session must match a compiled release');
 const node=compiled.nodes.find(n=>n.id===session.nodeId);
 if(!node||node.stage!=='challenge')throw new RangeError('Counterexamples are selected only at an authored challenge node');
 const counterexamples=node.counterexamples||[];
 if(counterexamples.length<2)throw new RangeError('Challenge node has no reviewed counterexample set');
 const hypotheses=Array.isArray(session.hypotheses)?session.hypotheses:[];
 const hypothesis=hypothesisId===undefined?hypotheses.at(-1):hypotheses.find(h=>h.id===hypothesisId);
 if(!hypothesis)throw new RangeError('A known learner hypothesis is required for a counterexample');
 const tokens=words(hypothesis.text);
 const ranked=counterexamples.map((example,index)=>({example,index,matchedTerms:example.triggerTerms.filter(term=>tokens.has(term))}))
  .filter(candidate=>candidate.matchedTerms.length)
  .sort((a,b)=>b.matchedTerms.length-a.matchedTerms.length||a.index-b.index);
 const fallback=counterexamples.find(example=>example.triggerTerms.length===0);
 const chosen=ranked[0]??(fallback?{example:fallback,matchedTerms:[]}:null);
 if(!chosen)throw new RangeError('Challenge node requires a neutral fallback counterexample');
 return Object.freeze({id:chosen.example.id,prompt:chosen.example.prompt,competingApproach:chosen.example.competingApproach,
  hypothesisId:hypothesis.id,matchedTerms:Object.freeze([...chosen.matchedTerms]),source:'authored-lesson'});
}
