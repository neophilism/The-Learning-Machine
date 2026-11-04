import test from "node:test";
import assert from "node:assert/strict";
import { evaluateEducationLesson } from "../src/education-lesson.mjs";

const authority = (id) => ({
  id, citation: id, issuedOn: null, sourceUrl: "https://example.test/" + id,
  scopeLimitations: "Limited to the cited statute and complete facts.",
});
const catalog = { jurisdiction: "United States",
  authorities: [authority("usc17-106"), authority("usc17-107"), authority("usc17-110")] };
const bill = { schemaVersion: "1.0.0", documentKind: "proposed-bill",
  status: "incomplete-draft", authoritativeFullText: false, enactedLaw: false, provisions: [] };
const facts = {
  instructionMode: "face-to-face", workUse: "performance", institutionNonprofit: true,
  instructorOrPupil: true, classroomOrSimilarPlace: true, audiovisualWork: true,
  copyLawfullyMade: true, responsiblePersonKnewOrHadReasonCopyUnlawful: false,
  publicAudience: true, commercialPurpose: false,
};
const scenario = (setting, overrides = {}) => ({ schemaVersion: "1.0.0",
  scenarioId: setting, evaluationDate: "2026-10-19", setting, facts: { ...facts, ...overrides } });

test("recognizes only the complete nonprofit face-to-face classroom fixture", () => {
  const result = evaluateEducationLesson(scenario("nonprofit-school"), catalog, bill);
  assert.equal(result.section110Outcome, "exempt-on-cited-facts");
  assert.equal(result.publicPerformance, "right-implicated-but-section-110-1-exemption-applies");
  assert.equal(result.fairUseOutcome, "requires-separate-four-factor-analysis");
  assert.ok(Object.isFrozen(result.sources[0]));
});

test("does not rewrite for-profit teaching as nonprofit present law", () => {
  const result = evaluateEducationLesson(scenario("for-profit-school", {
    institutionNonprofit: false, commercialPurpose: true,
  }), catalog, bill);
  assert.equal(result.section110Outcome, "outside-section-110-1");
  assert.equal(result.publicPerformance, "right-implicated-authorization-or-exception-required");
  assert.match(result.explanation, /does not itself decide fair use/);
});

test("keeps private tutoring and copying outside the narrow exemption without declaring infringement", () => {
  const tutoring = evaluateEducationLesson(scenario("private-tutoring", {
    institutionNonprofit: false, classroomOrSimilarPlace: false, publicAudience: false,
  }), catalog, bill);
  assert.equal(tutoring.section110Outcome, "outside-section-110-1");
  assert.equal(tutoring.publicPerformance, "not-indicated-by-fixture");
  const copying = evaluateEducationLesson(scenario("nonprofit-school", { workUse: "copying" }), catalog, bill);
  assert.equal(copying.section110Outcome, "outside-section-110-1");
});

test("distinguishes face-to-face history from live transmission and unknown facts", () => {
  const live = evaluateEducationLesson(scenario("nonprofit-school", {
    instructionMode: "live-transmission",
  }), catalog, bill);
  assert.equal(live.section110Outcome, "outside-section-110-1");
  assert.match(live.caveats[2], /Live transmission/);
  const unknown = evaluateEducationLesson(scenario("unclassified", {
    institutionNonprofit: null,
  }), catalog, bill);
  assert.equal(unknown.section110Outcome, "unresolved-material-facts");
});

test("models the audiovisual-copy knowledge condition without inventing knowledge", () => {
  const noKnowledge = evaluateEducationLesson(scenario("nonprofit-school", {
    copyLawfullyMade: false, responsiblePersonKnewOrHadReasonCopyUnlawful: false,
  }), catalog, bill);
  assert.equal(noKnowledge.section110Outcome, "exempt-on-cited-facts");
  const unknownKnowledge = evaluateEducationLesson(scenario("nonprofit-school", {
    copyLawfullyMade: false, responsiblePersonKnewOrHadReasonCopyUnlawful: null,
  }), catalog, bill);
  assert.equal(unknownKnowledge.section110Outcome, "unresolved-material-facts");
});

test("does not invent the proposed educational expansion", () => {
  const result = evaluateEducationLesson(scenario("nonprofit-school"), catalog, bill);
  assert.equal(result.proposalOutcome, "not-evaluable-incomplete-draft");
  assert.match(result.caveats[3], /never presented as enacted law/);
});

test("rejects invalid fixtures, sources, and enacted proposal records", () => {
  assert.throws(() => evaluateEducationLesson(scenario("nonprofit-school", {
    instructionMode: "telepathy",
  }), catalog, bill), /instruction mode/);
  assert.throws(() => evaluateEducationLesson(scenario("nonprofit-school"), {
    ...catalog, authorities: catalog.authorities.slice(0, 2),
  }, bill), /missing/);
  assert.throws(() => evaluateEducationLesson(scenario("nonprofit-school"), catalog, {
    ...bill, enactedLaw: true,
  }), /non-enacted/);
  assert.throws(() => evaluateEducationLesson(scenario("for-profit-school", {
    institutionNonprofit: true,
  }), catalog, bill), /conflicts/);
});
