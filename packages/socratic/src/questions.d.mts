import type {CompiledLearningModule} from '@learning-machine/content';
import type {LearningSession} from './engine.mjs';
export function selectSocraticQuestion(compiled:CompiledLearningModule,session:LearningSession):{readonly id:string;readonly text:string;readonly nodeId:string;readonly source:'authored-lesson';readonly matchedCondition:string};
export function selectCounterexample(compiled:CompiledLearningModule,session:LearningSession,hypothesisId?:string):{readonly id:string;readonly prompt:string;readonly competingApproach:string;readonly hypothesisId:string;readonly matchedTerms:readonly string[];readonly source:'authored-lesson'};
