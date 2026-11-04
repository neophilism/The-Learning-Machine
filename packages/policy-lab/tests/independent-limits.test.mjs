import test from "node:test";
import assert from "node:assert/strict";
import { evaluateIndependentLimits } from "../src/independent-limits.mjs";

const authority = (id) => ({
  id,
  citation: id,
  issuedOn: null,
  sourceUrl: "https://example.test/" + id,
  scopeLimitations: "This authority has a narrow scope and requires separate elements.",
});
const catalog = {
  jurisdiction: "United States",
  authorities: [
    authority("usc17-1201-f-"),
    authority("usc18-1030"),
    authority("usc18-2511"),
    authority("usc18-1836"),
  ],
};
const copyrightEvaluation = {
  outcome: "permit",
  qualification: "qualified-by-cited-copyright-rules",
  matchedRuleIds: ["fair-use"],
  unknownRuleIds: [],
};
const facts = {
  accessControlCircumvented: false,
  section1201ExceptionEstablished: false,
  protectedComputerAccessed: false,
  accessAuthorized: true,
  communicationIntercepted: false,
  interceptionAuthorized: true,
  personalDataProcessed: false,
  privacyAuthorizationOrLegalBasisEstablished: true,
  contractRestrictionBreached: false,
  confidentialityDutyBreached: false,
  tradeSecretClaimed: false,
  improperAcquisitionUseOrDisclosure: false,
};
const scenario = (overrides = {}, copyright = copyrightEvaluation) => ({
  schemaVersion: "1.0.0",
  scenarioId: "cross-regime-scenario",
  evaluationDate: "2026-10-19",
  copyrightEvaluation: copyright,
  facts: {...facts, ...overrides},
});

test("a copyright permission does not authorize circumvention, access, or interception", () => {
  const result = evaluateIndependentLimits(scenario({
    accessControlCircumvented: true,
    protectedComputerAccessed: true,
    accessAuthorized: false,
    communicationIntercepted: true,
    interceptionAuthorized: false,
  }), catalog);
  assert.equal(result.copyrightEvaluation.outcome, "permit");
  assert.equal(result.overall, "independent-limit-indicated");
  assert.deepEqual(result.indicatedRegimes,
    ["access-control", "unauthorized-access", "communications-privacy"]);
  assert.equal(result.axesIndependent, true);
});

test("contract, confidentiality, privacy, and trade-secret facts remain independent", () => {
  const result = evaluateIndependentLimits(scenario({
    personalDataProcessed: true,
    privacyAuthorizationOrLegalBasisEstablished: false,
    contractRestrictionBreached: true,
    confidentialityDutyBreached: true,
    tradeSecretClaimed: true,
    improperAcquisitionUseOrDisclosure: true,
  }, {...copyrightEvaluation, outcome: "restrict"}), catalog);
  assert.equal(result.copyrightEvaluation.outcome, "restrict");
  assert.deepEqual(result.indicatedRegimes,
    ["privacy", "contract", "confidentiality", "trade-secrets"]);
  assert.equal(result.assessments.find((item) => item.regime === "privacy").source, null);
});

test("unknown facts and claimed Section 1201 exceptions do not become permission", () => {
  const result = evaluateIndependentLimits(scenario({
    accessControlCircumvented: true,
    section1201ExceptionEstablished: true,
    protectedComputerAccessed: null,
    accessAuthorized: null,
  }), catalog);
  assert.equal(result.overall, "independent-limits-unresolved");
  assert.deepEqual(result.unresolvedRegimes, ["access-control", "unauthorized-access"]);
  assert.equal(result.assessments[0].status, "exception-facts-require-separate-review");
});

test("complete negative facts report only that the fixture indicates no independent limit", () => {
  const result = evaluateIndependentLimits(scenario(), catalog);
  assert.equal(result.overall, "no-independent-limit-indicated-by-fixture");
  assert.deepEqual(result.indicatedRegimes, []);
  assert.match(result.assessments[4].caveat, /separate governing-law/);
  assert.ok(Object.isFrozen(result.assessments[0].source));
});

test("future, missing, malformed, and fabricated evidence fails closed", () => {
  assert.throws(() => evaluateIndependentLimits(scenario(), {
    ...catalog,
    authorities: catalog.authorities.slice(0, 3),
  }), /missing/);
  const future = structuredClone(catalog);
  future.authorities[0].issuedOn = "2027-01-01";
  assert.throws(() => evaluateIndependentLimits(scenario(), future), /unavailable/);
  assert.throws(() => evaluateIndependentLimits(scenario({
    accessAuthorized: "probably",
  }), catalog), /accessAuthorized/);
  const polluted = scenario();
  polluted.combinedVerdict = "lawful";
  assert.throws(() => evaluateIndependentLimits(polluted, catalog), /fields/);
  const invented = scenario({}, {...copyrightEvaluation, outcome: "obviously-lawful"});
  assert.throws(() => evaluateIndependentLimits(invented, catalog), /copyright outcome/);
});
