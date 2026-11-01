import test from "node:test";
import assert from "node:assert/strict";
import { resolveLegalConflict } from "../src/conflicts.mjs";

const source = (id) => ({
  id,
  citation: id + " citation",
  issuedOn: "2020-01-01",
  sourceUrl: "https://example.test/" + id,
  scopeLimitations: "This fixture is limited to the stated conflict.",
});
const rule = (id, effect, applicability = "matched") => ({
  id,
  applicability,
  effect,
  rationale: "Bounded golden-oracle fixture.",
  sources: [source("authority-" + id)],
});
const evaluation = (rules, outcome = "disputed", unknownRuleIds = []) => ({
  schemaVersion: "1.0.0",
  scenarioId: "conflict-scenario",
  evaluationDate: "2026-10-19",
  sourceBaselineAsOf: "2026-10-19",
  outcome,
  qualification: outcome === "disputed"
    ? "supported-rules-conflict"
    : "material-facts-or-authority-date-unresolved",
  matchedRuleIds: rules.filter((item) => item.applicability === "matched").map((item) => item.id),
  unknownRuleIds,
  ruleEvaluations: rules,
});
const precedence = (decisions) => ({
  schemaVersion: "1.0.0",
  id: "golden-precedence",
  decisions,
});
const decision = (id, higherRuleId, lowerRuleIds, sourceIds) => ({
  id,
  higherRuleId,
  lowerRuleIds,
  sourceIds,
  rationale: "The cited authority explicitly establishes this bounded precedence.",
});

test("sourced precedence resolves competing holdings", () => {
  const input = evaluation([rule("supporting", "permit"), rule("limiting", "restrict")]);
  const result = resolveLegalConflict(input, precedence([
    decision("irrelevant", "supporting", ["limiting"], ["authority-limiting"]),
  ]));
  assert.equal(result.outcome, "permit");
  assert.equal(result.baseOutcome, "disputed");
  assert.deepEqual(result.winningRuleIds, ["supporting"]);
  assert.equal(result.qualification, "qualified-by-sourced-precedence");
  assert.ok(Object.isFrozen(result.ruleEvaluations[0].sources[0]));
});

test("nested exception chains must dominate every competing matched effect", () => {
  const input = evaluation([
    rule("general-permission", "permit"),
    rule("distribution-exception", "restrict"),
    rule("licensed-carveout", "permit"),
  ]);
  const partial = resolveLegalConflict(input, precedence([
    decision("exception", "distribution-exception", ["general-permission"],
      ["authority-distribution-exception"]),
  ]));
  assert.equal(partial.outcome, "disputed");
  const complete = resolveLegalConflict(input, precedence([
    decision("exception", "distribution-exception", ["general-permission"],
      ["authority-distribution-exception"]),
    decision("carveout", "licensed-carveout", ["distribution-exception"],
      ["authority-licensed-carveout"]),
  ]));
  assert.equal(complete.outcome, "permit");
  assert.deepEqual(complete.winningRuleIds, ["licensed-carveout"]);
});

test("unknown applicability stays unresolved despite a precedence claim", () => {
  const rules = [
    rule("supporting", "permit"),
    rule("unknown-limitation", "restrict", "unknown"),
  ];
  const input = evaluation(rules, "unresolved", ["unknown-limitation"]);
  const result = resolveLegalConflict(input, precedence([
    decision("claim", "supporting", ["unknown-limitation"], ["authority-supporting"]),
  ]));
  assert.equal(result.outcome, "unresolved");
  assert.deepEqual(result.appliedPrecedenceIds, []);
});

test("ambiguous operative rules stay unresolved unless every conflict is dominated", () => {
  const input = evaluation([
    rule("supporting", "permit"),
    rule("ambiguous", "unresolved"),
  ], "unresolved");
  input.qualification = "matched-rule-requires-unresolved-outcome";
  const result = resolveLegalConflict(input, precedence([
    decision("clarifying", "supporting", ["ambiguous"], ["authority-supporting"]),
  ]));
  assert.equal(result.outcome, "permit");
  assert.equal(result.qualification, "qualified-by-sourced-precedence");
});

test("invented sources, unknown rules, cycles and stray fields fail closed", () => {
  const input = evaluation([rule("supporting", "permit"), rule("limiting", "restrict")]);
  assert.throws(() => resolveLegalConflict(input, precedence([
    decision("invented", "supporting", ["limiting"], ["invented-authority"]),
  ])), /cited in the evaluated scenario/);
  assert.throws(() => resolveLegalConflict(input, precedence([
    decision("unknown", "invented-rule", ["limiting"], ["authority-limiting"]),
  ])), /Unknown higher rule/);
  assert.throws(() => resolveLegalConflict(input, precedence([
    decision("first", "supporting", ["limiting"], ["authority-supporting"]),
    decision("second", "limiting", ["supporting"], ["authority-limiting"]),
  ])), /cycle/);
  const polluted = precedence([
    decision("valid", "supporting", ["limiting"], ["authority-supporting"]),
  ]);
  polluted.decisions[0].priority = 1;
  assert.throws(() => resolveLegalConflict(input, polluted), /fields differ/);
  const fabricated = structuredClone(input);
  fabricated.outcome = "permit";
  assert.throws(() => resolveLegalConflict(fabricated, precedence([
    decision("valid", "supporting", ["limiting"], ["authority-supporting"]),
  ])), /outcome is inconsistent/);
  const future = structuredClone(input);
  future.ruleEvaluations[0].sources[0].issuedOn = "2027-01-01";
  assert.throws(() => resolveLegalConflict(future, precedence([
    decision("future", "supporting", ["limiting"], ["authority-supporting"]),
  ])), /postdates the evaluation/);
});
