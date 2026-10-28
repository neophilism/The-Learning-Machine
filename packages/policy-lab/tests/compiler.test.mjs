import test from "node:test";
import assert from "node:assert/strict";
import { compilePolicyRuleSet, SUPPORTED_POLICY_FACTS } from "../src/compiler.mjs";

const sourceOptions = { allowedSourceIds: ["statute-107", "proposal-v1"] };
const fixture = () => ({
  schemaVersion: "1.0.0",
  id: "current-training-rule",
  framework: "current-law",
  rules: [{
    id: "copy-and-retain",
    sourceIds: ["statute-107"],
    when: {
      operator: "all",
      conditions: [
        { operator: "eq", fact: "copying.performed", value: true },
        { operator: "not", condition: { operator: "eq", fact: "retention.retained", value: false } },
      ],
    },
    effect: "unresolved",
    rationale: "The source is relevant, but this compiler does not decide the legal outcome.",
  }],
});

test("compiles and deeply freezes a bounded source-linked rule set", () => {
  const compiled = compilePolicyRuleSet(fixture(), sourceOptions);
  assert.equal(compiled.rules[0].sourceIds[0], "statute-107");
  assert.ok(Object.isFrozen(compiled.rules[0].when.conditions[1].condition));
  assert.ok(SUPPORTED_POLICY_FACTS.includes("outputs.distributed"));
});

test("unsourced and unknown-source operative rules fail closed", () => {
  const unsourced = fixture();
  unsourced.rules[0].sourceIds = [];
  assert.throws(() => compilePolicyRuleSet(unsourced, sourceOptions), /requires source IDs/);
  const unknown = fixture();
  unknown.rules[0].sourceIds = ["invented-case"];
  assert.throws(() => compilePolicyRuleSet(unknown, sourceOptions), /Unknown policy source/);
});

test("unsupported operations, facts, effects and executable values fail closed", () => {
  for (const change of [
    (rule) => { rule.when.operator = "eval"; },
    (rule) => { rule.when.conditions[0].fact = "secret.untypedFact"; },
    (rule) => { rule.effect = "approve"; },
    (rule) => { rule.when.conditions[0].value = () => true; },
  ]) {
    const candidate = fixture();
    change(candidate.rules[0]);
    assert.throws(() => compilePolicyRuleSet(candidate, sourceOptions));
  }
});

test("fact comparisons reject values outside the TLM-051 scenario domains", () => {
  for (const [fact, value] of [
    ["access.lawful", "yes"],
    ["access.method", "scrape"],
    ["retention.durationDays", -1],
    ["retention.durationDays", 1.5],
    ["work.copyrightStatus", "maybe"],
  ]) {
    const candidate = fixture();
    candidate.rules[0].when.conditions[0] = { operator: "eq", fact, value };
    assert.throws(() => compilePolicyRuleSet(candidate, sourceOptions), /fact-compatible/);
  }

  const invalidMembership = fixture();
  invalidMembership.rules[0].when.conditions[0] = {
    operator: "in",
    fact: "access.method",
    value: ["purchase", "scrape"],
  };
  assert.throws(() => compilePolicyRuleSet(invalidMembership, sourceOptions), /fact-compatible/);
});

test("nested groups retain exact meaning and bounded alternatives", () => {
  const candidate = fixture();
  candidate.rules[0].when = {
    operator: "any",
    conditions: [
      { operator: "in", fact: "access.method", value: ["purchase", "borrow"] },
      { operator: "exists", fact: "outputs.containsProtectedExpression", value: false },
    ],
  };
  assert.deepEqual(compilePolicyRuleSet(candidate, sourceOptions).rules[0].when, candidate.rules[0].when);
  candidate.rules[0].when.conditions[0].value.push("borrow");
  assert.throws(() => compilePolicyRuleSet(candidate, sourceOptions), /Duplicate policy comparison/);
});

test("depth, node and collection budgets reject hostile growth", () => {
  const deep = fixture();
  let node = { operator: "eq", fact: "access.lawful", value: true };
  for (let index = 0; index < 7; index += 1) node = { operator: "not", condition: node };
  deep.rules[0].when = node;
  assert.throws(() => compilePolicyRuleSet(deep, sourceOptions), /six levels/);
  const wide = fixture();
  wide.rules[0].when = { operator: "all", conditions: Array.from({ length: 17 }, () => ({ operator: "eq", fact: "access.lawful", value: true })) };
  assert.throws(() => compilePolicyRuleSet(wide, sourceOptions), /two to sixteen/);
});

test("duplicate identities, stray fields and prototype-bearing payloads fail closed", () => {
  const duplicate = fixture();
  duplicate.rules.push(structuredClone(duplicate.rules[0]));
  assert.throws(() => compilePolicyRuleSet(duplicate, sourceOptions), /Duplicate policy rule/);
  const stray = fixture();
  stray.rules[0].script = "return true";
  assert.throws(() => compilePolicyRuleSet(stray, sourceOptions), /fields differ/);
  const polluted = fixture();
  polluted.rules[0].when = Object.create({ operator: "eq" });
  assert.throws(() => compilePolicyRuleSet(polluted, sourceOptions), /plain object/);
});
