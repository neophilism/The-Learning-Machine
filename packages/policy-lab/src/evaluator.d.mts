import type { LegalScenario } from "@learning-machine/contracts";

export interface LegalAuthority {
  id: string;
  citation: string;
  issuedOn: string | null;
  sourceUrl: string;
  scopeLimitations: string;
  [key: string]: unknown;
}
export interface LegalAuthorityCatalog {
  jurisdiction: "United States";
  sourceBaseline: { asOf: string; [key: string]: unknown };
  authorities: LegalAuthority[];
  [key: string]: unknown;
}
export type LegalEvaluationOutcome =
  | "permit"
  | "restrict"
  | "conditional"
  | "unresolved"
  | "disputed";
export interface LegalRuleEvaluation {
  id: string;
  applicability: "matched" | "not-matched" | "unknown";
  effect: "permit" | "restrict" | "conditional" | "unresolved";
  rationale: string;
  sources: Array<Pick<LegalAuthority,
    "id" | "citation" | "issuedOn" | "sourceUrl" | "scopeLimitations">>;
}
export interface CurrentLawEvaluation {
  schemaVersion: "1.0.0";
  scenarioId: string;
  evaluationDate: string;
  sourceBaselineAsOf: string;
  outcome: LegalEvaluationOutcome;
  qualification: string;
  matchedRuleIds: string[];
  unknownRuleIds: string[];
  ruleEvaluations: LegalRuleEvaluation[];
}
export function evaluateCurrentLaw(
  scenario: LegalScenario,
  ruleSet: unknown,
  authorityCatalog: LegalAuthorityCatalog,
): Readonly<CurrentLawEvaluation>;
