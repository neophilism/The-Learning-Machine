import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCurrentLaw } from "../src/evaluator.mjs";

const catalog = {
  jurisdiction: "United States",
  sourceBaseline: { asOf: "2026-10-19" },
  authorities: [
    { id: "usc17-107", citation: "17 U.S.C. section 107", issuedOn: null,
      sourceUrl: "https://example.test/107", scopeLimitations: "All factors and facts remain material." },
    { id: "google-books", citation: "Authors Guild v. Google", issuedOn: "2015-10-16",
      sourceUrl: "https://example.test/google-books", scopeLimitations: "Limited search facts only." },
    { id: "tveyes", citation: "Fox News Network v. TVEyes", issuedOn: "2018-02-27",
      sourceUrl: "https://example.test/tveyes", scopeLimitations: "Limited redistribution facts only." },
  ],
};

const scenario = (overrides = {}) => ({
  schemaVersion: "1.0.0", id: "training-scenario", status: "current",
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
    ...overrides,
  },
  sourceIds: ["usc17-107", "google-books", "tveyes"],
});

const ruleSet = (rules) => ({ schemaVersion: "1.0.0", id: "qualified-current-law",
  framework: "current-law", rules });
const rule = (id, sourceIds, when, effect) => ({ id, sourceIds, when, effect,
  rationale: "The cited source supports only this bounded rule and does not decide every training use." });

test("returns a qualified source-linked outcome for a matching bounded rule", () => {
  const result = evaluateCurrentLaw(scenario(), ruleSet([
    rule("non-distributed-analysis", ["usc17-107", "google-books"], {
      operator: "all", conditions: [
        { operator: "eq", fact: "access.lawful", value: true },
        { operator: "eq", fact: "outputs.distributed", value: false },
      ],
    }, "permit"),
  ]), catalog);
  assert.equal(result.outcome, "permit");
  assert.equal(result.qualification, "qualified-by-cited-rules");
  assert.deepEqual(result.matchedRuleIds, ["non-distributed-analysis"]);
  const statute = result.ruleEvaluations[0].sources.find((source) => source.id === "usc17-107");
  assert.match(statute.scopeLimitations, /material/);
  assert.ok(Object.isFrozen(result.ruleEvaluations[0].sources[0]));
});

test("does not use one universal outcome for materially different training facts", () => {
  const rules = ruleSet([
    rule("bounded-analysis", ["google-books"], { operator: "eq", fact: "outputs.distributed", value: false }, "permit"),
    rule("protected-redistribution", ["tveyes"], { operator: "eq", fact: "outputs.distributed", value: true }, "restrict"),
  ]);
  assert.equal(evaluateCurrentLaw(scenario(), rules, catalog).outcome, "permit");
  const distributed = scenario({
    outputs: { created: true, distributed: true, containsProtectedExpression: true },
  });
  assert.equal(evaluateCurrentLaw(distributed, rules, catalog).outcome, "restrict");
});

test("reports disputed when applicable supported rules conflict", () => {
  const result = evaluateCurrentLaw(scenario(), ruleSet([
    rule("supporting", ["google-books"], { operator: "eq", fact: "access.lawful", value: true }, "permit"),
    rule("limiting", ["tveyes"], { operator: "eq", fact: "copying.performed", value: true }, "restrict"),
  ]), catalog);
  assert.equal(result.outcome, "disputed");
  assert.equal(result.qualification, "supported-rules-conflict");
});

test("unknown material facts prevent a decisive legal outcome", () => {
  const unknown = scenario({
    access: { method: "unknown", lawful: null, sourceActorId: "owner" },
    declaredUnknowns: ["access.lawful", "access.method"],
  });
  const result = evaluateCurrentLaw(unknown, ruleSet([
    rule("lawful-access", ["usc17-107"], { operator: "eq", fact: "access.lawful", value: true }, "permit"),
  ]), catalog);
  assert.equal(result.outcome, "unresolved");
  assert.deepEqual(result.unknownRuleIds, ["lawful-access"]);
});

test("stale baselines and future authorities remain unresolved", () => {
  const future = structuredClone(catalog);
  future.authorities[1].issuedOn = "2027-01-01";
  const result = evaluateCurrentLaw(scenario(), ruleSet([
    rule("future-rule", ["google-books"], { operator: "eq", fact: "access.lawful", value: true }, "permit"),
  ]), future);
  assert.equal(result.outcome, "unresolved");
  assert.deepEqual(result.unknownRuleIds, ["future-rule"]);

  const laterScenario = scenario();
  laterScenario.evaluationDate = "2026-10-20";
  assert.equal(evaluateCurrentLaw(laterScenario, ruleSet([
    rule("stale", ["usc17-107"], { operator: "eq", fact: "access.lawful", value: true }, "permit"),
  ]), catalog).qualification, "source-baseline-predates-scenario");
});

test("rejects non-current frameworks and unregistered scenario or rule sources", () => {
  const rules = ruleSet([rule("bounded", ["usc17-107"], { operator: "eq", fact: "access.lawful", value: true }, "permit")]);
  const proposed = rules;
  proposed.framework = "proposed-law";
  assert.throws(() => evaluateCurrentLaw(scenario(), proposed, catalog), /current-law rules/);
  const missing = scenario();
  missing.sourceIds = ["invented-source"];
  assert.throws(() => evaluateCurrentLaw(missing, rules, catalog), /Unknown scenario source/);
});
