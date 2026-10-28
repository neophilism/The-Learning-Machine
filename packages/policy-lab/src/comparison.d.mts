import type { LegalScenario } from "@learning-machine/contracts";
import type { CurrentLawEvaluation, LegalAuthorityCatalog, LegalEvaluationOutcome } from "./evaluator.mjs";

export interface ProposedLawEvaluation {
  framework: "proposed-law";
  displayLabel: string;
  proposalVersion: string;
  proposalStatus: "incomplete-draft" | "approved-proposal";
  outcome: LegalEvaluationOutcome;
  qualification: string;
  matchedRuleIds: string[];
  unknownRuleIds: string[];
  ruleEvaluations: Array<{
    id: string;
    applicability: "matched" | "not-matched" | "unknown";
    effect: "permit" | "restrict" | "conditional" | "unresolved";
    rationale: string;
    provisionIds: string[];
  }>;
}
export interface LegalFrameworkComparison {
  schemaVersion: "1.0.0";
  scenario: Pick<LegalScenario, "id" | "jurisdiction" | "evaluationDate" | "facts">;
  current: CurrentLawEvaluation & { framework: "current-law"; displayLabel: string };
  proposed: ProposedLawEvaluation;
  differences: Array<{
    field: "outcome";
    current: LegalEvaluationOutcome;
    proposed: LegalEvaluationOutcome;
    cause: "rule-framework";
  }>;
}
export function compareLegalFrameworks(
  scenario: LegalScenario,
  currentRuleSet: unknown,
  authorityCatalog: LegalAuthorityCatalog,
  proposedBill: unknown,
  proposedRuleSet?: unknown,
): Readonly<LegalFrameworkComparison>;
