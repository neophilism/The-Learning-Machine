import test from 'node:test';import assert from 'node:assert/strict';
import {addApproach,mergeApproaches} from '../packages/socratic/src/alternatives.mjs';
test('multiple valid differing hypotheses are preserved in learner order',()=>{let a=addApproach([],'Recognize the target');a=addApproach(a,'Blur entire frame');assert.equal(a.length,2);assert.match(mergeApproaches(a),/Blur entire frame/);});
test('a nonstandard but nonempty method is accepted without bias',()=>assert.equal(addApproach([],'Place a physical filter in front of the camera')[0],'Place a physical filter in front of the camera'));
test('duplicate guesses and invalid inputs fail predictably',()=>{assert.throws(()=>addApproach(['Blur everything'],'blur everything'),RangeError);assert.throws(()=>addApproach([],'  '),TypeError);});
test('bound on number of hypotheses',()=>assert.throws(()=>addApproach(['a'],'b',1),RangeError));
