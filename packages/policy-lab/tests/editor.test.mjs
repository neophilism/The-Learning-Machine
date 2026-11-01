import test from "node:test";
import assert from "node:assert/strict";
import {
  createVisitorPolicyRuleSet,
  parseVisitorPolicyRuleSet,
  previewVisitorPolicyRuleSet,
  serializeVisitorPolicyRuleSet,
} from "../src/editor.mjs";

const state = () => ({
  schemaVersion: "1.0.0",
  id: "visitor-draft",
  effect: "permit",
  accessMethod: "license",
  lawfulAccess: true,
  intermediateCopies: true,
  retentionDurationDays: 1,
  teaching: true,
  distributedOutput: false,
});
const facts = () => ({
  "access.method": "license",
  "access.lawful": true,
  "copying.intermediateCopies": true,
  "retention.durationDays": 1,
  "teaching.performed": true,
  "outputs.distributed": false,
});

test("serializes one bounded hypothetical rule and round-trips it", () => {
  const input = state();
  const before = structuredClone(input);
  const rules = createVisitorPolicyRuleSet(input);
  const serialized = serializeVisitorPolicyRuleSet(rules);
  const restored = parseVisitorPolicyRuleSet(serialized);
  assert.deepEqual(input, before);
  assert.deepEqual(restored, rules);
  assert.equal(restored.framework, "hypothetical");
  assert.deepEqual(restored.rules[0].sourceIds, ["visitor-authored-hypothesis"]);
  assert.ok(Object.isFrozen(restored.rules[0].when));
  assert.equal(serialized, serializeVisitorPolicyRuleSet(restored));
});

test("shows the selected effect only when every controlled term matches", () => {
  const rules = createVisitorPolicyRuleSet(state());
  const matched = previewVisitorPolicyRuleSet(rules, facts());
  assert.equal(matched.applicability, "matched");
  assert.equal(matched.outcome, "permit");
  assert.equal(matched.termResults.filter((term) => term.status === "matched").length, 6);

  const changedFacts = facts();
  changedFacts["outputs.distributed"] = true;
  const rejected = previewVisitorPolicyRuleSet(rules, changedFacts);
  assert.equal(rejected.applicability, "not-matched");
  assert.equal(rejected.outcome, "unresolved");
  assert.equal(rejected.termResults.find((term) => term.fact === "outputs.distributed").status,
    "not-matched");
});

test("keeps a rule unresolved when a material preview fact is unknown", () => {
  const input = facts();
  input["access.lawful"] = null;
  const result = previewVisitorPolicyRuleSet(createVisitorPolicyRuleSet(state()), input);
  assert.equal(result.applicability, "unknown");
  assert.equal(result.outcome, "unresolved");
  assert.ok(Object.isFrozen(result.termResults));
});

test("rejects unsupported editor values and noncanonical imports", () => {
  assert.throws(() => createVisitorPolicyRuleSet({ ...state(), accessMethod: "scraped" }),
    /access method/);
  assert.throws(() => createVisitorPolicyRuleSet({ ...state(), retentionDurationDays: -1 }),
    /retention duration/);
  assert.throws(() => createVisitorPolicyRuleSet({ ...state(), extra: true }), /fields differ/);
  assert.throws(() => parseVisitorPolicyRuleSet("{"), /valid JSON/);
  assert.throws(() => parseVisitorPolicyRuleSet("x".repeat(50001)), /one to 50000/);

  const altered = createVisitorPolicyRuleSet(state());
  const plain = JSON.parse(JSON.stringify(altered));
  plain.rules[0].sourceIds = ["usc17-107"];
  assert.throws(() => parseVisitorPolicyRuleSet(JSON.stringify(plain)), /Unknown policy source/);
  plain.rules[0].sourceIds = ["visitor-authored-hypothesis"];
  plain.rules.push(structuredClone(plain.rules[0]));
  plain.rules[1].id = "second-rule";
  assert.throws(() => parseVisitorPolicyRuleSet(JSON.stringify(plain)), /exactly one rule/);
});

