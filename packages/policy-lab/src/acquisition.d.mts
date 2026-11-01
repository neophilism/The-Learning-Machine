export type AcquisitionMethod = "purchase" | "borrow" | "stream" | "pirated-copy";
export type AuthorizationFinding = "confirmed" | "denied" | "unknown";
export type AcquisitionAssessment = "lawful" | "unauthorized" | "unresolved";
export type LearningUseOutcome =
  | "permit"
  | "restrict"
  | "conditional"
  | "unresolved"
  | "disputed";

export interface AcquisitionExerciseInput {
  schemaVersion: "1.0.0";
  id: string;
  acquisition: {
    method: AcquisitionMethod;
    evidence: {
      id: string;
      kind: "receipt" | "loan-record" | "license-record" | "unauthorized-copy-record";
      authorization: AuthorizationFinding;
      description: string;
      sourceId: string;
    };
  };
  learningEvaluation: {
    scenarioId: string;
    outcome: LearningUseOutcome;
    qualification: string;
    matchedRuleIds: string[];
    unknownRuleIds: string[];
  };
}
export interface AcquisitionExerciseResult {
  schemaVersion: "1.0.0";
  id: string;
  acquisition: AcquisitionExerciseInput["acquisition"] & {
    accessAssessment: AcquisitionAssessment;
  };
  learningUse: AcquisitionExerciseInput["learningEvaluation"];
  axesIndependent: true;
}
export function evaluateAcquisitionExercise(
  input: AcquisitionExerciseInput,
): Readonly<AcquisitionExerciseResult>;
