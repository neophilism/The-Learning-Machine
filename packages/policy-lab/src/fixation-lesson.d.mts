export type FixationCaseProfile="cablevision-buffer"|"mai-maintenance-ram"|"unclassified";
export interface FixationLessonInput {
  schemaVersion:"1.0.0";
  scenarioId:string;
  evaluationDate:string;
  caseProfile:FixationCaseProfile;
  facts:{
    storageKind:"buffer"|"ram"|"other";
    durationMilliseconds:number|null;
    automaticallyOverwritten:boolean|null;
    perceptible:boolean|null;
    reproducible:boolean|null;
    retainedUntilPowerOff:boolean|null;
  };
}
export interface FixationLessonEvaluation {
  schemaVersion:"1.0.0";
  scenarioId:string;
  evaluationDate:string;
  outcome:"not-fixed-on-cited-facts"|"fixed-on-cited-facts"|"unresolved";
  qualification:string;
  durationEvidenceMilliseconds:number|null;
  explanation:string;
  caveats:string[];
  sources:Array<{id:string;citation:string;issuedOn:string|null;sourceUrl:string;scopeLimitations:string}>;
}
export function evaluateFixationLesson(input:FixationLessonInput,catalog:unknown):Readonly<FixationLessonEvaluation>;
