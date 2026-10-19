import {compileMelody} from './melody.mjs';
export function synthesizeSamples(notes,tempo=110,{sampleRate=4096,maxSeconds=12}={}){
 if(!Number.isInteger(sampleRate)||sampleRate<2048||sampleRate>48000)throw new RangeError('Invalid sample rate');
 if(!Number.isFinite(maxSeconds)||maxSeconds<=0||maxSeconds>20)throw new RangeError('Invalid analysis window');
 const schedule=compileMelody(notes,tempo);
 const duration=Math.min(schedule.totalSeconds,maxSeconds);
 const values=new Float32Array(Math.ceil(duration*sampleRate));
 let at=0;
 for(const event of schedule.events){
  const start=Math.round(event.startSeconds*sampleRate),end=Math.min(values.length,Math.round((event.startSeconds+event.durationSeconds)*sampleRate));
  for(let i=Math.max(0,start);i<end;i++){
    const elapsed=(i/sampleRate-event.startSeconds);
    const envelope=Math.min(1,elapsed*80,Math.max(0,(event.durationSeconds-elapsed)*35));
    values[i]=0.3*envelope*Math.sin(2*Math.PI*event.frequencyHz*elapsed);
  }
  at=Math.max(at,end);
 }
 return {samples:values,sampleRate,durationSeconds:duration,fullDurationSeconds:schedule.totalSeconds,truncated:duration<schedule.totalSeconds,origin:'locally-synthesized-samples'};
}
export function waveformPeaks(values,buckets=120){
 if(!(values instanceof Float32Array)||!Number.isInteger(buckets)||buckets<4||buckets>1024)throw new TypeError('Invalid waveform inputs');
 const peaks=[];
 for(let i=0;i<buckets;i++){
  const from=Math.floor(i*values.length/buckets),to=Math.floor((i+1)*values.length/buckets);
  let min=0,max=0;for(let p=from;p<to;p++){min=Math.min(min,values[p]);max=Math.max(max,values[p]);}
  peaks.push({min,max});
 }
 return peaks;
}
export function spectrogram(values,{sampleRate=4096,windows=24,bins=32,fftSize=128}={}){
 if(!(values instanceof Float32Array)||values.length<fftSize||!Number.isInteger(windows)||windows<1||windows>80||!Number.isInteger(bins)||bins<2||bins>64||!Number.isInteger(fftSize)||fftSize<32||fftSize>256||!Number.isInteger(sampleRate)||sampleRate<2048||sampleRate>48000)throw new TypeError('Invalid spectrogram parameters');
 const result=[];
 for(let w=0;w<windows;w++){
  const start=Math.floor(w*(values.length-fftSize)/Math.max(1,windows-1));
  const powers=[];
  for(let k=0;k<bins;k++){
   const freq=(k+1)*sampleRate/(2*(bins+1)),step=2*Math.PI*freq/sampleRate;
   let re=0,im=0;
   for(let n=0;n<fftSize;n++){const sample=values[start+n]*(0.5-0.5*Math.cos(2*Math.PI*n/(fftSize-1)));re+=sample*Math.cos(step*n);im-=sample*Math.sin(step*n);}
   powers.push(Math.sqrt(re*re+im*im)/fftSize);
  }
  result.push(powers);
 }
 return {powers:result,windows,bins,frequencyMaxHz:sampleRate/2,algorithm:'windowed-discrete-fourier-measurement',source:'generated-melody-samples'};
}
