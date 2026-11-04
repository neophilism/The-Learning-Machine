const REQUIRED_AUTHORITIES = new Map([
  ["access-control", "usc17-1201-f-"],
  ["unauthorized-access", "usc18-1030"],
  ["communications-privacy", "usc18-2511"],
  ["trade-secrets", "usc18-1836"],
]);
const COPYRIGHT_OUTCOMES = new Set([
  "permit", "restrict", "conditional", "unresolved", "disputed",
]);

const assert = (condition, message) => {
  if (!condition) throw new TypeError(message);
};
const plain = (value) => value !== null && typeof value === "object" &&
  !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const exact = (value, fields, label) => {
  assert(plain(value), label + " must be a plain object");
  const keys = Object.keys(value);
  assert(keys.length === fields.length && keys.every((key) => fields.includes(key)),
    "Invalid " + label + " fields");
};
const text = (value, label, maximum = 500) => {
  assert(typeof value === "string" && value.trim().length > 0 && value.length <= maximum,
    "Invalid " + label);
  return value;
};
const tri = (value, label) => {
  assert(value === null || typeof value === "boolean", "Invalid " + label);
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
  return new Map([...REQUIRED_AUTHORITIES].map(([regime, id]) => {
    const authority = index.get(id);
    assert(plain(authority), "Required independent-limit authority is missing");
    assert(typeof authority.citation === "string" &&
      typeof authority.scopeLimitations === "string" &&
      /^https:\/\//.test(authority.sourceUrl), "Independent-limit authority is invalid");
    assert(authority.issuedOn === null ||
      validDate(authority.issuedOn) && authority.issuedOn <= evaluationDate,
    "Independent-limit authority is unavailable on the evaluation date");
    return [regime, sourceView(authority)];
  }));
}

const paired = (activity, authorization) => {
  if (activity === false) return "not-indicated-by-fixture";
  if (activity === null || authorization === null) return "unresolved-material-facts";
  return authorization ? "not-indicated-by-fixture" : "restriction-indicated";
};
const tradeSecret = (claimed, improper) => {
  if (claimed === false || improper === false) return "not-indicated-by-fixture";
  if (claimed === null || improper === null) return "unresolved-material-facts";
  return "restriction-indicated";
};

export function evaluateIndependentLimits(input, catalog) {
  exact(input, ["schemaVersion", "scenarioId", "evaluationDate", "copyrightEvaluation", "facts"],
    "independent-limits input");
  assert(input.schemaVersion === "1.0.0", "Unsupported independent-limits schema");
  assert(/^[a-z0-9][a-z0-9-]{0,127}$/.test(text(input.scenarioId, "scenario ID", 128)),
    "Invalid scenario ID");
  assert(validDate(input.evaluationDate), "Invalid evaluation date");
  exact(input.copyrightEvaluation,
    ["outcome", "qualification", "matchedRuleIds", "unknownRuleIds"],
    "copyright evaluation");
  assert(COPYRIGHT_OUTCOMES.has(input.copyrightEvaluation.outcome),
    "Unsupported copyright outcome");
  text(input.copyrightEvaluation.qualification, "copyright qualification");
  for (const field of ["matchedRuleIds", "unknownRuleIds"]) {
    assert(Array.isArray(input.copyrightEvaluation[field]) &&
      input.copyrightEvaluation[field].length <= 100, "Invalid " + field);
    assert(new Set(input.copyrightEvaluation[field]).size ===
      input.copyrightEvaluation[field].length, "Duplicate " + field);
    input.copyrightEvaluation[field].forEach((id) => text(id, field + " entry", 128));
  }
  const factNames = [
    "accessControlCircumvented", "section1201ExceptionEstablished",
    "protectedComputerAccessed", "accessAuthorized",
    "communicationIntercepted", "interceptionAuthorized",
    "personalDataProcessed", "privacyAuthorizationOrLegalBasisEstablished",
    "contractRestrictionApplies", "plannedUseCompliesWithContract",
    "confidentialityDutyApplies", "plannedUseCompliesWithConfidentialityDuty",
    "tradeSecretClaimed", "improperAcquisitionUseOrDisclosure",
  ];
  exact(input.facts, factNames, "independent-limit facts");
  for (const name of factNames) tri(input.facts[name], name);
  const authority = sources(catalog, input.evaluationDate);
  const facts = input.facts;
  let accessControlStatus;
  if (facts.accessControlCircumvented === false) {
    accessControlStatus = "not-indicated-by-fixture";
  } else if (facts.accessControlCircumvented === null ||
    facts.section1201ExceptionEstablished === null) {
    accessControlStatus = "unresolved-material-facts";
  } else {
    accessControlStatus = facts.section1201ExceptionEstablished
      ? "exception-facts-require-separate-review"
      : "restriction-indicated";
  }
  const assessments = [
    {
      regime: "access-control",
      status: accessControlStatus,
      source: authority.get("access-control"),
      caveat: "A copyright exception does not itself authorize circumvention; Section 1201 exceptions are narrow and separately evaluated.",
    },
    {
      regime: "unauthorized-access",
      status: paired(facts.protectedComputerAccessed, facts.accessAuthorized),
      source: authority.get("unauthorized-access"),
      caveat: "Copyright permission does not itself authorize access to a protected computer.",
    },
    {
      regime: "communications-privacy",
      status: paired(facts.communicationIntercepted, facts.interceptionAuthorized),
      source: authority.get("communications-privacy"),
      caveat: "Copyright permission does not itself authorize interception of communications.",
    },
    {
      regime: "privacy",
      status: paired(facts.personalDataProcessed,
        facts.privacyAuthorizationOrLegalBasisEstablished),
      source: null,
      caveat: "This fixture does not select a governing privacy law; personal-data authority and legal basis require separate jurisdiction-specific review.",
    },
    {
      regime: "contract",
      status: paired(facts.contractRestrictionApplies,
        facts.plannedUseCompliesWithContract),
      source: null,
      caveat: "Contract scope, enforceability and remedies require separate governing-law and terms review.",
    },
    {
      regime: "confidentiality",
      status: paired(facts.confidentialityDutyApplies,
        facts.plannedUseCompliesWithConfidentialityDuty),
      source: null,
      caveat: "Confidentiality duties and remedies are independent of the copyright result and require separate evidence.",
    },
    {
      regime: "trade-secrets",
      status: tradeSecret(facts.tradeSecretClaimed,
        facts.improperAcquisitionUseOrDisclosure),
      source: authority.get("trade-secrets"),
      caveat: "A trade-secret claim still requires its own elements and acquisition, use or disclosure analysis.",
    },
  ];
  const indicated = assessments.filter((item) => item.status === "restriction-indicated")
    .map((item) => item.regime);
  const unresolved = assessments.filter((item) =>
    item.status === "unresolved-material-facts" ||
    item.status === "exception-facts-require-separate-review").map((item) => item.regime);
  const overall = indicated.length > 0
    ? "independent-limit-indicated"
    : unresolved.length > 0
      ? "independent-limits-unresolved"
      : "no-independent-limit-indicated-by-fixture";
  return deepFreeze({
    schemaVersion: "1.0.0",
    scenarioId: input.scenarioId,
    evaluationDate: input.evaluationDate,
    copyrightEvaluation: structuredClone(input.copyrightEvaluation),
    overall,
    indicatedRegimes: indicated,
    unresolvedRegimes: unresolved,
    assessments,
    axesIndependent: true,
  });
}
