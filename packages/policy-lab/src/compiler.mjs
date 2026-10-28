const SCHEMA_VERSION = "1.0.0";
const FACT_PATHS = new Set([
  "work.copyrightStatus",
  "access.method",
  "access.lawful",
  "copying.performed",
  "copying.intermediateCopies",
  "retention.retained",
  "retention.durationDays",
  "teaching.performed",
  "outputs.created",
  "outputs.distributed",
  "outputs.containsProtectedExpression",
]);
const EFFECTS = new Set(["permit", "restrict", "conditional", "unresolved"]);
const FRAMEWORKS = new Set(["current-law", "proposed-law", "hypothetical"]);

const assert = (condition, message) => {
  if (!condition) throw new TypeError(message);
};
const plain = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);
const exact = (value, fields, label) => {
  assert(plain(value), label + " must be a plain object");
  const keys = Object.keys(value);
  assert(
    keys.length === fields.length && keys.every((key) => fields.includes(key)),
    label + " fields differ",
  );
};
const text = (value, label, maximum = 256) => {
  assert(
    typeof value === "string" && value.trim().length > 0 && value.length <= maximum,
    "Invalid " + label,
  );
  return value;
};
const scalar = (value) =>
  value === null ||
  typeof value === "string" ||
  typeof value === "boolean" ||
  (typeof value === "number" && Number.isFinite(value));
const deepFreeze = (value) => {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};

function compileCondition(input, state, depth = 1) {
  assert(depth <= 6, "Policy condition nesting exceeds six levels");
  assert(++state.nodes <= 256, "Policy condition graph exceeds 256 nodes");
  assert(plain(input), "Policy condition must be a plain object");
  const operator = input.operator;

  if (operator === "all" || operator === "any") {
    exact(input, ["operator", "conditions"], "Policy group");
    assert(
      Array.isArray(input.conditions) &&
        input.conditions.length >= 2 &&
        input.conditions.length <= 16,
      "Policy group requires two to sixteen conditions",
    );
    return {
      operator,
      conditions: input.conditions.map((condition) =>
        compileCondition(condition, state, depth + 1),
      ),
    };
  }

  if (operator === "not") {
    exact(input, ["operator", "condition"], "Policy negation");
    return {
      operator,
      condition: compileCondition(input.condition, state, depth + 1),
    };
  }

  assert(["eq", "neq", "in", "exists"].includes(operator), "Unsupported policy operator");
  exact(input, ["operator", "fact", "value"], "Policy comparison");
  assert(FACT_PATHS.has(input.fact), "Unsupported policy fact");
  if (operator === "in") {
    assert(
      Array.isArray(input.value) &&
        input.value.length > 0 &&
        input.value.length <= 32 &&
        input.value.every(scalar),
      "Policy in comparison requires bounded scalar values",
    );
    const signatures = input.value.map((value) => JSON.stringify(value));
    assert(new Set(signatures).size === signatures.length, "Duplicate policy comparison value");
  } else if (operator === "exists") {
    assert(typeof input.value === "boolean", "Policy exists comparison requires a boolean");
  } else {
    assert(scalar(input.value), "Policy comparison requires a scalar value");
  }
  return structuredClone(input);
}

export function compilePolicyRuleSet(input, options = {}) {
  exact(input, ["schemaVersion", "id", "framework", "rules"], "Policy rule set");
  assert(input.schemaVersion === SCHEMA_VERSION, "Unsupported policy schema version");
  text(input.id, "policy rule-set ID", 128);
  assert(FRAMEWORKS.has(input.framework), "Unsupported policy framework");
  assert(
    Array.isArray(options.allowedSourceIds) &&
      options.allowedSourceIds.length > 0 &&
      options.allowedSourceIds.length <= 1000,
    "Allowed source registry is required",
  );
  const allowedSources = new Set();
  for (const sourceId of options.allowedSourceIds) {
    text(sourceId, "allowed source ID", 128);
    assert(!allowedSources.has(sourceId), "Duplicate allowed source ID");
    allowedSources.add(sourceId);
  }
  assert(Array.isArray(input.rules) && input.rules.length > 0 && input.rules.length <= 100,
    "Policy rule set requires one to one hundred rules");

  const ids = new Set();
  const rules = input.rules.map((rule) => {
    exact(rule, ["id", "sourceIds", "when", "effect", "rationale"], "Policy rule");
    text(rule.id, "policy rule ID", 128);
    assert(!ids.has(rule.id), "Duplicate policy rule ID");
    ids.add(rule.id);
    assert(Array.isArray(rule.sourceIds) && rule.sourceIds.length > 0 && rule.sourceIds.length <= 16,
      "Every operative policy rule requires source IDs");
    const sourceIds = [...rule.sourceIds];
    for (const sourceId of sourceIds) {
      text(sourceId, "policy source ID", 128);
      assert(allowedSources.has(sourceId), "Unknown policy source ID");
    }
    assert(new Set(sourceIds).size === sourceIds.length, "Duplicate policy source ID");
    assert(EFFECTS.has(rule.effect), "Unsupported policy effect");
    text(rule.rationale, "policy rationale", 2000);
    return {
      id: rule.id,
      sourceIds: sourceIds.sort(),
      when: compileCondition(rule.when, { nodes: 0 }),
      effect: rule.effect,
      rationale: rule.rationale,
    };
  });

  return deepFreeze({
    schemaVersion: SCHEMA_VERSION,
    id: input.id,
    framework: input.framework,
    rules,
  });
}

export const SUPPORTED_POLICY_FACTS = Object.freeze([...FACT_PATHS].sort());
