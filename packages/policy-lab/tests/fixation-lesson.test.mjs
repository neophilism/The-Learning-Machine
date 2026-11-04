import test from "node:test";
import assert from "node:assert/strict";
import {evaluateFixationLesson} from "../src/fixation-lesson.mjs";

const authority=(id,issuedOn=null)=>({id,citation:id,issuedOn,sourceUrl:"https://example.test/"+id,scopeLimitations:"Limited to the cited facts and jurisdiction."});
const catalog={jurisdiction:"United States",authorities:[authority("usc17-101"),authority("cablevision","2008-08-04"),authority("mai-peak","1993-04-07")]};
const scenario=(caseProfile,facts)=>({schemaVersion:"1.0.0",scenarioId:"temporary-copy",evaluationDate:"2026-10-19",caseProfile,facts});
const cablevisionFacts={storageKind:"buffer",durationMilliseconds:1200,automaticallyOverwritten:true,perceptible:null,reproducible:null,retainedUntilPowerOff:false};
const maiFacts={storageKind:"ram",durationMilliseconds:null,automaticallyOverwritten:false,perceptible:true,reproducible:true,retainedUntilPowerOff:true};

test("teaches the Cablevision result only for its cited buffer record",()=>{
 const result=evaluateFixationLesson(scenario("cablevision-buffer",cablevisionFacts),catalog);
 assert.equal(result.outcome,"not-fixed-on-cited-facts");
 assert.equal(result.qualification,"cablevision-record-only");
 assert.match(result.caveats[0],/No numeric duration/);
 assert.deepEqual(result.sources.map(source=>source.id),["usc17-101","cablevision","mai-peak"]);
 assert.ok(Object.isFrozen(result.sources[0]));
});

test("does not turn 1.2 seconds into an immunity threshold",()=>{
 for(const durationMilliseconds of [0,1199,1201,10_000]){
  const result=evaluateFixationLesson(scenario("cablevision-buffer",{...cablevisionFacts,durationMilliseconds}),catalog);
  assert.equal(result.outcome,"unresolved");
  assert.equal(result.qualification,"cablevision-record-mismatch");
 }
});

test("teaches MAI on its maintenance RAM facts without condemning all RAM",()=>{
 const result=evaluateFixationLesson(scenario("mai-maintenance-ram",maiFacts),catalog);
 assert.equal(result.outcome,"fixed-on-cited-facts");
 assert.equal(result.qualification,"mai-record-only");
 const unrelated=evaluateFixationLesson(scenario("unclassified",{...maiFacts,durationMilliseconds:500,automaticallyOverwritten:true,retainedUntilPowerOff:false}),catalog);
 assert.equal(unrelated.outcome,"unresolved");
 assert.match(unrelated.caveats[1],/not categorically/);
});

test("mismatched or unknown case facts remain unresolved",()=>{
 assert.equal(evaluateFixationLesson(scenario("mai-maintenance-ram",{...maiFacts,perceptible:null}),catalog).outcome,"unresolved");
 assert.equal(evaluateFixationLesson(scenario("cablevision-buffer",{...cablevisionFacts,retainedUntilPowerOff:true}),catalog).outcome,"unresolved");
});

test("rejects invalid fixtures and unavailable authority",()=>{
 assert.throws(()=>evaluateFixationLesson(scenario("cablevision-buffer",{...cablevisionFacts,durationMilliseconds:-1}),catalog),/duration/);
 assert.throws(()=>evaluateFixationLesson(scenario("cablevision-buffer",cablevisionFacts),{...catalog,authorities:catalog.authorities.slice(0,2)}),/missing/);
 const future={...catalog,authorities:[catalog.authorities[0],catalog.authorities[1],authority("mai-peak","2027-01-01")]};
 assert.throws(()=>evaluateFixationLesson(scenario("mai-maintenance-ram",maiFacts),future),/unavailable/);
});
