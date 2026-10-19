import type {LearningSession} from './engine.mjs';
export interface EvidenceObservation {runId:string;kind:'measured'|'computed'|'simulated'|'unknown';kindLabel:string;description:string;value:string|number|boolean|null;unit:string|null;sourceId:string|null;uncertainty:string|null}
export interface EvidencePrediction {id:string;text:string;hypothesisId:string|null;nodeId:string}
export interface EvidenceComparison {experimentId:string;predictions:readonly EvidencePrediction[];observations:readonly EvidenceObservation[];outcomes:readonly {prediction:EvidencePrediction;observations:readonly EvidenceObservation[];status:'evidence_available'|'not_yet_tested'}[];predictionSkipped:boolean;requiresInterpretation:true}
export function evidenceKindLabel(kind:string):string;
export function comparePredictionEvidence(session:LearningSession,experimentId:string):EvidenceComparison;
