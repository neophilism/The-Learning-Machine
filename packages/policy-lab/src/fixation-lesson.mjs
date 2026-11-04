const PROFILES=new Set(["cablevision-buffer","mai-maintenance-ram","unclassified"]);
const requiredAuthorities=["usc17-101","cablevision","mai-peak"];
const assert=(condition,message)=>{if(!condition)throw new TypeError(message);};
const plain=value=>value!==null&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
const date=value=>{
 if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const [y,m,d]=value.split("-").map(Number),parsed=new Date(Date.UTC(y,m-1,d));
 return parsed.getUTCFullYear()===y&&parsed.getUTCMonth()===m-1&&parsed.getUTCDate()===d;
};
const deepFreeze=value=>{if(value&&typeof value==="object"){for(const child of Object.values(value))deepFreeze(child);Object.freeze(value);}return value;};
const sourceView=authority=>({id:authority.id,citation:authority.citation,issuedOn:authority.issuedOn,sourceUrl:authority.sourceUrl,scopeLimitations:authority.scopeLimitations});

function sources(catalog,evaluationDate){
 assert(plain(catalog)&&catalog.jurisdiction==="United States","A United States authority catalog is required");
 assert(Array.isArray(catalog.authorities),"Authority catalog is invalid");
 const index=new Map(catalog.authorities.map(authority=>[authority.id,authority]));
 return requiredAuthorities.map(id=>{
  const authority=index.get(id);
  assert(plain(authority),"Required fixation authority is missing");
  assert(typeof authority.citation==="string"&&typeof authority.scopeLimitations==="string"&&/^https:\/\//.test(authority.sourceUrl),"Fixation authority is invalid");
  assert(authority.issuedOn===null||date(authority.issuedOn)&&authority.issuedOn<=evaluationDate,"Fixation authority is unavailable on the evaluation date");
  return sourceView(authority);
 });
}

function validate(input){
 assert(plain(input),"Fixation lesson input must be a plain object");
 assert(input.schemaVersion==="1.0.0","Unsupported fixation lesson schema");
 assert(typeof input.scenarioId==="string"&&/^[a-z0-9][a-z0-9-]{0,127}$/.test(input.scenarioId),"Invalid scenario ID");
 assert(date(input.evaluationDate),"Invalid evaluation date");
 assert(PROFILES.has(input.caseProfile),"Invalid case profile");
 assert(plain(input.facts),"Fixation facts must be a plain object");
 const facts=input.facts;
 assert(["buffer","ram","other"].includes(facts.storageKind),"Invalid storage kind");
 assert(facts.durationMilliseconds===null||Number.isSafeInteger(facts.durationMilliseconds)&&facts.durationMilliseconds>=0,"Invalid duration evidence");
 for(const key of ["automaticallyOverwritten","perceptible","reproducible","retainedUntilPowerOff"]){
  assert(facts[key]===null||typeof facts[key]==="boolean","Invalid "+key+" evidence");
 }
 return input;
}

export function evaluateFixationLesson(input,catalog){
 const scenario=validate(input),authoritySources=sources(catalog,scenario.evaluationDate),facts=scenario.facts;
 let outcome="unresolved",qualification="facts-require-case-specific-analysis";
 if(scenario.caseProfile==="cablevision-buffer"){
  const citedRecord=facts.storageKind==="buffer"&&facts.durationMilliseconds===1200&&
   facts.automaticallyOverwritten===true&&facts.retainedUntilPowerOff===false;
  if(citedRecord){outcome="not-fixed-on-cited-facts";qualification="cablevision-record-only";}
  else qualification="cablevision-record-mismatch";
 }
 if(scenario.caseProfile==="mai-maintenance-ram"){
  const citedRecord=facts.storageKind==="ram"&&facts.durationMilliseconds===null&&
   facts.automaticallyOverwritten===false&&facts.perceptible===true&&
   facts.reproducible===true&&facts.retainedUntilPowerOff===true;
  if(citedRecord){outcome="fixed-on-cited-facts";qualification="mai-record-only";}
  else qualification="mai-record-mismatch";
 }
 return deepFreeze({
  schemaVersion:"1.0.0",scenarioId:scenario.scenarioId,evaluationDate:scenario.evaluationDate,
  outcome,qualification,durationEvidenceMilliseconds:facts.durationMilliseconds,
  explanation:outcome==="not-fixed-on-cited-facts"
   ?"Cablevision treated its automatically overwritten 1.2-second buffer embodiment as transitory on that record."
   :outcome==="fixed-on-cited-facts"
    ?"MAI treated the maintenance loading of software into usable RAM as a fixed copy on that record."
    :"Section 101 requires a case-specific assessment of stability and duration; these facts do not reproduce either cited record.",
  caveats:[
   "No numeric duration is a universal safe harbor.",
   "RAM is not categorically fixed or categorically transitory.",
   "Fixation does not by itself decide infringement, authorization, an exception, or fair use.",
  ],
  sources:authoritySources,
 });
}
