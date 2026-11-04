const SETTINGS = new Set(["nonprofit-school", "private-tutoring", "for-profit-school", "unclassified"]);
const MODES = new Set(["face-to-face", "live-transmission", "recorded", "other"]);
const USES = new Set(["performance", "display", "copying", "other"]);
const REQUIRED_AUTHORITIES = ["usc17-106", "usc17-107", "usc17-110"];

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
  return REQUIRED_AUTHORITIES.map((id) => {
    const authority = index.get(id);
    assert(plain(authority), "Required education authority is missing");
    assert(typeof authority.citation === "string" &&
      typeof authority.scopeLimitations === "string" &&
      /^https:\/\//.test(authority.sourceUrl), "Education authority is invalid");
    assert(authority.issuedOn === null ||
      validDate(authority.issuedOn) && authority.issuedOn <= evaluationDate,
    "Education authority is unavailable on the evaluation date");
    return sourceView(authority);
  });
}

function validateScenario(input) {
  assert(plain(input), "Education lesson input must be a plain object");
  assert(input.schemaVersion === "1.0.0", "Unsupported education lesson schema");
  assert(typeof input.scenarioId === "string" &&
    /^[a-z0-9][a-z0-9-]{0,127}$/.test(input.scenarioId), "Invalid scenario ID");
  assert(validDate(input.evaluationDate), "Invalid evaluation date");
  assert(SETTINGS.has(input.setting), "Invalid teaching setting");
  assert(plain(input.facts), "Education facts must be a plain object");
  const facts = input.facts;
  assert(MODES.has(facts.instructionMode), "Invalid instruction mode");
  assert(USES.has(facts.workUse), "Invalid work use");
  for (const key of [
    "institutionNonprofit", "instructorOrPupil", "classroomOrSimilarPlace",
    "audiovisualWork", "copyLawfullyMade", "responsiblePersonKnewOrHadReasonCopyUnlawful",
    "publicAudience", "commercialPurpose",
  ]) {
    assert(facts[key] === null || typeof facts[key] === "boolean", "Invalid " + key + " evidence");
  }
  if (input.setting === "nonprofit-school" && facts.institutionNonprofit !== null) {
    assert(facts.institutionNonprofit === true, "Nonprofit setting conflicts with institution status");
  }
  if (input.setting === "for-profit-school" && facts.institutionNonprofit !== null) {
    assert(facts.institutionNonprofit === false, "For-profit setting conflicts with institution status");
  }
  return input;
}

function validateBill(input) {
  assert(plain(input), "Proposed bill record must be a plain object");
  assert(input.schemaVersion === "1.0.0" && input.documentKind === "proposed-bill",
    "Invalid proposed bill record");
  assert(typeof input.status === "string" && typeof input.authoritativeFullText === "boolean" &&
    typeof input.enactedLaw === "boolean" && Array.isArray(input.provisions),
  "Invalid proposed bill status");
  assert(input.enactedLaw === false, "Education lesson requires a non-enacted proposal record");
  return input;
}

export function evaluateEducationLesson(input, catalog, billInput) {
  const scenario = validateScenario(input);
  const bill = validateBill(billInput);
  const authoritySources = sources(catalog, scenario.evaluationDate);
  const facts = scenario.facts;

  const relevantUse = facts.workUse === "performance" || facts.workUse === "display";
  const audiovisualCopyAllowed = facts.audiovisualWork === false || facts.copyLawfullyMade === true ||
    (facts.copyLawfullyMade === false && facts.responsiblePersonKnewOrHadReasonCopyUnlawful === false);
  const unknownSection110Fact = [facts.institutionNonprofit, facts.instructorOrPupil,
    facts.classroomOrSimilarPlace, facts.audiovisualWork].includes(null) ||
    (facts.audiovisualWork === true && (facts.copyLawfullyMade === null ||
      (facts.copyLawfullyMade === false && facts.responsiblePersonKnewOrHadReasonCopyUnlawful === null)));
  const exactSection110Record = relevantUse && facts.instructionMode === "face-to-face" &&
    facts.institutionNonprofit === true && facts.instructorOrPupil === true &&
    facts.classroomOrSimilarPlace === true && audiovisualCopyAllowed;

  let section110Outcome = "outside-section-110-1";
  if (relevantUse && unknownSection110Fact) section110Outcome = "unresolved-material-facts";
  else if (exactSection110Record) section110Outcome = "exempt-on-cited-facts";

  let publicPerformance = "not-indicated-by-fixture";
  if (facts.publicAudience === null) publicPerformance = "unresolved-audience";
  else if (relevantUse && facts.publicAudience === true) {
    publicPerformance = section110Outcome === "exempt-on-cited-facts"
      ? "right-implicated-but-section-110-1-exemption-applies"
      : "right-implicated-authorization-or-exception-required";
  }

  const proposalOutcome = bill.authoritativeFullText === true && bill.provisions.length > 0
    ? "authoritative-proposal-requires-separate-rule-evaluation"
    : "not-evaluable-incomplete-draft";

  return deepFreeze({
    schemaVersion: "1.0.0",
    scenarioId: scenario.scenarioId,
    evaluationDate: scenario.evaluationDate,
    section110Outcome,
    fairUseOutcome: "requires-separate-four-factor-analysis",
    publicPerformance,
    proposalOutcome,
    explanation: section110Outcome === "exempt-on-cited-facts"
      ? "Section 110(1) supplies a narrow performance-or-display exemption for this complete nonprofit, face-to-face classroom fixture."
      : section110Outcome === "unresolved-material-facts"
        ? "Section 110(1) cannot be evaluated until its material teaching facts are known."
        : "This fixture does not establish the narrow Section 110(1) exemption; that does not itself decide fair use, authorization, or infringement.",
    caveats: [
      "For-profit status does not silently become nonprofit status under present Section 110(1).",
      "Educational purpose and commerciality are factors in fair-use analysis, not automatic outcomes.",
      "Live transmission, recording, copying, licensing, and other statutory exceptions require separate analysis.",
      "A proposed education expansion is hypothetical until authoritative text is loaded and is never presented as enacted law.",
    ],
    sources: authoritySources,
  });
}
