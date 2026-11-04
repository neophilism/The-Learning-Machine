export type TeachingContext="nonprofit-school"|"private-tutoring"|"for-profit-school";
export type FactorSignal="supports"|"opposes"|"unknown";
export interface EducationLessonInput {
  schemaVersion:"1.0.0";
  scenarioId:string;
  evaluationDate:string;
  instructionMode:"historical"|"live";
  teachingContext:TeachingContext;
  facts:{
    performanceOrDisplay:boolean;
    byInstructorOrPupil:boolean;
    faceToFace:boolean;
    classroomOrSimilarPlace:boolean;
    nonprofitEducationalInstitution:boolean;
    commercial:boolean;
    audienceScope:"family-social-circle"|"class-or-public-group"|"transmitted"|"unknown";
    audiovisualCopyLawfullyMade:boolean|null;
    responsiblePersonKnewUnlawful:boolean|null;
  };
  fairUseFactors:{purpose:FactorSignal;nature:FactorSignal;amount:FactorSignal;market:FactorSignal};
}
export interface EducationLessonEvaluation {
  schemaVersion:"1.0.0";
  scenarioId:string;
  evaluationDate:string;
  instructionMode:"historical"|"live";
  teachingContext:TeachingContext;
  section110:{outcome:"applies-on-stated-facts"|"does-not-apply-on-stated-facts"|"not-implicated";reason:string};
  publicPerformance:"not-public-on-stated-audience"|"potentially-public"|"unresolved"|"not-implicated";
  fairUse:{outcome:"requires-four-factor-analysis";factors:EducationLessonInput["fairUseFactors"];commercialStatus:boolean};
  proposedExpansion:{status:"proposal-available"|"proposal-unavailable-incomplete";versionId:string;enactedLaw:boolean;notice:string};
  caveats:string[];
  sources:Array<{id:string;citation:string;issuedOn:string|null;sourceUrl:string;scopeLimitations:string}>;
}
export function evaluateEducationLesson(input:EducationLessonInput,catalog:unknown,proposal:unknown):Readonly<EducationLessonEvaluation>;
