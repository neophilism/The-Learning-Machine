export const SCHEMA_VERSION:'1.0.0';
export type LearningStage='encounter'|'hypothesis'|'prediction'|'experiment'|'observation'|'explanation'|'challenge'|'revision'|'transfer'|'reflection'|'complete';
export const STAGES:readonly LearningStage[];
export type ObservationKind='measured'|'computed'|'simulated'|'unknown';
export const OBSERVATION_KINDS:readonly ObservationKind[];
export type QuestionCondition='multiple_hypotheses'|'has_hypothesis'|'has_prediction'|'computed_observation'|'has_observation'|'no_observation'|'always';
export interface QuestionVariant {id:string;when:QuestionCondition;prompt:string}
export interface AuthoredCounterexample {id:string;prompt:string;triggerTerms:string[];competingApproach:string}\nexport interface LearningNode {id:string;stage:LearningStage;prompt:string;edges:Array<{to:string;when?:'always'|'correct'|'retry'|'alternative'|'on_request'}>;concepts?:string[];accessibleAlternative?:string;terminal?:boolean;questionVariants?:QuestionVariant[];hints?:string[];counterexamples?:AuthoredCounterexample[];}
export interface LearningModule {schemaVersion:'1.0.0';id:string;title:string;startNodeId:string;nodes:LearningNode[];concepts:string[];}
export interface Observation {schemaVersion:'1.0.0';experimentId:string;runId:string;kind:ObservationKind;description:string;value?:string|number|boolean|null;unit?:string;sourceId?:string;uncertainty?:string;}
export interface ExperimentDefinition {schemaVersion:'1.0.0';id:string;version:string;title:string;capabilities:Array<'canvas'|'audio'|'camera'|'ml'|'worker'|'keyboard'>;timeoutMs:number;}
export interface LegalScenario {schemaVersion:'1.0.0';id:string;status:'current'|'proposed'|'hypothetical';facts:Record<string,string|number|boolean|null>;sourceIds:string[];}
export interface PolicyRule {schemaVersion:'1.0.0';id:string;source:'current'|'proposed'|'learner';conditions:Array<{field:string;operator:'eq'|'neq'|'exists'|'in';value?:unknown}>;effect:'permit'|'restrict'|'conditional'|'unresolved';sourceIds:string[];}
export interface ContentRelease {schemaVersion:'1.0.0';id:string;digest:string;modules:string[];publishedAt:string;}
export function validateLearningModule(v:unknown):Readonly<LearningModule>;
export function validateObservation(v:unknown):Readonly<Observation>;
export function validateExperimentDefinition(v:unknown):Readonly<ExperimentDefinition>;
export function validateLegalScenario(v:unknown):Readonly<LegalScenario>;
export function validatePolicyRule(v:unknown):Readonly<PolicyRule>;
export function validateContentRelease(v:unknown):Readonly<ContentRelease>;
export const validators:Readonly<Record<string,(v:unknown)=>unknown>>;
export function validateContract(kind:'learningModule',v:unknown):Readonly<LearningModule>;
export function validateContract(kind:'observation',v:unknown):Readonly<Observation>;
export function validateContract(kind:'experiment',v:unknown):Readonly<ExperimentDefinition>;
export function validateContract(kind:'legalScenario',v:unknown):Readonly<LegalScenario>;
export function validateContract(kind:'policyRule',v:unknown):Readonly<PolicyRule>;
export function validateContract(kind:'release',v:unknown):Readonly<ContentRelease>;
