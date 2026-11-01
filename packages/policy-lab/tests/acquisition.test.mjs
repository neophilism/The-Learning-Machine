import test from "node:test";
import assert from "node:assert/strict";
import { evaluateAcquisitionExercise } from "../src/acquisition.mjs";

const evaluate = (input) => evaluateAcquisitionExercise(input, {allowedSourceIds: ["source-1"]});

const learningEvaluation = (overrides = {}) => ({
  scenarioId: "scenario-57",
  outcome: "restrict",
  qualification: "qualified-by-cited-rules",
  matchedRuleIds: ["rule-1"],
  unknownRuleIds: [],
  ...overrides,
});
const exercise = (method, kind, authorization, overrides = {}) => ({
  schemaVersion: "1.0.0",
  id: "acquisition-exercise",
  acquisition: {
    method,
    evidence: {
      id: "evidence-1",
      kind,
      authorization,
      description: "Authored exercise evidence with a separately reviewed source.",
      sourceId: "source-1",
    },
  },
  learningEvaluation: learningEvaluation(),
  ...overrides,
});

test("lawful acquisition does not force a permitted learning-use outcome", () => {
  for (const [method, kind] of [
    ["purchase", "receipt"],
    ["borrow", "loan-record"],
    ["stream", "license-record"],
  ]) {
    const result = evaluate(exercise(method, kind, "confirmed"));
    assert.equal(result.acquisition.accessAssessment, "lawful");
    assert.equal(result.learningUse.outcome, "restrict");
    assert.equal(result.axesIndependent, true);
  }
});

test("unauthorized acquisition does not overwrite a supported learning-use result", () => {
  const result = evaluate(exercise(
    "pirated-copy",
    "unauthorized-copy-record",
    "denied",
    {learningEvaluation: learningEvaluation({
      outcome: "permit",
      qualification: "qualified-by-separate-current-law-rules",
    })},
  ));
  assert.equal(result.acquisition.accessAssessment, "unauthorized");
  assert.equal(result.learningUse.outcome, "permit");
  assert.notEqual(result.acquisition.accessAssessment, result.learningUse.outcome);
});

test("unknown authorization remains unresolved without changing the use evaluation", () => {
  const result = evaluate(exercise(
    "stream",
    "license-record",
    "unknown",
    {learningEvaluation: learningEvaluation({
      outcome: "unresolved",
      qualification: "material-facts-or-authority-date-unresolved",
      matchedRuleIds: [],
      unknownRuleIds: ["rule-unknown"],
    })},
  ));
  assert.equal(result.acquisition.accessAssessment, "unresolved");
  assert.deepEqual(result.learningUse.unknownRuleIds, ["rule-unknown"]);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.acquisition.evidence));
});

test("rejects mismatched, contradictory, and missing provenance", () => {
  assert.throws(() => evaluate(
    exercise("purchase", "license-record", "confirmed")), /does not match/);
  assert.throws(() => evaluate(
    exercise("pirated-copy", "unauthorized-copy-record", "confirmed")), /explicit unauthorized/);
  const missing = exercise("borrow", "loan-record", "confirmed");
  delete missing.acquisition.evidence.sourceId;
  assert.throws(() => evaluate(missing), /fields/);
  const invented = exercise("stream", "license-record", "confirmed");
  invented.acquisition.evidence.sourceId = "invented-source";
  assert.throws(() => evaluate(invented), /Unregistered/);
});

test("rejects fabricated outcomes, duplicate rule evidence, and stray fields", () => {
  assert.throws(() => evaluate(exercise(
    "purchase", "receipt", "confirmed",
    {learningEvaluation: learningEvaluation({outcome: "obviously-lawful"})},
  )), /Unsupported learning-use outcome/);
  assert.throws(() => evaluate(exercise(
    "purchase", "receipt", "confirmed",
    {learningEvaluation: learningEvaluation({matchedRuleIds: ["rule-1", "rule-1"]})},
  )), /Duplicate/);
  const stray = exercise("purchase", "receipt", "confirmed");
  stray.combinedVerdict = "approved";
  assert.throws(() => evaluate(stray), /fields/);
});
