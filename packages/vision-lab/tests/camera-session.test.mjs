import test from 'node:test';
import assert from 'node:assert/strict';
import {LOCAL_CAMERA_CONSTRAINTS,requestLocalCamera,stopLocalCamera,watchCameraRevocation} from '../src/camera-session.mjs';

const track=()=>{const listeners=new Set();return {stopped:false,stop(){this.stopped=true},addEventListener(name,fn){if(name==='ended')listeners.add(fn)},removeEventListener(name,fn){if(name==='ended')listeners.delete(fn)},end(){for(const fn of listeners)fn()}}};

test('camera access is requested only through an explicit call with video-only constraints',async()=>{
 const video=track(),stream={getTracks:()=>[video],getVideoTracks:()=>[video]};let calls=0;
 const mediaDevices={getUserMedia:async constraints=>{calls++;assert.deepEqual(constraints,LOCAL_CAMERA_CONSTRAINTS);return stream}};
 assert.equal(calls,0);assert.equal(await requestLocalCamera(mediaDevices),stream);assert.equal(calls,1);
});

test('permission denial is propagated without retaining a stream',async()=>{
 const denial=Object.assign(new Error('denied'),{name:'NotAllowedError'});
 await assert.rejects(requestLocalCamera({getUserMedia:async()=>{throw denial}}),error=>error===denial);
});

test('missing video tracks fail closed and stop every returned track',async()=>{
 const audio=track(),stream={getTracks:()=>[audio],getVideoTracks:()=>[]};
 await assert.rejects(requestLocalCamera({getUserMedia:async()=>stream}),/no video track/);assert.equal(audio.stopped,true);
});

test('revocation is observable and cleanup removes the listener',()=>{
 const video=track(),stream={getTracks:()=>[video],getVideoTracks:()=>[video]};let revoked=0;
 const cleanup=watchCameraRevocation(stream,()=>revoked++);video.end();assert.equal(revoked,1);cleanup();video.end();assert.equal(revoked,1);
 assert.equal(stopLocalCamera(stream),true);assert.equal(video.stopped,true);
});
