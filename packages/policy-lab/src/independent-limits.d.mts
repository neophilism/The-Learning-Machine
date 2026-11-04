export type IndependentLimitStatus =
  | "restriction-indicated"
  | "not-indicated-by-fixture"
  | "unresolved-material-facts"
  | "exception-facts-require-separate-review";
export interface IndependentLimitsInput {
  schemaVersion: "1.0.0";
  scenarioId: string;
  evaluationDate: string;
  copyrightEvaluation: {
    outcome: "permit" | "restrict" | "conditional" | "unresolved" | "disputed";
    qualification: string;
    matchedRuleIds: string[];
    unknownRuleIds: string[];
  };
  facts: {
    accessControlCircumvented: boolean | null;
    section1201ExceptionEstablished: boolean | null;
    protectedComputerAccessed: boolean | null;
    accessAuthorized: boolean | null;
    communicationIntercepted: boolean | null;
    interceptionAuthorized: boolean | null;
    personalDataProcessed: boolean | null;
    privacyAuthorizationOrLegalBasisEstablished: boolean | null;
    contractRestrictionBreached: boolean | null;
    confidentialityDutyBreached: boolean | null;
    tradeSecretClaimed: boolean | null;
    improperAcquisitionUseOrDisclosure: boolean | null;
  };
}
export interface IndependentLimitsResult {
  schemaVersion: "1.0.0";
  scenarioId: string;
  evaluationDate: string;
  copyrightEvaluation: IndependentLimitsInput["copyrightEvaluation"];
  overall:
    | "independent-limit-indicated"
    | "independent-limits-unresolved"
    | "no-independent-limit-indicated-by-fixture";
  indicatedRegimes: string[];
  unresolvedRegimes: string[];
  assessments: Array<{
    regime: string;
    status: IndependentLimitStatus;
    source: null | {
      id: string;
      citation: string;
      issuedOn: string | null;
      sourceUrl: string;
      scopeLimitations: string;
    };
    caveat: string;
  }>;
  axesIndependent: true;
}
export function evaluateIndependentLimits(
  input: IndependentLimitsInput,
  catalog: unknown,
): Readonly<IndependentLimitsResult>;
