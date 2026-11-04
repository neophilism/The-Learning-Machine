const REQUIRED_AUTHORITIES = ["usc17-1201-f-", "usc18-2511", "usc18-1836", "usc18-1839"];
const COPYRIGHT_RESULTS = new Set(["established-for-exercise", "not-established", "unknown"]);

const assert = (condition, message) => {
  if (!condition) throw new TypeError(message);
};
const plain = (value) => value !== null && typeof value === "object" &&
  !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const validDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
};
const freeze = (value) => {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};
const sourceView = (authority) => ({
  id: authority.id,
  citation: authority.citation,
  issuedOn: authority.issuedOn,
  sourceUrl: authority.sourceUrl,
  scopeLimitations: authority.scopeLimitations,
});

function sources(catalog, evaluationDate) {
  assert(plain(catalog) && catalog.jurisdiction === "United States",
    "A United States authority catalog is required");
  assert(Array.isArray(catalog.authorities), "Authority catalog is invalid");
  const index = new Map(catalog.authorities.map((authority) => [authority.id, authority]));
  return REQUIRED_AUTHORITIES.map((id) => {
    const authority = index.get(id);
    assert(plain(authority), "Required independent-regime authority is missing");
    assert(typeof authority.citation === "string" &&
      typeof authority.scopeLimitations === "string" &&
      /^https:\/\//.test(authority.sourceUrl), "Independent-regime authority is invalid");
    assert(authority.issuedOn === null ||
      validDate(authority.issuedOn) && authority.issuedOn <= evaluationDate,
    "Independent-regime authority is unavailable on the evaluation date");
    return sourceView(authority);
  });
}

function validateInput(input) {
  assert(plain(input), "Independent-caveats input must be a plain object");
  assert(input.schemaVersion === "1.0.0", "Unsupported independent-caveats schema");
  assert(typeof input.scenarioId === "string" &&
    /^[a-z0-9][a-z0-9-]{0,127}$/.test(input.scenarioId), "Invalid scenario ID");
  assert(validDate(input.evaluationDate), "Invalid evaluation date");
  assert(COPYRIGHT_RESULTS.has(input.copyrightPermission), "Invalid copyright permission result");
  assert(plain(input.facts), "Independent-regime facts must be a plain object");
  for (const key of [
    "technologicalAccessControlPresent", "circumventionAttempted", "accessAuthorized",
    "communicationIntercepted", "partyConsentEstablished", "informationConfidential",
    "reasonableSecrecyMeasures", "acquiredByImproperMeans", "useOrDisclosureOutsidePermission",
    "contractRestrictionApplies", "plannedUseCompliesWithContract",
  ]) {
    assert(input.facts[key] === null || typeof input.facts[key] === "boolean",
      "Invalid " + key + " evidence");
  }
  return input;
}

function accessOutcome(facts) {
  if (facts.technologicalAccessControlPresent === false || facts.circumventionAttempted === false) {
    return "not-indicated-by-fixture";
  }
  if (facts.technologicalAccessControlPresent === null || facts.circumventionAttempted === null ||
      facts.accessAuthorized === null) {
    return "unresolved-material-facts";
  }
  return "separate-section-1201-review-required";
}

function interceptionOutcome(facts) {
  if (facts.communicationIntercepted === false) return "not-indicated-by-fixture";
  if (facts.communicationIntercepted === null || facts.partyConsentEstablished === null) {
    return "unresolved-material-facts";
  }
  return "separate-interception-review-required";
}

function confidentialityOutcome(facts) {
  if (facts.informationConfidential === false) return "not-indicated-by-fixture";
  if (facts.informationConfidential === null || facts.reasonableSecrecyMeasures === null ||
      facts.acquiredByImproperMeans === null || facts.useOrDisclosureOutsidePermission === null) {
    return "unresolved-material-facts";
  }
  if (facts.reasonableSecrecyMeasures &&
      (facts.acquiredByImproperMeans || facts.useOrDisclosureOutsidePermission)) {
    return "separate-trade-secret-review-required";
  }
  return "confidentiality-review-required";
}

function contractOutcome(facts) {
  if (facts.contractRestrictionApplies === false) return "not-indicated-by-fixture";
  if (facts.contractRestrictionApplies === null ||
      facts.plannedUseCompliesWithContract === null) return "unresolved-material-facts";
  return facts.plannedUseCompliesWithContract
    ? "no-conflict-indicated-by-fixture"
    : "separate-contract-review-required";
}

export function evaluateIndependentLegalCaveats(input, catalog) {
  const scenario = validateInput(input);
  const authoritySources = sources(catalog, scenario.evaluationDate);
  const section1201Outcome = accessOutcome(scenario.facts);
  const interceptionPrivacyOutcome = interceptionOutcome(scenario.facts);
  const confidentialityTradeSecretOutcome = confidentialityOutcome(scenario.facts);
  const contractOutcomeValue = contractOutcome(scenario.facts);
  const results = [
    section1201Outcome, interceptionPrivacyOutcome,
    confidentialityTradeSecretOutcome, contractOutcomeValue,
  ];

  return freeze({
    schemaVersion: "1.0.0",
    scenarioId: scenario.scenarioId,
    evaluationDate: scenario.evaluationDate,
    copyrightPermission: scenario.copyrightPermission,
    section1201Outcome,
    interceptionPrivacyOutcome,
    confidentialityTradeSecretOutcome,
    contractOutcome: contractOutcomeValue,
    independentReviewRequired: results.some((result) => result.includes("review-required")),
    explanation: "Copyright authorization or an exception does not itself authorize circumvention, interception, contract breach, or misuse of confidential information.",
    caveats: [
      "Each result is an issue-spotting classification, not a finding of liability or a complete legal analysis.",
      "Section 1201 exceptions are narrow and do not authorize intrusion or violations of other law.",
      "Consent, authorization, secrecy measures, improper means, duties, remedies, defenses, and applicable state law require separate evidence.",
      "Unknown material facts stay unresolved and are never converted into permission.",
    ],
    sources: authoritySources,
  });
}
