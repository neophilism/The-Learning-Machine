export const LOCAL_CAMERA_CONSTRAINTS:Readonly<{audio:false;video:Readonly<{facingMode:'user'}>}>;
export function requestLocalCamera(mediaDevices:Pick<MediaDevices,'getUserMedia'>):Promise<MediaStream>;
export function stopLocalCamera(stream:Pick<MediaStream,'getTracks'>|null|undefined):boolean;
export function watchCameraRevocation(stream:Pick<MediaStream,'getVideoTracks'>,onRevoked:()=>void):()=>void;
