import type {ShapeDataset,DrawingPixels} from './dataset.mjs';
import type {HoldoutSplit} from './split.mjs';
export interface LinearModel {readonly algorithm:'multiclass-softmax-sgd-v1';readonly labels:readonly string[];readonly weights:readonly (readonly number[])[];readonly bias:readonly number[];readonly epochs:number;readonly learningRate:number;
 readonly trainingExampleIds:readonly string[];readonly heldOutExampleCount:number;readonly initialTrainingLoss:number;readonly history:readonly {readonly epoch:number;readonly loss:number;readonly trainingAccuracy:number}[];
 readonly inputShape:readonly number[];readonly source:string;}
export function trainLinearClassifier(dataset:ShapeDataset,split:HoldoutSplit,options?:{epochs?:number;learningRate?:number}):LinearModel;
export function classifyDrawing(model:LinearModel,pixels:DrawingPixels):{readonly predictedLabel:string;readonly confidence:number;readonly classScores:readonly {readonly label:string;readonly probability:number}[];readonly origin:string};

export interface DrawingPrediction {readonly predictedLabel:string;readonly confidence:number;readonly classScores:readonly {readonly label:string;readonly probability:number}[];readonly origin:string;}
export interface ClassificationMetrics {readonly algorithm:'confusion-matrix-v1';readonly labels:readonly string[];readonly matrix:readonly (readonly number[])[];readonly exampleCount:number;readonly source:string;
 readonly perClass:readonly {readonly label:string;readonly truePositive:number;readonly actualCount:number;readonly predictedCount:number;readonly precision:number|null;readonly recall:number|null}[];}
export function summarizeClassificationMetrics(labels:readonly string[],predictions:readonly {readonly actualLabel:string;readonly predictedLabel:string}[]):ClassificationMetrics;

export interface HoldoutEvaluation {readonly algorithm:'heldout-inference-v1';readonly exampleCount:number;readonly correctCount:number;readonly accuracy:number;
 readonly predictions:readonly {readonly id:string;readonly actualLabel:string;readonly predictedLabel:string;readonly confidence:number;readonly classScores:DrawingPrediction['classScores'];readonly correct:boolean;readonly origin:string}[];
 readonly metrics:ClassificationMetrics;readonly trainingExampleIds:readonly string[];readonly source:string;}
export function evaluateHoldout(model:LinearModel,dataset:ShapeDataset,split:HoldoutSplit):HoldoutEvaluation;

export interface NearestExampleMemorizer {readonly algorithm:'nearest-example-memorizer-v1';readonly trainingExampleIds:readonly string[];
 readonly trainingExamples:readonly {readonly id:string;readonly label:string;readonly pixels:DrawingPixels}[];readonly inputShape:readonly number[];readonly source:string;}
export interface NearestExamplePrediction {readonly predictedLabel:string;readonly nearestDistance:number;readonly nearestExampleIds:readonly string[];readonly tie:boolean;readonly origin:string;}
export function trainNearestExampleMemorizer(dataset:ShapeDataset,split:HoldoutSplit):NearestExampleMemorizer;
export function classifyNearestExample(model:NearestExampleMemorizer,pixels:DrawingPixels):NearestExamplePrediction;
export interface MemorizationGeneralizationTrial {readonly id:string;readonly actualLabel:string;readonly learnerPredictedLabel:string;readonly memorizerPredictedLabel:string;
 readonly learnerCorrect:boolean;readonly memorizerCorrect:boolean;readonly disagree:boolean;readonly memorizerDistance:number;readonly memorizerTie:boolean;}
export interface MemorizationGeneralizationComparison {readonly algorithm:'memorization-generalization-trial-v1';readonly holdoutExampleIds:readonly string[];readonly trainingExampleIds:readonly string[];
 readonly exampleCount:number;readonly learnerCorrectCount:number;readonly memorizerCorrectCount:number;readonly disagreementCount:number;readonly trials:readonly MemorizationGeneralizationTrial[];readonly source:string;}
export function compareMemorizationGeneralization(linearModel:LinearModel,memorizer:NearestExampleMemorizer,dataset:ShapeDataset,split:HoldoutSplit):MemorizationGeneralizationComparison;
