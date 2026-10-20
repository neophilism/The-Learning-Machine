export const LOCAL_CAMERA_CONSTRAINTS=Object.freeze({audio:false,video:Object.freeze({facingMode:'user'})});

export async function requestLocalCamera(mediaDevices){
 if(!mediaDevices||typeof mediaDevices.getUserMedia!=='function')throw new Error('Camera capture is unavailable in this browser');
 const stream=await mediaDevices.getUserMedia(LOCAL_CAMERA_CONSTRAINTS);
 if(!stream||typeof stream.getTracks!=='function'||typeof stream.getVideoTracks!=='function')throw new TypeError('Camera returned an invalid media stream');
 if(stream.getVideoTracks().length===0){stopLocalCamera(stream);throw new Error('Camera returned no video track')}
 return stream;
}

export function stopLocalCamera(stream){
 if(!stream||typeof stream.getTracks!=='function')return false;
 for(const track of stream.getTracks())track.stop();
 return true;
}

export function watchCameraRevocation(stream,onRevoked){
 if(!stream||typeof stream.getVideoTracks!=='function'||typeof onRevoked!=='function')throw new TypeError('A camera stream and revocation callback are required');
 const tracks=stream.getVideoTracks();
 const ended=()=>onRevoked();
 for(const track of tracks)track.addEventListener('ended',ended,{once:true});
 return()=>{for(const track of tracks)track.removeEventListener('ended',ended)};
}
