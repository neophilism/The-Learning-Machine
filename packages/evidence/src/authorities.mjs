const ALLOWED_SOURCE_TYPES=new Set(['statutory-text','government-constitution','official-opinion','official-opinion-index','official-court-docket','secondary-opinion','government-case-summary','government-case-index']);
const VALID_HOSTS=new Set(['law.cornell.edu','www.law.cornell.edu','www.govinfo.gov','govinfo.gov','www.copyright.gov','copyright.gov','www.supremecourt.gov','supremecourt.gov','constitution.congress.gov','supreme.justia.com','docs.justia.com','law.justia.com']);
const VALID_TOPICS=new Set(['constitutional-purpose','learning','fixation','temporary-processing','ideas-expression','licenses','fair-use','commercial-learning','libraries','exceptions','first-sale','access','education','filtering','broadcasting','software','accessibility','network','caching','interoperability','security','technology','intermediate-copying','search','redistribution','market-substitution','machine-learning','lawful-acquisition']);
const STATUSES=new Set(['source_link_identified','indexed_summary','summary_reviewed','opinion_reviewed','opinion_located','opinion_indexed']);
const assert=(condition,msg)=>{if(!condition)throw new TypeError(msg)};
const field=(v,name,min=1)=>{assert(typeof v==='string'&&v.trim().length>=min&&v.length<5000,'Invalid '+name);return v};
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
export function validateUsLawPack(data){
 assert(plain(data),'Pack must be plain object');
 assert(data.schemaVersion==='1.0.0'&&data.jurisdiction==='United States','Unsupported or non-U.S. law pack');
 field(data.curatedOn,'curatedOn');assert(/^\d{4}-\d{2}-\d{2}$/.test(data.curatedOn),'Invalid curation date');
 assert(plain(data.sourceBaseline)&&typeof data.sourceBaseline.edition==='string'&&typeof data.sourceBaseline.note==='string','Baseline provenance missing');
 assert(Array.isArray(data.authorities)&&data.authorities.length>=20&&data.authorities.length<=500,'Insufficient or oversize authority pack');
 const ids=new Set(),cites=new Set(),count={constitution:0,statute:0,precedent:0},stances={supporting:0,limiting:0,mixed:0,foundation:0};
 for(const a of data.authorities){
  assert(plain(a),'Authority must be plain object');
  assert(/^[a-z0-9][a-z0-9-]{2,80}$/.test(field(a.id,'authority.id')),'Invalid authority ID');
  assert(!ids.has(a.id),'Duplicate authority ID '+a.id);ids.add(a.id);
  assert(['constitution','statute','precedent'].includes(a.kind),'Non-U.S. authority kind');
  count[a.kind]++;
  field(a.citation,'citation');assert(!cites.has(a.citation),'Duplicate citation '+a.citation);cites.add(a.citation);
  field(a.title,'title');field(a.forum,'forum');
  field(a.relevance,'relevance',30);field(a.scopeLimitations,'scopeLimitations',40);
  assert(ALLOWED_SOURCE_TYPES.has(a.sourceType)&&STATUSES.has(a.researchStatus),'Unsupported source provenance class');
  let url;try{url=new URL(a.sourceUrl)}catch{throw new TypeError('Bad source URL')}
  assert(url.protocol==='https:'&&VALID_HOSTS.has(url.hostname)&&!url.username&&!url.password,'Untrusted authority source URL');
  assert(Array.isArray(a.topics)&&a.topics.length>0&&a.topics.every(t=>VALID_TOPICS.has(t)),'Invalid topic tags');
  if(a.kind==='precedent'){
   assert(/^\d{4}-\d{2}-\d{2}$/.test(a.issuedOn)&&a.issuedOn<=data.curatedOn,'Bad decision date');
   assert(['supporting','limiting','mixed','foundation'].includes(a.stance),'Missing balanced case categorization');
   stances[a.stance]++;
  }else assert(a.issuedOn===null&&a.stance===undefined,'Incorrect treatment of legislative authority as a decided case');
 }
 assert(count.statute>=10&&count.precedent>=10&&count.constitution>=1,'Missing coverage categories');
 assert(stances.supporting>=3&&stances.limiting>=2&&stances.mixed>=2,'Pack must include favorable and adverse precedent');
 return Object.freeze({version:data.schemaVersion,asOf:data.curatedOn,count:Object.freeze(count),stances:Object.freeze(stances),ids:Object.freeze([...ids])});
}
export function getAuthority(pack,id){
 validateUsLawPack(pack);
 const authority=pack.authorities.find(a=>a.id===id);
 return authority?structuredClone(authority):null;
}
export function authoritiesForTopic(pack,topic){
 validateUsLawPack(pack);
 if(!VALID_TOPICS.has(topic))throw new TypeError('Unknown law topic');
 return pack.authorities.filter(a=>a.topics.includes(topic)).map(x=>structuredClone(x));
}
