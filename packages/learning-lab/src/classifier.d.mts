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
