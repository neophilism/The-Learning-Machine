export const FILTER_MODES=Object.freeze(['bypass','lowpass','highpass']);

export function validateLiveProcessingSettings(value={}){
 const mode=value.mode??'bypass',cutoffHz=value.cutoffHz??1200,inputGain=value.inputGain??1,monitor=value.monitor??false;
 if(!FILTER_MODES.includes(mode))throw new TypeError('Unsupported live audio filter mode');
 if(!Number.isFinite(cutoffHz)||cutoffHz<80||cutoffHz>12000)throw new RangeError('Cutoff must be between 80 and 12000 Hz');
 if(!Number.isFinite(inputGain)||inputGain<0||inputGain>1.5)throw new RangeError('Input gain must be between 0 and 1.5');
 if(typeof monitor!=='boolean')throw new TypeError('Monitor must be boolean');
 return Object.freeze({mode,cutoffHz,inputGain,monitor});
}

export function createLiveProcessingPlan(value={}){
 const settings=validateLiveProcessingSettings(value);
 return Object.freeze({
  ...settings,
  nodeType:settings.mode==='bypass'?'allpass':settings.mode,
  q:0.707,
  outputGain:settings.monitor?0.3:1,
  execution:'browser-web-audio-rendering-thread',
  retention:'none'
 });
}

export function classifyMicrophoneFailure(reason){
 const name=reason&&typeof reason==='object'&&'name' in reason?String(reason.name):'';
 if(name==='NotAllowedError'||name==='SecurityError')return Object.freeze({state:'denied',message:'Microphone permission was denied. No audio was captured.'});
 if(name==='NotFoundError'||name==='NotReadableError')return Object.freeze({state:'unavailable',message:'No available microphone could be opened.'});
 return Object.freeze({state:'error',message:'Local audio processing could not start.'});
}

export function summarizeLatency(context,setupStartedMs,setupCompletedMs){
 const baseLatency=context?.baseLatency,outputLatency=context?.outputLatency;
 if(!Number.isFinite(setupStartedMs)||!Number.isFinite(setupCompletedMs)||setupCompletedMs<setupStartedMs)throw new TypeError('Invalid setup timing');
 const reported=[baseLatency,outputLatency].filter(value=>Number.isFinite(value)&&value>=0);
 return Object.freeze({
  setupMilliseconds:Number((setupCompletedMs-setupStartedMs).toFixed(2)),
  browserReportedMilliseconds:reported.length?Number((reported.reduce((sum,value)=>sum+value,0)*1000).toFixed(2)):null,
  measurement:'local-setup-clock-and-browser-reported-audio-latency',
  caveat:'This is not an acoustic round-trip measurement.'
 });
}
