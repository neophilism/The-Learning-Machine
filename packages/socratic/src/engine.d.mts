import type {LearningStage,Observation} from '@learning-machine/contracts';
import type {CompiledLearningModule} from '@learning-machine/content';
export type LearningAction = {type:'RESET'|'BACK'|'SKIP'|'REQUEST_EXPLANATION'} | {type:'ANSWER',text:string} | {type:'OBSERVE',observation:Observation} | {type:'NEXT'|'CHOOSE'|'RETRY',to?:string};
export interface LearningSession {readonly sessionId:string;readonly lessonId:string;readonly releaseDigest:string;readonly nodeId:string;readonly stage:LearningStage;readonly answers:Readonly<Record<string,string>>;readonly observations:readonly Observation[];readonly skipped:readonly string[];readonly history:readonly string[];readonly actions:readonly LearningAction[];readonly complete:boolean;}
export function createLearningSession(compiled:CompiledLearningModule,sessionId?:string):LearningSession;
export function availableRoutes(compiled:CompiledLearningModule,session:LearningSession):Array<{to:string;when:string;available:boolean}>;
export function transitionLearningSession(compiled:CompiledLearningModule,session:LearningSession,action:LearningAction):LearningSession;
export function replayLearningActions(compiled:CompiledLearningModule,actions:LearningAction[],sessionId?:string):LearningSession;
