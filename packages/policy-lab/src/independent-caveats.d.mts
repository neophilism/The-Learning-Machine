export type TriState = boolean | null;
export interface IndependentLegalCaveatsInput {
  schemaVersion: "1.0.0";
  scenarioId: string;
  evaluationDate: string;
  copyrightPermission: "established-for-exercise" | "not-established" | "unknown";
  facts: {
    technologicalAccessControlPresent: TriState;
    circumventionAttempted: TriState;
    accessAuthorized: TriState;
    communicationIntercepted: TriState;
    partyConsentEstablished: TriState;
    informationConfidential: TriState;
    reasonableSecrecyMeasures: TriState;
    acquiredByImproperMeans: TriState;
    useOrDisclosureOutsidePermission: TriState;
    contractRestrictionApplies: TriState;
    plannedUseCompliesWithContract: TriState;
  };
}
export interface IndependentLegalCaveatsEvaluation {
  schemaVersion: "1.0.0";
  scenarioId: string;
  evaluationDate: string;
  copyrightPermission: IndependentLegalCaveatsInput["copyrightPermission"];
  section1201Outcome: string;
  interceptionPrivacyOutcome: string;
  confidentialityTradeSecretOutcome: string;
  contractOutcome: string;
  independentReviewRequired: boolean;
  explanation: string;
  caveats: string[];
  sources: Array<{
    id: string;
    citation: string;
    issuedOn: string | null;
    sourceUrl: string;
    scopeLimitations: string;
  }>;
}
export function evaluateIndependentLegalCaveats(
  input: IndependentLegalCaveatsInput,
  catalog: unknown,
): Readonly<IndependentLegalCaveatsEvaluation>;
