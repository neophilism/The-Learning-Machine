const OUTCOMES = new Set(["permit", "restrict", "conditional", "unresolved", "disputed"]);

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
const text = (value, label, maximum = 2000) => {
  assert(
    typeof value === "string" && value.trim().length > 0 && value.length <= maximum,
    "Invalid " + label,
  );
  return value;
};
const validDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
};
const uniqueText = (values, label, maximum = 128) => {
  assert(Array.isArray(values) && values.length > 0 && values.length <= 100, "Invalid " + label);
  const result = values.map((value) => text(value, label, maximum));
  assert(new Set(result).size === result.length, "Duplicate " + label);
  return result;
};
const deepFreeze = (value) => {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};

function validateEvaluation(input) {
  exact(input, [
    "schemaVersion", "scenarioId", "evaluationDate", "sourceBaselineAsOf",
    "outcome", "qualification", "matchedRuleIds", "unknownRuleIds", "ruleEvaluations",
  ], "Legal evaluation");
  assert(input.schemaVersion === "1.0.0", "Unsupported legal evaluation schema");
  text(input.scenarioId, "scenario ID", 128);
  assert(validDate(input.evaluationDate), "Legal evaluation date is invalid");
  assert(validDate(input.sourceBaselineAsOf), "Legal source baseline is invalid");
  assert(OUTCOMES.has(input.outcome), "Unsupported legal evaluation outcome");
  text(input.qualification, "legal qualification", 256);
  const matchedRuleIds = input.matchedRuleIds.length === 0
    ? []
    : uniqueText(input.matchedRuleIds, "matched rule ID");
  const unknownRuleIds = input.unknownRuleIds.length === 0
    ? []
    : uniqueText(input.unknownRuleIds, "unknown rule ID");
  assert(Array.isArray(input.ruleEvaluations) && input.ruleEvaluations.length > 0 &&
    input.ruleEvaluations.length <= 100, "Legal evaluation requires bounded rule evaluations");
  const ruleIds = new Set();
  const ruleEffects = new Map();
  const sourceIds = new Set();
  const applicability = new Map();
  for (const rule of input.ruleEvaluations) {
    exact(rule, ["id", "applicability", "effect", "rationale", "sources"], "Rule evaluation");
    const id = text(rule.id, "rule evaluation ID", 128);
    assert(!ruleIds.has(id), "Duplicate rule evaluation ID");
    ruleIds.add(id);
    assert(["matched", "not-matched", "unknown"].includes(rule.applicability),
      "Unsupported rule applicability");
    assert(OUTCOMES.has(rule.effect) && rule.effect !== "disputed", "Unsupported rule effect");
    text(rule.rationale, "rule rationale");
    assert(Array.isArray(rule.sources) && rule.sources.length > 0 && rule.sources.length <= 16,
      "Rule evaluation requires sources");
    for (const source of rule.sources) {
      exact(source, ["id", "citation", "issuedOn", "sourceUrl", "scopeLimitations"],
        "Rule evaluation source");
      sourceIds.add(text(source.id, "source ID", 128));
      text(source.citation, "source citation", 512);
      assert(source.issuedOn === null || validDate(source.issuedOn), "Invalid source issue date");
      assert(/^https:\/\//.test(text(source.sourceUrl, "source URL")), "Source URL must use HTTPS");
      text(source.scopeLimitations, "source limitations", 4000);
    }
    ruleEffects.set(id, rule.effect);
    applicability.set(id, rule.applicability);
  }
  for (const id of matchedRuleIds) assert(applicability.get(id) === "matched",
    "Matched rule list differs from evaluations");
  for (const id of unknownRuleIds) assert(applicability.get(id) === "unknown",
    "Unknown rule list differs from evaluations");
  assert(
    [...applicability].every(([id, state]) =>
      state !== "matched" || matchedRuleIds.includes(id)) &&
    [...applicability].every(([id, state]) =>
      state !== "unknown" || unknownRuleIds.includes(id)),
    "Rule applicability lists are incomplete",
  );
  const matchedEffects = new Set(matchedRuleIds.map((id) => ruleEffects.get(id)));
  const expectedOutcome = unknownRuleIds.length > 0 || matchedEffects.has("unresolved")
    ? "unresolved"
    : matchedEffects.size > 1
      ? "disputed"
      : matchedEffects.size === 1
        ? matchedEffects.values().next().value
        : "unresolved";
  assert(input.outcome === expectedOutcome, "Legal evaluation outcome is inconsistent");
  return { matchedRuleIds, unknownRuleIds, ruleIds, ruleEffects, sourceIds };
}

function validatePrecedence(input, evaluation) {
  exact(input, ["schemaVersion", "id", "decisions"], "Precedence oracle");
  assert(input.schemaVersion === "1.0.0", "Unsupported precedence schema");
  text(input.id, "precedence oracle ID", 128);
  assert(Array.isArray(input.decisions) && input.decisions.length > 0 &&
    input.decisions.length <= 100, "Precedence oracle requires one to one hundred decisions");
  const decisionIds = new Set();
  return input.decisions.map((decision) => {
    exact(decision, [
      "id", "higherRuleId", "lowerRuleIds", "sourceIds", "rationale",
    ], "Precedence decision");
    const id = text(decision.id, "precedence decision ID", 128);
    assert(!decisionIds.has(id), "Duplicate precedence decision ID");
    decisionIds.add(id);
    const higherRuleId = text(decision.higherRuleId, "higher rule ID", 128);
    assert(evaluation.ruleIds.has(higherRuleId), "Unknown higher rule ID");
    const lowerRuleIds = uniqueText(decision.lowerRuleIds, "lower rule ID");
    assert(!lowerRuleIds.includes(higherRuleId), "A rule cannot take precedence over itself");
    for (const lowerRuleId of lowerRuleIds) {
      assert(evaluation.ruleIds.has(lowerRuleId), "Unknown lower rule ID");
    }
    const sourceIds = uniqueText(decision.sourceIds, "precedence source ID");
    for (const sourceId of sourceIds) {
      assert(evaluation.sourceIds.has(sourceId),
        "Precedence source must be cited in the evaluated scenario");
    }
    return {
      id,
      higherRuleId,
      lowerRuleIds,
      sourceIds,
      rationale: text(decision.rationale, "precedence rationale"),
    };
  });
}

const reachable = (start, target, edges) => {
  const pending = [start];
  const visited = new Set();
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === target) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of edges.get(current) || []) pending.push(next);
  }
  return false;
};

export function resolveLegalConflict(evaluationInput, precedenceInput) {
  const evaluation = validateEvaluation(evaluationInput);
  const decisions = validatePrecedence(precedenceInput, evaluation);
  const base = structuredClone(evaluationInput);
  if (evaluation.unknownRuleIds.length > 0) {
    return deepFreeze({
      ...base,
      baseOutcome: base.outcome,
      outcome: "unresolved",
      qualification: base.qualification,
      winningRuleIds: [],
      appliedPrecedenceIds: [],
    });
  }

  const matched = new Set(evaluation.matchedRuleIds);
  const active = decisions.filter((decision) =>
    matched.has(decision.higherRuleId) &&
    decision.lowerRuleIds.some((ruleId) => matched.has(ruleId)));
  const edges = new Map();
  for (const decision of active) {
    const targets = edges.get(decision.higherRuleId) || new Set();
    for (const lowerRuleId of decision.lowerRuleIds) {
      if (matched.has(lowerRuleId)) targets.add(lowerRuleId);
    }
    edges.set(decision.higherRuleId, targets);
  }
  for (const [ruleId, targets] of edges) {
    for (const target of targets) {
      assert(!reachable(target, ruleId, edges), "Precedence graph contains a cycle");
    }
  }

  const candidates = [...matched].filter((candidate) => {
    const effect = evaluation.ruleEffects.get(candidate);
    if (effect === "unresolved") return false;
    return [...matched].every((other) =>
      evaluation.ruleEffects.get(other) === effect || reachable(candidate, other, edges));
  });
  const effects = new Set(candidates.map((id) => evaluation.ruleEffects.get(id)));
  if (candidates.length > 0 && effects.size === 1) {
    return deepFreeze({
      ...base,
      baseOutcome: base.outcome,
      outcome: evaluation.ruleEffects.get(candidates[0]),
      qualification: "qualified-by-sourced-precedence",
      winningRuleIds: candidates,
      appliedPrecedenceIds: active.map((decision) => decision.id),
    });
  }
  return deepFreeze({
    ...base,
    baseOutcome: base.outcome,
    winningRuleIds: [],
    appliedPrecedenceIds: active.map((decision) => decision.id),
  });
}
