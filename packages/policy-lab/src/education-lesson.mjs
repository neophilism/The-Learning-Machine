const CONTEXTS=new Set(["nonprofit-school","private-tutoring","for-profit-school"]);
const AUDIENCES=new Set(["family-social-circle","class-or-public-group","transmitted","unknown"]);
const SIGNALS=new Set(["supports","opposes","unknown"]);
const requiredAuthorities=["usc17-101","usc17-107","usc17-110"];
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
  assert(plain(authority),"Required education authority is missing");
  assert(typeof authority.citation==="string"&&typeof authority.scopeLimitations==="string"&&/^https:\/\//.test(authority.sourceUrl),"Education authority is invalid");
  assert(authority.issuedOn===null||date(authority.issuedOn)&&authority.issuedOn<=evaluationDate,"Education authority is unavailable on the evaluation date");
  return sourceView(authority);
 });
}

function proposalView(proposal){
 assert(plain(proposal)&&proposal.documentKind==="proposed-bill","Proposed-law record is required");
 assert(Array.isArray(proposal.provisions),"Proposed-law provisions are invalid");
 const available=proposal.authoritativeFullText===true&&proposal.provisions.length>0;
 return {
  status:available?"proposal-available":"proposal-unavailable-incomplete",
  versionId:proposal.versionId,
  enactedLaw:proposal.enactedLaw===true,
  notice:proposal.notice,
 };
}

function validate(input){
 assert(plain(input),"Education lesson input must be a plain object");
 assert(input.schemaVersion==="1.0.0","Unsupported education lesson schema");
 assert(typeof input.scenarioId==="string"&&/^[a-z0-9][a-z0-9-]{0,127}$/.test(input.scenarioId),"Invalid scenario ID");
 assert(date(input.evaluationDate),"Invalid evaluation date");
 assert(["historical","live"].includes(input.instructionMode),"Invalid instruction mode");
 assert(CONTEXTS.has(input.teachingContext),"Invalid teaching context");
 assert(plain(input.facts),"Education facts must be a plain object");
 const facts=input.facts;
 for(const key of ["performanceOrDisplay","byInstructorOrPupil","faceToFace","classroomOrSimilarPlace","nonprofitEducationalInstitution","commercial"]){
  assert(typeof facts[key]==="boolean","Invalid "+key+" evidence");
 }
 assert(AUDIENCES.has(facts.audienceScope),"Invalid audience scope");
 assert(facts.audiovisualCopyLawfullyMade===null||typeof facts.audiovisualCopyLawfullyMade==="boolean","Invalid audiovisual copy evidence");
 assert(facts.responsiblePersonKnewUnlawful===null||typeof facts.responsiblePersonKnewUnlawful==="boolean","Invalid knowledge evidence");
 assert(plain(input.fairUseFactors),"Fair-use factors are required");
 for(const key of ["purpose","nature","amount","market"])assert(SIGNALS.has(input.fairUseFactors[key]),"Invalid fair-use factor signal");
 return input;
}

export function evaluateEducationLesson(input,catalog,proposal){
 const scenario=validate(input),facts=scenario.facts,authoritySources=sources(catalog,scenario.evaluationDate);
 let section110Outcome="not-implicated",section110Reason="no-performance-or-display";
 if(facts.performanceOrDisplay){
  const base=facts.byInstructorOrPupil&&facts.faceToFace&&facts.classroomOrSimilarPlace&&facts.nonprofitEducationalInstitution;
  const disqualifiedCopy=facts.audiovisualCopyLawfullyMade===false&&facts.responsiblePersonKnewUnlawful===true;
  section110Outcome=base&&!disqualifiedCopy?"applies-on-stated-facts":"does-not-apply-on-stated-facts";
  section110Reason=base?(disqualifiedCopy?"known-unlawful-audiovisual-copy":"statutory-elements-satisfied"):"one-or-more-statutory-elements-absent";
 }
 const publicPerformance=facts.performanceOrDisplay
  ?(facts.audienceScope==="family-social-circle"?"not-public-on-stated-audience":facts.audienceScope==="unknown"?"unresolved":"potentially-public")
  :"not-implicated";
 return deepFreeze({
  schemaVersion:"1.0.0",scenarioId:scenario.scenarioId,evaluationDate:scenario.evaluationDate,
  instructionMode:scenario.instructionMode,teachingContext:scenario.teachingContext,
  section110:{outcome:section110Outcome,reason:section110Reason},
  publicPerformance,
  fairUse:{outcome:"requires-four-factor-analysis",factors:{...scenario.fairUseFactors},commercialStatus:facts.commercial},
  proposedExpansion:proposalView(proposal),
  caveats:[
   "Section 110(1) depends on the stated institutional and teaching facts, not a context label alone.",
   "Commercial or nonprofit status is relevant to fair use but does not decide the four-factor analysis.",
   "A proposed educational expansion is not present law and cannot supply permission when its authoritative text is unavailable.",
  ],
  sources:authoritySources,
 });
}
