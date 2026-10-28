import type {MusicalExample,MusicalPatternModel} from './classifier.mjs';
import type {MelodyNote} from './melody.mjs';
export interface MusicalExpressionComparison {
 readonly algorithm:'musical-expression-comparison-v1';
 readonly relationship:'direct-replay'|'transformed-pattern'|'new-sequence';
 readonly exactReplayIds:readonly string[];
 readonly transformedPatternIds:readonly string[];
 readonly nearestStoredExample:{readonly id:string;readonly distance:number};
 readonly generalizedPattern:{readonly label:string;readonly confidence:number;readonly origin:string};
 readonly disclosure:string;
 readonly source:string;
}
export function compareMusicalExpression(model:MusicalPatternModel,authoredExamples:readonly MusicalExample[],candidateNotes:readonly MelodyNote[],candidateTempo?:number):MusicalExpressionComparison;
