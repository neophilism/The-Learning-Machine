import {useEffect,useRef,useState} from 'react';
import {classifyMicrophoneFailure,createLiveProcessingPlan,summarizeLatency} from '../../../../packages/audio-lab/src/live-processing.mjs';

type SessionState='idle'|'requesting'|'active'|'denied'|'unavailable'|'error';
type Mode='bypass'|'lowpass'|'highpass';
type Graph={source:MediaStreamAudioSourceNode;input:GainNode;filter:BiquadFilterNode;output:GainNode;analyser:AnalyserNode;sink:MediaStreamAudioDestinationNode};

export default function LiveAudioFilter(){
 const [hydrated,setHydrated]=useState(false),[state,setState]=useState<SessionState>('idle'),[message,setMessage]=useState('Microphone is off. No permission has been requested.');
 const [mode,setMode]=useState<Mode>('lowpass'),[cutoff,setCutoff]=useState(1200),[inputGain,setInputGain]=useState(1),[monitor,setMonitor]=useState(false),[latency,setLatency]=useState('');
 const context=useRef<AudioContext|null>(null),stream=useRef<MediaStream|null>(null),graph=useRef<Graph|null>(null),request=useRef(0);
 const release=(next:SessionState='idle',nextMessage='Microphone is off. Local tracks and the audio graph have been stopped.')=>{
  request.current++;
  for(const track of stream.current?.getTracks()??[])track.stop();
  stream.current=null;
  const old=graph.current;graph.current=null;
  if(old)for(const node of [old.source,old.input,old.filter,old.output,old.analyser,old.sink])try{node.disconnect()}catch{}
  const oldContext=context.current;context.current=null;if(oldContext)void oldContext.close();
  setLatency('');setState(next);setMessage(nextMessage);
 };
 useEffect(()=>{setHydrated(true);return()=>{request.current++;for(const track of stream.current?.getTracks()??[])track.stop();if(context.current)void context.current.close()}},[]);
 useEffect(()=>{const active=graph.current;if(!active)return;const plan=createLiveProcessingPlan({mode,cutoffHz:cutoff,inputGain,monitor});active.input.gain.value=plan.inputGain;active.filter.type=plan.nodeType;active.filter.frequency.value=plan.cutoffHz;active.filter.Q.value=plan.q},[mode,cutoff,inputGain,monitor]);
 async function start(){
  const id=++request.current,started=performance.now();setState('requesting');setMessage('Waiting for microphone permission.');setLatency('');
  try{
   const opened=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:false,autoGainControl:false},video:false});
   if(id!==request.current){for(const track of opened.getTracks())track.stop();return}
   const plan=createLiveProcessingPlan({mode,cutoffHz:cutoff,inputGain,monitor}),ctx=new AudioContext(),source=ctx.createMediaStreamSource(opened),input=ctx.createGain(),filter=ctx.createBiquadFilter(),output=ctx.createGain(),analyser=ctx.createAnalyser(),sink=ctx.createMediaStreamDestination();
   input.gain.value=plan.inputGain;filter.type=plan.nodeType;filter.frequency.value=plan.cutoffHz;filter.Q.value=plan.q;output.gain.value=plan.outputGain;analyser.fftSize=256;
   source.connect(input);input.connect(filter);filter.connect(output);output.connect(analyser);analyser.connect(sink);if(plan.monitor)output.connect(ctx.destination);
   await ctx.resume();
   if(id!==request.current){for(const track of opened.getTracks())track.stop();void ctx.close();return}
   stream.current=opened;context.current=ctx;graph.current={source,input,filter,output,analyser,sink};
   for(const track of opened.getTracks())track.addEventListener('ended',()=>queueMicrotask(()=>release('idle','Microphone access ended. No audio was retained.')),{once:true});
   const evidence=summarizeLatency(ctx,started,performance.now());
   setLatency(`Setup ${evidence.setupMilliseconds.toFixed(2)} ms; browser-reported audio latency ${evidence.browserReportedMilliseconds===null?'unavailable':evidence.browserReportedMilliseconds.toFixed(2)+' ms'}. ${evidence.caveat}`);
   setState('active');setMessage(`Local ${mode} filter is active on the browser audio rendering thread. No audio is recorded, retained, or uploaded.`);
  }catch(reason){
   if(id!==request.current)return;
   const failure=classifyMicrophoneFailure(reason);setState(failure.state as SessionState);setMessage(failure.message);
  }
 }
 const active=state==='active';
 return <section className="learning-card" aria-labelledby="live-audio-heading">
  <h2 id="live-audio-heading">Optional live audio filter</h2>
  <p>After an explicit gesture, route your microphone through a native browser audio graph. The original melody composer remains the complete no-microphone alternative.</p>
  <div className="controls">
   <label>Filter <select value={mode} onChange={event=>setMode(event.target.value as Mode)}><option value="bypass">Bypass comparison</option><option value="lowpass">Low-pass</option><option value="highpass">High-pass</option></select></label>
   <label>Cutoff: {cutoff} Hz <input type="range" min={80} max={12000} step={20} value={cutoff} onChange={event=>setCutoff(Number(event.target.value))}/></label>
   <label>Input gain: {inputGain.toFixed(2)} <input type="range" min={0} max={1.5} step={0.05} value={inputGain} onChange={event=>setInputGain(Number(event.target.value))}/></label>
  </div>
  <label><input type="checkbox" checked={monitor} disabled={state==='requesting'||active} onChange={event=>setMonitor(event.target.checked)}/> Monitor filtered sound through speakers at a capped level</label>
  <p className="status-note">Monitoring is off by default to avoid feedback. Headphones are recommended before enabling it.</p>
  <div className="controls"><button type="button" className="action action-primary" disabled={!hydrated||state==='requesting'||active} onClick={()=>{void start()}}>Start local microphone filter</button><button type="button" className="action" disabled={!active} onClick={()=>release()}>Stop microphone filter</button></div>
  <p role="status" data-audio-state={state}>{message}</p>{latency&&<p data-latency-evidence>{latency}</p>}
  <details><summary>What runs in parallel?</summary><p>The Web Audio graph processes signal blocks on the browser audio rendering thread while the page remains interactive. “Browser-reported latency” is not an acoustic round-trip measurement.</p></details>
 </section>;
}
