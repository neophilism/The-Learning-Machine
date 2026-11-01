import type { CurrentLawEvaluation, LegalEvaluationOutcome } from "./evaluator.mjs";

export interface LegalPrecedenceDecision {
  id: string;
  higherRuleId: string;
  lowerRuleIds: string[];
  sourceIds: string[];
  rationale: string;
}
export interface LegalPrecedenceOracle {
  schemaVersion: "1.0.0";
  id: string;
  decisions: LegalPrecedenceDecision[];
}
export interface ConflictResolution extends CurrentLawEvaluation {
  baseOutcome: LegalEvaluationOutcome;
  winningRuleIds: string[];
  appliedPrecedenceIds: string[];
}
export function resolveLegalConflict(
  evaluation: CurrentLawEvaluation,
  precedence: LegalPrecedenceOracle,
): Readonly<ConflictResolution>;
