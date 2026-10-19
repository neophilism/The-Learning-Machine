import type {CompiledLearningModule} from '@learning-machine/content';
import type {LearningSession} from './engine.mjs';
export function selectSocraticQuestion(compiled:CompiledLearningModule,session:LearningSession):{readonly id:string;readonly text:string;readonly nodeId:string;readonly source:'authored-lesson';readonly matchedCondition:string};
