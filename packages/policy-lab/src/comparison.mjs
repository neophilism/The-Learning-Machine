import { validateLegalScenario } from "@learning-machine/contracts";
import { validateProposedBill } from "@learning-machine/evidence/proposed-bill";
import { compilePolicyRuleSet } from "./compiler.mjs";
import { evaluateCurrentLaw } from "./evaluator.mjs";

const assert = (condition, message) => {
  if (!condition) throw new TypeError(message);
};
const deepFreeze = (value) => {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};
const scenarioFacts = (scenario) => {
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
};
const unknown = (value) => value === null || value === "unknown";
function compareCondition(condition, facts) {
  if (condition.operator === "all" || condition.operator === "any") {
    const values = condition.conditions.map((child) => compareCondition(child, facts));
    if (condition.operator === "all") {
      if (values.includes(false)) return false;
      return values.includes(null) ? null : true;
    }
    if (values.includes(true)) return true;
    return values.includes(null) ? null : false;
  }
  if (condition.operator === "not") {
    const value = compareCondition(condition.condition, facts);
    return value === null ? null : !value;
  }
  const actual = facts[condition.fact];
  if (condition.operator === "exists") return unknown(actual) ? null : condition.value;
  if (unknown(actual)) return null;
  if (condition.operator === "eq") return Object.is(actual, condition.value);
  if (condition.operator === "neq") return !Object.is(actual, condition.value);
  return condition.value.some((candidate) => Object.is(candidate, actual));
}

function evaluateApprovedProposal(scenario, ruleSetInput, bill) {
  assert(ruleSetInput !== null && ruleSetInput !== undefined,
    "Approved proposal comparison requires proposed-law rules");
  const rules = compilePolicyRuleSet(ruleSetInput, {
    allowedSourceIds: bill.provisions.map((provision) => provision.id),
  });
  assert(rules.framework === "proposed-law", "Proposal comparison requires proposed-law rules");
  const facts = scenarioFacts(scenario);
  const evaluations = rules.rules.map((rule) => {
    const applicability = compareCondition(rule.when, facts);
    return {
      id: rule.id,
      applicability: applicability === null ? "unknown" : applicability ? "matched" : "not-matched",
      effect: rule.effect,
      rationale: rule.rationale,
      provisionIds: [...rule.sourceIds],
    };
  });
  const matched = evaluations.filter((rule) => rule.applicability === "matched");
  const unknownRuleIds = evaluations
    .filter((rule) => rule.applicability === "unknown")
    .map((rule) => rule.id);
  const effects = new Set(matched.map((rule) => rule.effect));
  let outcome = "unresolved";
  let qualification = "no-applicable-proposed-rule";
  if (unknownRuleIds.length > 0) qualification = "material-facts-unresolved";
  if (matched.length > 0 && unknownRuleIds.length === 0) {
    if (effects.has("unresolved")) qualification = "matched-rule-requires-unresolved-outcome";
    else if (effects.size > 1) {
      outcome = "disputed";
      qualification = "proposed-rules-conflict";
    } else {
      outcome = matched[0].effect;
      qualification = "qualified-by-proposed-rules";
    }
  }
  return {
    framework: "proposed-law",
    displayLabel: "Proposed bill, not enacted law",
    proposalVersion: bill.versionId,
    proposalStatus: bill.status,
    outcome,
    qualification,
    matchedRuleIds: matched.map((rule) => rule.id),
    unknownRuleIds,
    ruleEvaluations: evaluations,
  };
}

export function compareLegalFrameworks(
  scenarioInput,
  currentRuleSet,
  authorityCatalog,
  proposedBillInput,
  proposedRuleSet = null,
) {
  const scenario = validateLegalScenario(scenarioInput);
  assert(scenario.status === "current", "Framework comparison requires one current fact scenario");
  const proposalStatus = validateProposedBill(proposedBillInput);
  const bill = structuredClone(proposedBillInput);
  const current = {
    framework: "current-law",
    displayLabel: "Current United States law",
    ...evaluateCurrentLaw(scenario, currentRuleSet, authorityCatalog),
  };
  let proposed;
  if (!proposalStatus.isComplete) {
    assert(proposedRuleSet === null || proposedRuleSet === undefined,
      "Incomplete proposal cannot have operative rules");
    proposed = {
      framework: "proposed-law",
      displayLabel: proposalStatus.displayLabel,
      proposalVersion: proposalStatus.version,
      proposalStatus: proposalStatus.status,
      outcome: "unresolved",
      qualification: "authoritative-proposal-unavailable",
      matchedRuleIds: [],
      unknownRuleIds: [],
      ruleEvaluations: [],
    };
  } else {
    proposed = evaluateApprovedProposal(scenario, proposedRuleSet, bill);
  }
  const differences = current.outcome === proposed.outcome ? [] : [{
    field: "outcome",
    current: current.outcome,
    proposed: proposed.outcome,
    cause: "rule-framework",
  }];
  return deepFreeze({
    schemaVersion: "1.0.0",
    scenario: {
      id: scenario.id,
      jurisdiction: scenario.jurisdiction,
      evaluationDate: scenario.evaluationDate,
      facts: structuredClone(scenario.facts),
    },
    current,
    proposed,
    differences,
  });
}
