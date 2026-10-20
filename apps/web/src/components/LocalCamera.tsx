import {useEffect,useRef,useState} from 'react';
import {requestLocalCamera,stopLocalCamera,watchCameraRevocation} from '../../../../packages/vision-lab/src/camera-session.mjs';
import '../styles/camera.css';

type CameraState='idle'|'requesting'|'active'|'denied'|'revoked'|'unavailable'|'error';
const publicError=(reason:unknown):{state:CameraState;message:string}=>{
 const name=reason instanceof DOMException?reason.name:reason&&typeof reason==='object'&&'name' in reason?String(reason.name):'';
 if(name==='NotAllowedError'||name==='SecurityError')return {state:'denied',message:'Camera permission was denied. No frames were captured.'};
 if(name==='NotFoundError'||name==='NotReadableError')return {state:'unavailable',message:'No available camera could be opened.'};
 return {state:'error',message:reason instanceof Error?reason.message:'Camera capture failed.'};
};
const frameDigest=(data:Uint8ClampedArray)=>{let value=0x811c9dc5;for(const byte of data){value^=byte;value=Math.imul(value,0x01000193)}return (value>>>0).toString(16).padStart(8,'0')};

export default function LocalCamera(){
 const [hydrated,setHydrated]=useState(false),[state,setState]=useState<CameraState>('idle'),[message,setMessage]=useState('Camera is off. No permission has been requested.'),[capture,setCapture]=useState('');
 const video=useRef<HTMLVideoElement|null>(null),canvas=useRef<HTMLCanvasElement|null>(null),stream=useRef<MediaStream|null>(null),unwatch=useRef<(()=>void)|null>(null),request=useRef(0);
 const release=(next:CameraState='idle',nextMessage='Camera is off. Local tracks have been stopped.')=>{request.current++;unwatch.current?.();unwatch.current=null;stopLocalCamera(stream.current);stream.current=null;if(video.current)video.current.srcObject=null;setCapture('');setState(next);setMessage(nextMessage)};
 useEffect(()=>{setHydrated(true);return()=>{request.current++;unwatch.current?.();stopLocalCamera(stream.current);stream.current=null}},[]);
 async function start(){
  const id=++request.current;setState('requesting');setMessage('Waiting for camera permission.');setCapture('');
  try{
   const opened=await requestLocalCamera(navigator.mediaDevices);
   if(id!==request.current){stopLocalCamera(opened);return}
   stream.current=opened;unwatch.current=watchCameraRevocation(opened,()=>release('revoked','Camera access ended. No frame or recording was retained.'));
   if(video.current){video.current.srcObject=opened;void video.current.play().catch(()=>undefined)}
   setState('active');setMessage('Camera is on for local preview only. Nothing is uploaded or recorded.');
  }catch(reason){if(id!==request.current)return;const failure=publicError(reason);setState(failure.state);setMessage(failure.message)}
 }
 function captureFrame(){
  const source=video.current,target=canvas.current;if(!source||!target)return;
  const width=source.videoWidth||320,height=source.videoHeight||180;target.width=width;target.height=height;
  const context=target.getContext('2d',{willReadFrequently:true});if(!context){setState('error');setMessage('Local frame processing is unavailable.');return}
  context.drawImage(source,0,0,width,height);const digest=frameDigest(context.getImageData(0,0,width,height).data);setCapture(`Local frame ${width} by ${height}, digest ${digest}.`);
 }
 const active=state==='active';
 return <section className="local-camera" aria-labelledby="local-camera-title"><h3 id="local-camera-title">Optional local camera</h3><p>The camera stays off until you choose to start it. A captured frame is processed only in this browser canvas; this experience has no frame-upload path.</p><div className="controls"><button className="action action-primary" type="button" disabled={!hydrated||state==='requesting'||active} onClick={start}>Start local camera</button><button className="action" type="button" disabled={!active} onClick={captureFrame}>Capture one local frame</button><button className="action" type="button" disabled={!active} onClick={()=>release()}>Stop camera</button></div><p role="status" data-camera-state={state}>{message}</p><div className="camera-pair"><video ref={video} muted playsInline aria-label="Live local camera preview"/><canvas ref={canvas} width="320" height="180" role="img" aria-label={capture||'No local camera frame captured.'}/></div>{capture&&<p className="status-note">{capture} The digest describes this browser-local canvas and is not sent anywhere.</p>}</section>;
}
