import test from "node:test";
import assert from "node:assert/strict";
import {evaluateEducationLesson} from "../src/education-lesson.mjs";

const authority=id=>({id,citation:id,issuedOn:null,sourceUrl:"https://example.test/"+id,scopeLimitations:"Limited to the cited statute and facts."});
const catalog={jurisdiction:"United States",authorities:["usc17-101","usc17-107","usc17-110"].map(authority)};
const proposal={documentKind:"proposed-bill",authoritativeFullText:false,provisions:[],versionId:"placeholder",enactedLaw:false,notice:"No authoritative proposal text is loaded."};
const factors={purpose:"supports",nature:"unknown",amount:"unknown",market:"unknown"};
const baseFacts={performanceOrDisplay:true,byInstructorOrPupil:true,faceToFace:true,classroomOrSimilarPlace:true,nonprofitEducationalInstitution:true,commercial:false,audienceScope:"class-or-public-group",audiovisualCopyLawfullyMade:true,responsiblePersonKnewUnlawful:false};
const scenario=(teachingContext,facts=baseFacts,instructionMode="live")=>({schemaVersion:"1.0.0",scenarioId:"education-case",evaluationDate:"2026-10-19",instructionMode,teachingContext,facts,fairUseFactors:factors});

test("applies section 110(1) to historical nonprofit face-to-face classroom facts",()=>{
 const result=evaluateEducationLesson(scenario("nonprofit-school",baseFacts,"historical"),catalog,proposal);
 assert.equal(result.section110.outcome,"applies-on-stated-facts");
 assert.equal(result.publicPerformance,"potentially-public");
 assert.equal(result.proposedExpansion.status,"proposal-unavailable-incomplete");
 assert.deepEqual(result.sources.map(source=>source.id),["usc17-101","usc17-107","usc17-110"]);
 assert.ok(Object.isFrozen(result.sources[0]));
});

test("does not silently grant or deny section 110 based on teaching label",()=>{
 const contractedTutor=evaluateEducationLesson(scenario("private-tutoring",baseFacts),catalog,proposal);
 assert.equal(contractedTutor.section110.outcome,"applies-on-stated-facts");
 const missingNonprofitFact=evaluateEducationLesson(scenario("nonprofit-school",{...baseFacts,nonprofitEducationalInstitution:false}),catalog,proposal);
 assert.equal(missingNonprofitFact.section110.outcome,"does-not-apply-on-stated-facts");
});

test("keeps for-profit live instruction outside section 110(1) while preserving fair-use analysis",()=>{
 const result=evaluateEducationLesson({...scenario("for-profit-school",{...baseFacts,nonprofitEducationalInstitution:false,commercial:true}),fairUseFactors:{purpose:"opposes",nature:"supports",amount:"supports",market:"unknown"}},catalog,proposal);
 assert.equal(result.section110.outcome,"does-not-apply-on-stated-facts");
 assert.equal(result.fairUse.outcome,"requires-four-factor-analysis");
 assert.equal(result.fairUse.commercialStatus,true);
 assert.equal(result.fairUse.factors.market,"unknown");
 assert.match(result.caveats[1],/does not decide/);
});

test("handles private household tutoring and known unlawful audiovisual copies separately",()=>{
 const household=evaluateEducationLesson(scenario("private-tutoring",{...baseFacts,audienceScope:"family-social-circle"}),catalog,proposal);
 assert.equal(household.publicPerformance,"not-public-on-stated-audience");
 const unlawful=evaluateEducationLesson(scenario("nonprofit-school",{...baseFacts,audiovisualCopyLawfullyMade:false,responsiblePersonKnewUnlawful:true}),catalog,proposal);
 assert.equal(unlawful.section110.outcome,"does-not-apply-on-stated-facts");
 assert.equal(unlawful.section110.reason,"known-unlawful-audiovisual-copy");
});

test("does not convert an incomplete proposal into present permission",()=>{
 const result=evaluateEducationLesson(scenario("for-profit-school",{...baseFacts,nonprofitEducationalInstitution:false,commercial:true}),catalog,proposal);
 assert.equal(result.proposedExpansion.enactedLaw,false);
 assert.match(result.caveats[2],/not present law/);
});

test("rejects malformed factors, sources and proposal records",()=>{
 assert.throws(()=>evaluateEducationLesson({...scenario("nonprofit-school"),fairUseFactors:{...factors,market:"wins"}},catalog,proposal),/factor signal/);
 assert.throws(()=>evaluateEducationLesson(scenario("nonprofit-school"),{...catalog,authorities:catalog.authorities.slice(0,2)},proposal),/missing/);
 assert.throws(()=>evaluateEducationLesson(scenario("nonprofit-school"),catalog,{...proposal,provisions:null}),/provisions/);
});
