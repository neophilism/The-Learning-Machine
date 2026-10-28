// Dependency-free runtime contract guards used by browser and server packages.
export const SCHEMA_VERSION='1.0.0';
export const STAGES=Object.freeze(['encounter','hypothesis','prediction','experiment','observation','explanation','challenge','revision','transfer','reflection','complete']);
export const OBSERVATION_KINDS=Object.freeze(['measured','computed','simulated','unknown']);
const plain=v=>typeof v==='object'&&v!==null&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
function object(v,label){if(!plain(v))throw new TypeError(label+' must be a plain object');}
function keys(v,valid,label){for(const k of Object.keys(v))if(!valid.includes(k))throw new TypeError(label+' has unexpected property '+k);}
function str(v,label,max=12000){if(typeof v!=='string'||!v.trim()||v.length>max)throw new TypeError(label+' must be a nonempty bounded string');}
function list(v,label,min=0,max=10000){if(!Array.isArray(v)||v.length<min||v.length>max)throw new TypeError(label+' must be a bounded array');}
function strings(v,label){list(v,label);for(const s of v)str(s,label+' entry');}
function version(v){if(v.schemaVersion!==SCHEMA_VERSION)throw new TypeError('Unsupported schemaVersion');}
function duplicateIds(v,label){const ids=v.map(x=>x.id);if(new Set(ids).size!==ids.length)throw new TypeError('Duplicate '+label);}
function frozenClone(v){const c=structuredClone(v);const recur=(o)=>{if(o&&typeof o==='object'){for(const x of Object.values(o))recur(x);Object.freeze(o)}};recur(c);return c;}
export function validateLearningModule(v){
 object(v,'module');version(v);keys(v,['schemaVersion','id','title','startNodeId','nodes','concepts'],'module');
 str(v.id,'id',128);str(v.title,'title');str(v.startNodeId,'startNodeId');strings(v.concepts,'concepts');list(v.nodes,'nodes',1,500);
 for(const n of v.nodes){
   object(n,'node');keys(n,['id','stage','prompt','edges','concepts','accessibleAlternative','terminal','questionVariants','hints','counterexamples'],'node');
   str(n.id,'node.id',128);if(!STAGES.includes(n.stage))throw new TypeError('Invalid node stage');
   str(n.prompt,'node.prompt');list(n.edges,'node.edges',0,30);
   if(n.concepts!==undefined)strings(n.concepts,'node concepts');
   if(n.accessibleAlternative!==undefined&&typeof n.accessibleAlternative!=='string')throw new TypeError('Invalid accessible alternative');
   if(n.terminal!==undefined&&typeof n.terminal!=='boolean')throw new TypeError('Invalid terminal');
   if(n.hints!==undefined){list(n.hints,'node hints',0,4);for(const hint of n.hints)str(hint,'authored hint',1500);}
   if(n.counterexamples!==undefined){
     if(n.stage!=='challenge')throw new TypeError('Counterexamples require a challenge node');
     list(n.counterexamples,'counterexamples',2,12);
     const ids=new Set();let fallbacks=0;
     for(const example of n.counterexamples){
       object(example,'counterexample');keys(example,['id','prompt','triggerTerms','competingApproach'],'counterexample');
       str(example.id,'counterexample id',128);str(example.prompt,'counterexample prompt',2000);str(example.competingApproach,'competing approach',2000);
       list(example.triggerTerms,'counterexample trigger terms',0,12);
       const terms=new Set();
       for(const term of example.triggerTerms){
         if(typeof term!=='string'||!/^[a-z0-9-]{2,40}$/.test(term))throw new TypeError('Invalid counterexample trigger term');
         if(terms.has(term))throw new TypeError('Duplicate counterexample trigger term');terms.add(term);
       }
       if(example.triggerTerms.length===0)fallbacks++;
       if(ids.has(example.id))throw new TypeError('Duplicate counterexample id');ids.add(example.id);
     }
     if(fallbacks!==1)throw new TypeError('Exactly one neutral counterexample fallback is required');
   }

   if(n.questionVariants!==undefined){
     list(n.questionVariants,'questionVariants',0,12);
     const ids=new Set();
     for(const v of n.questionVariants){
       object(v,'question variant');keys(v,['id','when','prompt'],'question variant');
       str(v.id,'question variant id',128);str(v.prompt,'question variant prompt',12000);
       if(!['multiple_hypotheses','has_hypothesis','has_prediction','computed_observation','has_observation','no_observation','always'].includes(v.when))throw new TypeError('Unsupported question condition');
       if(ids.has(v.id))throw new TypeError('Duplicate question variant id');ids.add(v.id);
     }
   }
   for(const e of n.edges){object(e,'edge');keys(e,['to','when'],'edge');str(e.to,'edge.to',128);if(e.when!==undefined&&!['always','correct','retry','alternative','on_request'].includes(e.when))throw new TypeError('Invalid edge condition');}
 }
 duplicateIds(v.nodes,'node IDs');
 if(!v.nodes.some(n=>n.id===v.startNodeId))throw new TypeError('Start node not found');
 return frozenClone(v);
}
export function validateObservation(v){
 object(v,'observation');version(v);keys(v,['schemaVersion','experimentId','runId','kind','description','value','unit','sourceId','uncertainty'],'observation');
 for(const k of ['experimentId','runId','description'])str(v[k],k);
 if(!OBSERVATION_KINDS.includes(v.kind))throw new TypeError('Invalid observation kind');
 if(v.value!==undefined&&(typeof v.value==='number'&&!Number.isFinite(v.value)||typeof v.value!=='number'&&typeof v.value!=='string'&&typeof v.value!=='boolean'&&v.value!==null))throw new TypeError('Invalid value');
 for(const k of ['unit','sourceId','uncertainty'])if(v[k]!==undefined)str(v[k],k);
 if(v.kind==='measured'&&!v.sourceId)throw new TypeError('Measured data needs a sourceId');
 return frozenClone(v);
}
export function validateExperimentDefinition(v){
 object(v,'experiment');version(v);keys(v,['schemaVersion','id','version','title','capabilities','timeoutMs'],'experiment');
 for(const k of ['id','version','title'])str(v[k],k);
 list(v.capabilities,'capabilities');for(const c of v.capabilities)if(!['canvas','audio','camera','ml','worker','keyboard'].includes(c))throw new TypeError('Unsupported capability');
 if(!Number.isInteger(v.timeoutMs)||v.timeoutMs<1||v.timeoutMs>120000)throw new TypeError('Invalid timeoutMs');
 return frozenClone(v);
}
export function validateLegalScenario(v){
 object(v,'legal scenario');version(v);keys(v,['schemaVersion','id','status','jurisdiction','evaluationDate','facts','sourceIds'],'legal scenario');
 str(v.id,'id',128);if(!['current','proposed','hypothetical'].includes(v.status))throw new TypeError('Invalid legal status');
 if(v.jurisdiction!=='US-federal')throw new TypeError('Unsupported legal jurisdiction');
 if(typeof v.evaluationDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v.evaluationDate))throw new TypeError('Invalid legal evaluation date');\n const [year,month,day]=v.evaluationDate.split('-').map(Number);const evaluated=new Date(Date.UTC(year,month-1,day));\n if(evaluated.getUTCFullYear()!==year||evaluated.getUTCMonth()!==month-1||evaluated.getUTCDate()!==day)throw new TypeError('Invalid legal evaluation date');
 strings(v.sourceIds,'sourceIds');if(v.status!=='hypothetical'&&!v.sourceIds.length)throw new TypeError('Sourced legal scenario required');
 const f=v.facts;object(f,'facts');keys(f,['actors','works','access','copying','retention','teaching','outputs','declaredUnknowns'],'facts');
 list(f.actors,'actors',1,32);const actorIds=new Set();
 for(const a of f.actors){object(a,'actor');keys(a,['id','role'],'actor');str(a.id,'actor.id',128);if(!['learner','creator','rights-holder','platform','institution','other'].includes(a.role))throw new TypeError('Invalid actor role');if(actorIds.has(a.id))throw new TypeError('Duplicate actor ID');actorIds.add(a.id);}
 list(f.works,'works',1,64);const workIds=new Set();
 for(const w of f.works){object(w,'work');keys(w,['id','kind','copyrightStatus','rightsHolderActorId'],'work');str(w.id,'work.id',128);if(!['text','image','audio','video','software','dataset','other'].includes(w.kind))throw new TypeError('Invalid work kind');if(!['protected','public-domain','licensed','unknown'].includes(w.copyrightStatus))throw new TypeError('Invalid copyright status');if(w.rightsHolderActorId!==null){str(w.rightsHolderActorId,'rightsHolderActorId',128);if(!actorIds.has(w.rightsHolderActorId))throw new TypeError('Unknown rights-holder actor');}if(workIds.has(w.id))throw new TypeError('Duplicate work ID');workIds.add(w.id);}
 object(f.access,'access');keys(f.access,['method','lawful','sourceActorId'],'access');if(!['purchase','license','borrow','stream','public-source','unauthorized','unknown'].includes(f.access.method))throw new TypeError('Invalid access method');if(f.access.lawful!==null&&typeof f.access.lawful!=='boolean')throw new TypeError('Invalid lawful-access fact');if(f.access.sourceActorId!==null){str(f.access.sourceActorId,'sourceActorId',128);if(!actorIds.has(f.access.sourceActorId))throw new TypeError('Unknown access source actor');}
 object(f.copying,'copying');keys(f.copying,['performed','inputWorkIds','intermediateCopies'],'copying');if(f.copying.performed!==null&&typeof f.copying.performed!=='boolean')throw new TypeError('Invalid copying fact');if(f.copying.intermediateCopies!==null&&typeof f.copying.intermediateCopies!=='boolean')throw new TypeError('Invalid intermediate-copy fact');strings(f.copying.inputWorkIds,'inputWorkIds');if(new Set(f.copying.inputWorkIds).size!==f.copying.inputWorkIds.length||f.copying.inputWorkIds.some(id=>!workIds.has(id)))throw new TypeError('Copying references unknown or duplicate work');if(f.copying.performed===true&&!f.copying.inputWorkIds.length)throw new TypeError('Copying requires an input work');if(f.copying.performed===false&&f.copying.inputWorkIds.length)throw new TypeError('No-copy scenario cannot name copied works');
 object(f.retention,'retention');keys(f.retention,['retained','durationDays'],'retention');if(f.retention.retained!==null&&typeof f.retention.retained!=='boolean')throw new TypeError('Invalid retention fact');if(f.retention.durationDays!==null&&(!Number.isInteger(f.retention.durationDays)||f.retention.durationDays<0||f.retention.durationDays>36500))throw new TypeError('Invalid retention duration');if(f.retention.retained===false&&f.retention.durationDays!==0)throw new TypeError('No retention requires zero duration');if(f.retention.retained===true&&(f.retention.durationDays===null||f.retention.durationDays<1))throw new TypeError('Retention requires a positive duration');
 object(f.teaching,'teaching');keys(f.teaching,['performed','learnerActorIds'],'teaching');if(f.teaching.performed!==null&&typeof f.teaching.performed!=='boolean')throw new TypeError('Invalid teaching fact');strings(f.teaching.learnerActorIds,'learnerActorIds');if(new Set(f.teaching.learnerActorIds).size!==f.teaching.learnerActorIds.length||f.teaching.learnerActorIds.some(id=>!actorIds.has(id)))throw new TypeError('Teaching references unknown or duplicate actor');if(f.teaching.performed===true&&!f.teaching.learnerActorIds.length)throw new TypeError('Teaching requires a learner actor');if(f.teaching.performed===false&&f.teaching.learnerActorIds.length)throw new TypeError('No-teaching scenario cannot name learners');
 object(f.outputs,'outputs');keys(f.outputs,['created','distributed','containsProtectedExpression'],'outputs');for(const k of ['created','distributed','containsProtectedExpression'])if(f.outputs[k]!==null&&typeof f.outputs[k]!=='boolean')throw new TypeError('Invalid output fact');if(f.outputs.distributed===true&&f.outputs.created!==true)throw new TypeError('Distributed output must be created');
 strings(f.declaredUnknowns,'declaredUnknowns');if(new Set(f.declaredUnknowns).size!==f.declaredUnknowns.length)throw new TypeError('Duplicate declared unknown');
 const unknowns=[];const nullable=[['access.lawful',f.access.lawful],['access.sourceActorId',f.access.sourceActorId],['copying.performed',f.copying.performed],['copying.intermediateCopies',f.copying.intermediateCopies],['retention.retained',f.retention.retained],['retention.durationDays',f.retention.durationDays],['teaching.performed',f.teaching.performed],['outputs.created',f.outputs.created],['outputs.distributed',f.outputs.distributed],['outputs.containsProtectedExpression',f.outputs.containsProtectedExpression]];
 for(const [path,value] of nullable)if(value===null)unknowns.push(path);if(f.access.method==='unknown')unknowns.push('access.method');for(const w of f.works){if(w.copyrightStatus==='unknown')unknowns.push('works.'+w.id+'.copyrightStatus');if(w.rightsHolderActorId===null)unknowns.push('works.'+w.id+'.rightsHolderActorId');}
 if(unknowns.length!==f.declaredUnknowns.length||unknowns.some(path=>!f.declaredUnknowns.includes(path)))throw new TypeError('Declared unknowns must exactly match missing material facts');
 return frozenClone(v);
}
export function validatePolicyRule(v){
 object(v,'policy rule');version(v);keys(v,['schemaVersion','id','source','conditions','effect','sourceIds'],'policy rule');
 str(v.id,'id');if(!['current','proposed','learner'].includes(v.source))throw new TypeError('Invalid policy source');
 if(!['permit','restrict','conditional','unresolved'].includes(v.effect))throw new TypeError('Invalid policy effect');
 list(v.conditions,'conditions',0,32);
 for(const condition of v.conditions){object(condition,'condition');keys(condition,['field','operator','value'],'condition');str(condition.field,'condition.field');if(!['eq','neq','exists','in'].includes(condition.operator))throw new TypeError('Unsupported policy operator');if(!('value' in condition)&&condition.operator!=='exists')throw new TypeError('Condition value required');}
 strings(v.sourceIds,'sourceIds');
 if(v.source!=='learner'&&!v.sourceIds.length)throw new TypeError('Published rule needs cited sources');
 return frozenClone(v);
}
export function validateContentRelease(v){
 object(v,'release');version(v);keys(v,['schemaVersion','id','digest','modules','publishedAt'],'release');str(v.id,'id');
 if(typeof v.digest!=='string'||!/^[a-f0-9]{64}$/.test(v.digest))throw new TypeError('Invalid release digest');
 strings(v.modules,'modules');str(v.publishedAt,'publishedAt');if(Number.isNaN(Date.parse(v.publishedAt)))throw new TypeError('Invalid publishedAt');
 return frozenClone(v);
}
export const validators=Object.freeze({learningModule:validateLearningModule,observation:validateObservation,experiment:validateExperimentDefinition,legalScenario:validateLegalScenario,policyRule:validatePolicyRule,release:validateContentRelease});
export function validateContract(kind,value){if(!Object.hasOwn(validators,kind))throw new TypeError('Unknown contract: '+kind);return validators[kind](value);}
