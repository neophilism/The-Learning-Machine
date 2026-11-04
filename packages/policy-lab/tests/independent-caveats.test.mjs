import test from "node:test";
import assert from "node:assert/strict";
import { evaluateIndependentLegalCaveats } from "../src/independent-caveats.mjs";

const authority = (id) => ({
  id, citation: id, issuedOn: null, sourceUrl: "https://example.test/" + id,
  scopeLimitations: "Issue-spotting only; complete statutory and factual review is required.",
});
const catalog = {
  jurisdiction: "United States",
  authorities: [
    "usc17-1201-f-", "usc18-2511", "usc18-1836", "usc18-1839",
  ].map(authority),
};
const baseFacts = {
  technologicalAccessControlPresent: false,
  circumventionAttempted: false,
  accessAuthorized: true,
  communicationIntercepted: false,
  partyConsentEstablished: true,
  informationConfidential: false,
  reasonableSecrecyMeasures: false,
  acquiredByImproperMeans: false,
  useOrDisclosureOutsidePermission: false,
  contractRestrictionApplies: false,
  plannedUseCompliesWithContract: true,
};
const scenario = (overrides = {}, copyrightPermission = "established-for-exercise") => ({
  schemaVersion: "1.0.0",
  scenarioId: "cross-regime-fixture",
  evaluationDate: "2026-11-04",
  copyrightPermission,
  facts: { ...baseFacts, ...overrides },
});

test("does not let copyright permission authorize access-control circumvention", () => {
  const result = evaluateIndependentLegalCaveats(scenario({
    technologicalAccessControlPresent: true,
    circumventionAttempted: true,
    accessAuthorized: false,
  }), catalog);
  assert.equal(result.copyrightPermission, "established-for-exercise");
  assert.equal(result.section1201Outcome, "separate-section-1201-review-required");
  assert.equal(result.independentReviewRequired, true);
  assert.match(result.explanation, /does not itself authorize/);
});

test("keeps interception and consent in an independent privacy review", () => {
  const review = evaluateIndependentLegalCaveats(scenario({
    communicationIntercepted: true,
    partyConsentEstablished: false,
  }), catalog);
  assert.equal(review.interceptionPrivacyOutcome, "separate-interception-review-required");
  const unknown = evaluateIndependentLegalCaveats(scenario({
    communicationIntercepted: true,
    partyConsentEstablished: null,
  }), catalog);
  assert.equal(unknown.interceptionPrivacyOutcome, "unresolved-material-facts");
});

test("flags trade-secret facts without declaring misappropriation", () => {
  const result = evaluateIndependentLegalCaveats(scenario({
    informationConfidential: true,
    reasonableSecrecyMeasures: true,
    acquiredByImproperMeans: true,
    useOrDisclosureOutsidePermission: false,
  }), catalog);
  assert.equal(result.confidentialityTradeSecretOutcome,
    "separate-trade-secret-review-required");
  assert.match(result.caveats[0], /not a finding of liability/);
});

test("keeps contract compliance separate from copyright", () => {
  const result = evaluateIndependentLegalCaveats(scenario({
    contractRestrictionApplies: true,
    plannedUseCompliesWithContract: false,
  }), catalog);
  assert.equal(result.contractOutcome, "separate-contract-review-required");
});

test("preserves unresolved cross-regime facts and frozen evidence", () => {
  const result = evaluateIndependentLegalCaveats(scenario({
    technologicalAccessControlPresent: true,
    circumventionAttempted: true,
    accessAuthorized: null,
    informationConfidential: null,
  }), catalog);
  assert.equal(result.section1201Outcome, "unresolved-material-facts");
  assert.equal(result.confidentialityTradeSecretOutcome, "unresolved-material-facts");
  assert.ok(Object.isFrozen(result.sources[0]));
});

test("rejects malformed scenarios and missing authorities", () => {
  assert.throws(() => evaluateIndependentLegalCaveats({
    ...scenario(), copyrightPermission: "automatic-permission",
  }, catalog), /copyright permission/);
  assert.throws(() => evaluateIndependentLegalCaveats(scenario({
    communicationIntercepted: "maybe",
  }), catalog), /communicationIntercepted/);
  assert.throws(() => evaluateIndependentLegalCaveats(scenario(), {
    ...catalog, authorities: catalog.authorities.slice(0, 3),
  }), /missing/);
});
