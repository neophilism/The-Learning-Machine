export type EducationSetting = "nonprofit-school" | "private-tutoring" | "for-profit-school" | "unclassified";
export interface EducationLessonInput {
  schemaVersion: "1.0.0";
  scenarioId: string;
  evaluationDate: string;
  setting: EducationSetting;
  facts: {
    instructionMode: "face-to-face" | "live-transmission" | "recorded" | "other";
    workUse: "performance" | "display" | "copying" | "other";
    institutionNonprofit: boolean | null;
    instructorOrPupil: boolean | null;
    classroomOrSimilarPlace: boolean | null;
    audiovisualWork: boolean | null;
    copyLawfullyMade: boolean | null;
    responsiblePersonKnewCopyUnlawful: boolean | null;
    publicAudience: boolean | null;
    commercialPurpose: boolean | null;
  };
}
export interface EducationLessonEvaluation {
  schemaVersion: "1.0.0";
  scenarioId: string;
  evaluationDate: string;
  section110Outcome: "exempt-on-cited-facts" | "outside-section-110-1" | "unresolved-material-facts";
  fairUseOutcome: "requires-separate-four-factor-analysis";
  publicPerformance: string;
  proposalOutcome: "not-evaluable-incomplete-draft" | "authoritative-proposal-requires-separate-rule-evaluation";
  explanation: string;
  caveats: string[];
  sources: Array<{ id: string; citation: string; issuedOn: string | null; sourceUrl: string; scopeLimitations: string }>;
}
export function evaluateEducationLesson(input: EducationLessonInput, catalog: unknown, bill: unknown): Readonly<EducationLessonEvaluation>;
