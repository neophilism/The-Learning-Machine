import { validateLegalScenario } from "@learning-machine/contracts";
import { compilePolicyRuleSet } from "./compiler.mjs";

const OUTCOMES = new Set(["permit", "restrict", "conditional", "unresolved"]);

const assert = (condition, message) => {
  if (!condition) throw new TypeError(message);
};
const plain = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const text = (value, label, maximum = 2000) => {
  assert(typeof value === "string" && value.trim().length > 0 && value.length <= maximum,
    "Invalid " + label);
  return value;
};
const validDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
};
const deepFreeze = (value) => {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};

function authorityIndex(input) {
  assert(plain(input), "Authority catalog must be a plain object");
  assert(input.jurisdiction === "United States", "Authority catalog must cover United States law");
  assert(plain(input.sourceBaseline) && validDate(input.sourceBaseline.asOf),
    "Authority catalog requires a dated source baseline");
  assert(Array.isArray(input.authorities) && input.authorities.length > 0 &&
    input.authorities.length <= 1000, "Authority catalog requires one to one thousand sources");
  const indexed = new Map();
  for (const authority of input.authorities) {
    assert(plain(authority), "Authority must be a plain object");
    const id = text(authority.id, "authority ID", 128);
    assert(!indexed.has(id), "Duplicate authority ID");
    text(authority.citation, "authority citation", 512);
    text(authority.sourceUrl, "authority source URL", 2000);
    assert(/^https:\/\//.test(authority.sourceUrl), "Authority source URL must use HTTPS");
    text(authority.scopeLimitations, "authority scope limitations", 4000);
    assert(authority.issuedOn === null || validDate(authority.issuedOn),
      "Authority issue date must be null or a valid date");
    indexed.set(id, authority);
  }
  return { asOf: input.sourceBaseline.asOf, indexed };
}

function scenarioFacts(scenario) {
  const workStatuses = new Set(scenario.facts.works.map((work) => work.copyrightStatus));
  return {
    "work.copyrightStatus": workStatuses.size === 1 ? [...workStatuses][0] : null,
    "access.method": scenario.facts.access.method,
    "access.lawful": scenario.facts.access.lawful,
    "copying.performed": scenario.facts.copying.performed,
    "copying.intermediateCopies": scenario.facts.copying.intermediateCopies,
    "retention.retained": scenario.facts.retention.retained,
    "retention.durationDays": scenario.facts.retention.durationDays,
    "teaching.performed": scenario.facts.teaching.performed,
    "outputs.created": scenario.facts.outputs.created,
    "outputs.distributed": scenario.facts.outputs.distributed,
    "outputs.containsProtectedExpression": scenario.facts.outputs.containsProtectedExpression,
  };
}

const unknown = (value) => value === null || value === "unknown";
function compareCondition(condition, facts) {
  if (condition.operator === "all") {
    const results = condition.conditions.map((child) => compareCondition(child, facts));
    if (results.includes(false)) return false;
    return results.includes(null) ? null : true;
  }
  if (condition.operator === "any") {
    const results = condition.conditions.map((child) => compareCondition(child, facts));
    if (results.includes(true)) return true;
    return results.includes(null) ? null : false;
  }
  if (condition.operator === "not") {
    const result = compareCondition(condition.condition, facts);
    return result === null ? null : !result;
  }

  const actual = facts[condition.fact];
  if (condition.operator === "exists") return unknown(actual) !== condition.value;
  if (unknown(actual)) return null;
  if (condition.operator === "eq") return Object.is(actual, condition.value);
  if (condition.operator === "neq") return !Object.is(actual, condition.value);
  return condition.value.some((candidate) => Object.is(actual, candidate));
}

const sourceView = (authority) => ({
  id: authority.id,
  citation: authority.citation,
  issuedOn: authority.issuedOn,
  sourceUrl: authority.sourceUrl,
  scopeLimitations: authority.scopeLimitations,
});

export function evaluateCurrentLaw(scenarioInput, ruleSetInput, authorityCatalogInput) {
  const scenario = validateLegalScenario(scenarioInput);
  assert(scenario.status === "current", "Current-law evaluation requires a current scenario");
  const catalog = authorityIndex(authorityCatalogInput);
  const scenarioSourceIds = new Set(scenario.sourceIds);
  for (const sourceId of scenarioSourceIds) {
    assert(catalog.indexed.has(sourceId), "Unknown scenario source ID");
  }
  const rules = compilePolicyRuleSet(ruleSetInput, {
    allowedSourceIds: [...catalog.indexed.keys()],
  });
  assert(rules.framework === "current-law", "Current-law evaluation requires current-law rules");
  const facts = scenarioFacts(scenario);
  const baselineCurrent = scenario.evaluationDate <= catalog.asOf;

  const evaluations = rules.rules.map((rule) => {
    const sources = rule.sourceIds.map((sourceId) => {
      assert(scenarioSourceIds.has(sourceId), "Policy rule source is absent from the scenario");
      return catalog.indexed.get(sourceId);
    });
    const sourcesAvailable = sources.every((source) =>
      source.issuedOn === null || source.issuedOn <= scenario.evaluationDate);
    const condition = compareCondition(rule.when, facts);
    const applicability = !baselineCurrent || !sourcesAvailable || condition === null
      ? "unknown"
      : condition ? "matched" : "not-matched";
    return {
      id: rule.id,
      applicability,
      effect: rule.effect,
      rationale: rule.rationale,
      sources: sources.map(sourceView),
    };
  });

  const matched = evaluations.filter((rule) => rule.applicability === "matched");
  const unknownRuleIds = evaluations
    .filter((rule) => rule.applicability === "unknown")
    .map((rule) => rule.id);
  const effects = new Set(matched.map((rule) => rule.effect));
  let outcome = "unresolved";
  let qualification = baselineCurrent ? "no-applicable-rule" : "source-baseline-predates-scenario";
  if (unknownRuleIds.length > 0) qualification = baselineCurrent
    ? "material-facts-or-authority-date-unresolved"
    : qualification;
  if (matched.length > 0 && unknownRuleIds.length === 0) {
    if (effects.has("unresolved")) {
      qualification = "matched-rule-requires-unresolved-outcome";
    } else if (effects.size > 1) {
      outcome = "disputed";
      qualification = "supported-rules-conflict";
    } else {
      outcome = matched[0].effect;
      qualification = "qualified-by-cited-rules";
    }
  }
  assert(outcome === "disputed" || OUTCOMES.has(outcome), "Unsupported evaluation outcome");

  return deepFreeze({
    schemaVersion: "1.0.0",
    scenarioId: scenario.id,
    evaluationDate: scenario.evaluationDate,
    sourceBaselineAsOf: catalog.asOf,
    outcome,
    qualification,
    matchedRuleIds: matched.map((rule) => rule.id),
    unknownRuleIds,
    ruleEvaluations: evaluations,
  });
}
