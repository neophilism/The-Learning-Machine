import type {LearningNode} from '@learning-machine/contracts';
export interface CompiledLearningModule {readonly schemaVersion:string;readonly lessonId:string;readonly digest:string;readonly startNodeId:string;readonly concepts:readonly string[];readonly terminalNodeIds:readonly string[];readonly nodes:readonly (LearningNode & {edges:Array<{to:string;when:'always'|'correct'|'retry'|'alternative'|'on_request'}>})[];}
export declare class LessonCompileError extends Error {}
export function compileLearningModule(value:unknown):CompiledLearningModule;
export function nextCandidates(compiled:CompiledLearningModule,nodeId:string):Array<{to:string;when:string}>;
