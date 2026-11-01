const METHODS = new Map([
  ["purchase", "receipt"],
  ["borrow", "loan-record"],
  ["stream", "license-record"],
  ["pirated-copy", "unauthorized-copy-record"],
]);
const AUTHORIZATION = new Set(["confirmed", "denied", "unknown"]);
const USE_OUTCOMES = new Set(["permit", "restrict", "conditional", "unresolved", "disputed"]);

const assert = (condition, message) => {
  if (!condition) throw new TypeError(message);
};
const plain = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const exactKeys = (value, keys, label) => {
  assert(plain(value), label + " must be a plain object");
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  assert(actual.length === expected.length &&
    actual.every((key, index) => key === expected[index]), "Invalid " + label + " fields");
};
const boundedText = (value, label, maximum = 500) => {
  assert(typeof value === "string" && value.trim().length > 0 && value.length <= maximum,
    "Invalid " + label);
  return value;
};
const identifier = (value, label) => {
  boundedText(value, label, 128);
  assert(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value), "Invalid " + label);
  return value;
};
const deepFreeze = (value) => {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};

function assessAcquisition(acquisition) {
  exactKeys(acquisition, ["method", "evidence"], "acquisition");
  assert(METHODS.has(acquisition.method), "Unsupported acquisition method");
  const evidence = acquisition.evidence;
  exactKeys(evidence, ["id", "kind", "authorization", "description", "sourceId"],
    "acquisition evidence");
  identifier(evidence.id, "evidence ID");
  identifier(evidence.sourceId, "evidence source ID");
  boundedText(evidence.description, "evidence description", 1000);
  assert(evidence.kind === METHODS.get(acquisition.method),
    "Evidence kind does not match acquisition method");
  assert(AUTHORIZATION.has(evidence.authorization), "Unsupported authorization finding");
  if (acquisition.method === "pirated-copy") {
    assert(evidence.authorization === "denied",
      "Pirated-copy exercise requires explicit unauthorized-source evidence");
  }
  return {
    method: acquisition.method,
    evidence: {...evidence},
    accessAssessment: evidence.authorization === "confirmed"
      ? "lawful"
      : evidence.authorization === "denied" ? "unauthorized" : "unresolved",
  };
}

function preserveLearningEvaluation(evaluation) {
  exactKeys(evaluation,
    ["scenarioId", "outcome", "qualification", "matchedRuleIds", "unknownRuleIds"],
    "learning-use evaluation");
  identifier(evaluation.scenarioId, "learning scenario ID");
  assert(USE_OUTCOMES.has(evaluation.outcome), "Unsupported learning-use outcome");
  boundedText(evaluation.qualification, "learning-use qualification", 500);
  for (const key of ["matchedRuleIds", "unknownRuleIds"]) {
    assert(Array.isArray(evaluation[key]) && evaluation[key].length <= 100,
      "Invalid " + key);
    const unique = new Set(evaluation[key].map((id) => identifier(id, key + " entry")));
    assert(unique.size === evaluation[key].length, "Duplicate " + key + " entry");
  }
  return {
    scenarioId: evaluation.scenarioId,
    outcome: evaluation.outcome,
    qualification: evaluation.qualification,
    matchedRuleIds: [...evaluation.matchedRuleIds],
    unknownRuleIds: [...evaluation.unknownRuleIds],
  };
}

/**
 * Builds a two-axis teaching result. Acquisition evidence never decides the
 * legal learning-use evaluation, and the learning-use result never rewrites
 * how the material was obtained.
 */
export function evaluateAcquisitionExercise(input) {
  exactKeys(input, ["schemaVersion", "id", "acquisition", "learningEvaluation"],
    "acquisition exercise");
  assert(input.schemaVersion === "1.0.0", "Unsupported acquisition exercise version");
  const result = {
    schemaVersion: "1.0.0",
    id: identifier(input.id, "exercise ID"),
    acquisition: assessAcquisition(input.acquisition),
    learningUse: preserveLearningEvaluation(input.learningEvaluation),
    axesIndependent: true,
  };
  return deepFreeze(result);
}
