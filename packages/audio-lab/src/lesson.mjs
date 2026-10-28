import {trainMusicalPatternClassifier,evaluateMusicalHoldout,classifyMusicalPattern} from './classifier.mjs';
import {compareMusicalExpression} from './comparison.mjs';

const melody=(id,label,pitches,tempo=110)=>Object.freeze({id,label,tempo,notes:Object.freeze(pitches.map(pitch=>Object.freeze({pitch,beats:1})))});
export const MUSIC_LESSON_EXAMPLES=Object.freeze([
 melody('rise-train-1','rising',['C4','D4','E4','G4']),
 melody('rise-train-2','rising',['D4','E4','G4','A4'],120),
 melody('rise-holdout-1','rising',['C4','E4','F4','A4'],100),
 melody('rise-holdout-2','rising',['D4','F4','G4','C5'],130),
 melody('fall-train-1','falling',['C5','A4','G4','E4']),
 melody('fall-train-2','falling',['B4','G4','F4','D4'],120),
 melody('fall-holdout-1','falling',['A4','G4','E4','C4'],100),
 melody('fall-holdout-2','falling',['C5','G4','F4','D4'],130)
]);
export const MUSIC_LESSON_SPLIT=Object.freeze({
 trainIds:Object.freeze(['rise-train-1','rise-train-2','fall-train-1','fall-train-2']),
 testIds:Object.freeze(['rise-holdout-1','rise-holdout-2','fall-holdout-1','fall-holdout-2'])
});
export const MUSIC_LESSON_CANDIDATES=Object.freeze([
 melody('transfer-rise',null,['C4','D4','F4','A4'],115),
 melody('transfer-fall',null,['C5','B4','G4','E4'],105)
]);

function candidateById(id){
 const candidate=MUSIC_LESSON_CANDIDATES.find(value=>value.id===id);
 if(!candidate)throw new TypeError('Unknown lesson candidate');
 return candidate;
}
function validatePrediction(value){
 if(value!=='rising'&&value!=='falling')throw new TypeError('Prediction must be rising or falling');
 return value;
}
export function runMusicLearningExperiment({prediction,candidateId}){
 const committedPrediction=validatePrediction(prediction),candidate=candidateById(candidateId);
 const model=trainMusicalPatternClassifier(MUSIC_LESSON_EXAMPLES,MUSIC_LESSON_SPLIT);
 const heldOut=evaluateMusicalHoldout(model,MUSIC_LESSON_EXAMPLES,MUSIC_LESSON_SPLIT);
 const inference=classifyMusicalPattern(model,candidate.notes,candidate.tempo);
 const comparison=compareMusicalExpression(model,MUSIC_LESSON_EXAMPLES,candidate.notes,candidate.tempo);
 return Object.freeze({
  candidateId,committedPrediction,inference,heldOut,comparison,
  predictionMatched:committedPrediction===inference.predictedLabel,
  evidence:'computed-after-committed-prediction'
 });
}
export function recordMusicRevision(experiment,text){
 if(!experiment||experiment.evidence!=='computed-after-committed-prediction')throw new TypeError('Expected completed music experiment');
 if(typeof text!=='string'||text.trim().length<3||text.trim().length>500)throw new RangeError('Revision must contain 3–500 characters');
 return Object.freeze({experiment,revision:text.trim(),recordedAfterObservation:true});
}
export function runMusicTransfer(revision,candidateId){
 if(!revision?.recordedAfterObservation)throw new TypeError('Transfer requires a recorded revision');
 if(candidateId===revision.experiment.candidateId)throw new RangeError('Transfer requires a different melody');
 const candidate=candidateById(candidateId),model=trainMusicalPatternClassifier(MUSIC_LESSON_EXAMPLES,MUSIC_LESSON_SPLIT);
 const inference=classifyMusicalPattern(model,candidate.notes,candidate.tempo);
 return Object.freeze({candidateId,inference,revision:revision.revision,complete:true,agreementRequired:false,evidence:'computed-on-distinct-unseen-melody'});
}
