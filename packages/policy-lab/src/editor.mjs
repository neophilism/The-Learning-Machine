import { compilePolicyRuleSet } from "./compiler.mjs";

const SCHEMA_VERSION = "1.0.0";
const VISITOR_SOURCE_ID = "visitor-authored-hypothesis";
const ACCESS_METHODS = new Set([
  "purchase", "license", "borrow", "stream", "public-source", "unauthorized", "unknown",
]);
const EFFECTS = new Set(["permit", "restrict", "conditional", "unresolved"]);
const EDITOR_FIELDS = [
  "schemaVersion", "id", "effect", "accessMethod", "lawfulAccess",
  "intermediateCopies", "retentionDurationDays", "teaching", "distributedOutput",
];
const FACT_FIELDS = [
  "access.method", "access.lawful", "copying.intermediateCopies",
  "retention.durationDays", "teaching.performed", "outputs.distributed",
];

const assert = (condition, message) => {
  if (!condition) throw new TypeError(message);
};
const plain = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const exact = (value, fields, label) => {
  assert(plain(value), label + " must be a plain object");
  const keys = Object.keys(value);
  assert(keys.length === fields.length && keys.every((key) => fields.includes(key)),
    label + " fields differ");
};
const deepFreeze = (value) => {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};

function validateEditorState(input) {
  exact(input, EDITOR_FIELDS, "Visitor policy editor state");
  assert(input.schemaVersion === SCHEMA_VERSION, "Unsupported visitor policy schema version");
  assert(typeof input.id === "string" && /^[a-z0-9][a-z0-9-]{0,95}$/.test(input.id),
    "Invalid visitor policy ID");
  assert(EFFECTS.has(input.effect), "Unsupported visitor policy effect");
  assert(ACCESS_METHODS.has(input.accessMethod), "Unsupported visitor access method");
  for (const field of ["lawfulAccess", "intermediateCopies", "teaching", "distributedOutput"]) {
    assert(typeof input[field] === "boolean", "Visitor policy " + field + " must be boolean");
  }
  assert(Number.isInteger(input.retentionDurationDays) &&
    input.retentionDurationDays >= 0 && input.retentionDurationDays <= 36500,
  "Visitor policy retention duration must be zero to 36500 whole days");
  return structuredClone(input);
}

function validateFirstEditorRuleSet(ruleSetInput) {
  const rules = compilePolicyRuleSet(ruleSetInput, { allowedSourceIds: [VISITOR_SOURCE_ID] });
  assert(rules.framework === "hypothetical", "Visitor policy must use the hypothetical framework");
  assert(rules.rules.length === 1, "First visitor policy requires exactly one rule");
  const rule = rules.rules[0];
  assert(rule.sourceIds.length === 1 && rule.sourceIds[0] === VISITOR_SOURCE_ID,
    "Visitor policy requires its authored-hypothesis provenance label");
  assert(rule.when.operator === "all" && rule.when.conditions.length === FACT_FIELDS.length,
    "First visitor policy requires the controlled term set");
  for (let index = 0; index < FACT_FIELDS.length; index += 1) {
    const condition = rule.when.conditions[index];
    assert(condition.operator === "eq" && condition.fact === FACT_FIELDS[index],
      "Visitor policy controlled terms differ");
  }
  return rules;
}

export function createVisitorPolicyRuleSet(input) {
  const state = validateEditorState(input);
  const values = [
    state.accessMethod,
    state.lawfulAccess,
    state.intermediateCopies,
    state.retentionDurationDays,
    state.teaching,
    state.distributedOutput,
  ];
  return validateFirstEditorRuleSet({
    schemaVersion: SCHEMA_VERSION,
    id: state.id,
    framework: "hypothetical",
    rules: [{
      id: state.id + "-rule",
      sourceIds: [VISITOR_SOURCE_ID],
      when: {
        operator: "all",
        conditions: FACT_FIELDS.map((fact, index) => ({ operator: "eq", fact, value: values[index] })),
      },
      effect: state.effect,
      rationale: "Visitor-authored hypothetical rule over controlled factual terms; not current or proposed law.",
    }],
  });
}

export function serializeVisitorPolicyRuleSet(ruleSetInput) {
  return JSON.stringify(validateFirstEditorRuleSet(ruleSetInput));
}

export function parseVisitorPolicyRuleSet(serialized) {
  assert(typeof serialized === "string" && serialized.length > 0 && serialized.length <= 50000,
    "Serialized visitor policy must be one to 50000 characters");
  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new TypeError("Serialized visitor policy must be valid JSON");
  }
  return validateFirstEditorRuleSet(parsed);
}

export function previewVisitorPolicyRuleSet(ruleSetInput, factSnapshotInput) {
  const rules = validateFirstEditorRuleSet(ruleSetInput);
  exact(factSnapshotInput, FACT_FIELDS, "Visitor policy fact snapshot");
  const facts = structuredClone(factSnapshotInput);
  assert(ACCESS_METHODS.has(facts["access.method"]), "Unsupported preview access method");
  for (const field of [
    "access.lawful", "copying.intermediateCopies", "teaching.performed", "outputs.distributed",
  ]) {
    assert(facts[field] === null || typeof facts[field] === "boolean",
      "Preview fact " + field + " must be boolean or null");
  }
  assert(facts["retention.durationDays"] === null ||
    (Number.isInteger(facts["retention.durationDays"]) &&
      facts["retention.durationDays"] >= 0 && facts["retention.durationDays"] <= 36500),
  "Preview retention duration must be null or zero to 36500 whole days");

  const conditions = rules.rules[0].when.conditions;
  const termResults = conditions.map((condition) => {
    const actual = facts[condition.fact];
    const status = actual === null || actual === "unknown"
      ? "unknown"
      : Object.is(actual, condition.value) ? "matched" : "not-matched";
    return { fact: condition.fact, expected: condition.value, actual, status };
  });
  const applicability = termResults.some((term) => term.status === "not-matched")
    ? "not-matched"
    : termResults.some((term) => term.status === "unknown") ? "unknown" : "matched";
  return deepFreeze({
    schemaVersion: SCHEMA_VERSION,
    ruleSetId: rules.id,
    ruleId: rules.rules[0].id,
    framework: "hypothetical",
    applicability,
    selectedEffect: rules.rules[0].effect,
    outcome: applicability === "matched" ? rules.rules[0].effect : "unresolved",
    qualification: applicability === "matched"
      ? "visitor-rule-matched-controlled-facts"
      : applicability === "unknown" ? "visitor-rule-has-unknown-facts" : "visitor-rule-not-applicable",
    termResults,
  });
}

export const VISITOR_POLICY_SOURCE_ID = VISITOR_SOURCE_ID;

