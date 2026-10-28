import test from 'node:test';
import assert from 'node:assert/strict';
import {MUSIC_LESSON_SPLIT,recordMusicRevision,runMusicLearningExperiment,runMusicTransfer} from '../src/lesson.mjs';

test('prediction is committed before computed held-out and unseen evidence',()=>{
 const result=runMusicLearningExperiment({prediction:'falling',candidateId:'transfer-rise'});
 assert.equal(result.committedPrediction,'falling');
 assert.equal(result.evidence,'computed-after-committed-prediction');
 assert.deepEqual(result.heldOut.predictions.map(row=>row.id),MUSIC_LESSON_SPLIT.testIds);
 assert.equal(result.comparison.relationship,'new-sequence');
 assert.equal(result.predictionMatched,result.inference.predictedLabel==='falling');
});

test('revision and distinct transfer complete without requiring agreement',()=>{
 const observed=runMusicLearningExperiment({prediction:'falling',candidateId:'transfer-rise'});
 const revised=recordMusicRevision(observed,'Intervals and direction may matter more than my first guess.');
 const transfer=runMusicTransfer(revised,'transfer-fall');
 assert.equal(transfer.complete,true);
 assert.equal(transfer.agreementRequired,false);
 assert.equal(transfer.evidence,'computed-on-distinct-unseen-melody');
});

test('lesson fails closed on missing stages and reused transfer examples',()=>{
 assert.throws(()=>runMusicLearningExperiment({prediction:'maybe',candidateId:'transfer-rise'}),TypeError);
 const observed=runMusicLearningExperiment({prediction:'rising',candidateId:'transfer-rise'});
 assert.throws(()=>recordMusicRevision(observed,'  '),RangeError);
 const revised=recordMusicRevision(observed,'I will test direction on a different melody.');
 assert.throws(()=>runMusicTransfer(revised,'transfer-rise'),RangeError);
 assert.throws(()=>runMusicTransfer(revised,'missing'),TypeError);
});
