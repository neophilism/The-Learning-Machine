import test from "node:test";
import assert from "node:assert/strict";
import { compareLegalFrameworks } from "../src/comparison.mjs";

const catalog = {
  jurisdiction: "United States",
  sourceBaseline: { asOf: "2026-10-19" },
  authorities: [{ id: "usc17-107", citation: "17 U.S.C. section 107", issuedOn: null,
    sourceUrl: "https://example.test/107", scopeLimitations: "All factors remain material." }],
};
const scenario = () => ({
  schemaVersion: "1.0.0", id: "same-facts", status: "current",
  jurisdiction: "US-federal", evaluationDate: "2026-10-19",
  facts: {
    actors: [{ id: "learner", role: "learner" }, { id: "owner", role: "rights-holder" }],
    works: [{ id: "book", kind: "text", copyrightStatus: "protected", rightsHolderActorId: "owner" }],
    access: { method: "purchase", lawful: true, sourceActorId: "owner" },
    copying: { performed: true, inputWorkIds: ["book"], intermediateCopies: true },
    retention: { retained: false, durationDays: 0 },
    teaching: { performed: true, learnerActorIds: ["learner"] },
    outputs: { created: true, distributed: false, containsProtectedExpression: false },
    declaredUnknowns: [],
  },
  sourceIds: ["usc17-107"],
});
const rule = (id, sourceId, effect, fact = "access.lawful", value = true) => ({
  id, sourceIds: [sourceId], when: { operator: "eq", fact, value }, effect,
  rationale: "This bounded fixture changes only the applied rule framework.",
});
const currentRules = () => ({ schemaVersion: "1.0.0", id: "current",
  framework: "current-law", rules: [rule("current-permit", "usc17-107", "permit")] });
const approvedBill = () => ({
  schemaVersion: "1.0.0", jurisdiction: "United States", documentKind: "proposed-bill",
  status: "approved-proposal", title: "Fictional comparison fixture", versionId: "fixture-v1",
  checkedOn: "2026-10-19", introducedBillNumber: "H.R. 0",
  officialSourceUrl: "https://www.congress.gov/bill/119th-congress/house-bill/0/text",
  fullTextSha256: "a".repeat(64), authoritativeFullText: true, enactedLaw: false,
  notice: "Fictional proposed bill fixture, not enacted law.",
  provisions: [{ id: "fixture-section", heading: "Fixture", text: "Test-only proposed rule." }],
});
const proposedRules = (effect = "restrict") => ({ schemaVersion: "1.0.0", id: "proposal",
  framework: "proposed-law", rules: [rule("proposal-rule", "fixture-section", effect)] });

test("compares different frameworks over one immutable fact snapshot", () => {
  const input = scenario();
  const before = structuredClone(input);
  const result = compareLegalFrameworks(input, currentRules(), catalog, approvedBill(), proposedRules());
  assert.deepEqual(input, before);
  assert.deepEqual(result.scenario.facts, before.facts);
  assert.equal(result.current.outcome, "permit");
  assert.equal(result.proposed.outcome, "restrict");
  assert.deepEqual(result.differences, [{ field: "outcome", current: "permit",
    proposed: "restrict", cause: "rule-framework" }]);
  assert.ok(Object.isFrozen(result.scenario.facts.access));
  assert.match(result.proposed.displayLabel, /not enacted law/);
});

test("does not invent operative rules for the repository's incomplete proposal", () => {
  const incomplete = { ...approvedBill(), status: "incomplete-draft", versionId: "placeholder",
    introducedBillNumber: null, officialSourceUrl: null, fullTextSha256: null,
    authoritativeFullText: false, provisions: [],
    notice: "Incomplete draft placeholder, not enacted law." };
  const result = compareLegalFrameworks(scenario(), currentRules(), catalog, incomplete);
  assert.equal(result.proposed.outcome, "unresolved");
  assert.equal(result.proposed.qualification, "authoritative-proposal-unavailable");
  assert.deepEqual(result.proposed.ruleEvaluations, []);
  assert.deepEqual(result.differences, []);
  assert.throws(() => compareLegalFrameworks(
    scenario(), currentRules(), catalog, incomplete, proposedRules(),
  ), /cannot have operative rules/);
});

test("reports no differential when both bounded frameworks reach the same outcome", () => {
  const result = compareLegalFrameworks(
    scenario(), currentRules(), catalog, approvedBill(), proposedRules("permit"),
  );
  assert.deepEqual(result.differences, []);
});

test("unknown facts remain unresolved under proposed rules", () => {
  const input = scenario();
  input.facts.access = { method: "unknown", lawful: null, sourceActorId: "owner" };
  input.facts.declaredUnknowns = ["access.lawful", "access.method"];
  const result = compareLegalFrameworks(input, currentRules(), catalog, approvedBill(), proposedRules());
  assert.equal(result.current.outcome, "unresolved");
  assert.equal(result.proposed.outcome, "unresolved");
  assert.deepEqual(result.proposed.unknownRuleIds, ["proposal-rule"]);
});

test("rejects framework swaps, unsourced proposal rules and alternate scenario status", () => {
  const wrongFramework = proposedRules();
  wrongFramework.framework = "current-law";
  assert.throws(() => compareLegalFrameworks(
    scenario(), currentRules(), catalog, approvedBill(), wrongFramework,
  ), /proposed-law rules/);
  const unknownSource = proposedRules();
  unknownSource.rules[0].sourceIds = ["invented-section"];
  assert.throws(() => compareLegalFrameworks(
    scenario(), currentRules(), catalog, approvedBill(), unknownSource,
  ), /Unknown policy source/);
  const proposedScenario = scenario();
  proposedScenario.status = "proposed";
  assert.throws(() => compareLegalFrameworks(
    proposedScenario, currentRules(), catalog, approvedBill(), proposedRules(),
  ), /one current fact scenario/);
});
