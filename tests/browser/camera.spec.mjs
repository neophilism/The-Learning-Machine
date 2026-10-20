import {test,expect} from '@playwright/test';

test('camera permission is requested only after the explicit gesture and denial is contained',async({page})=>{
 await page.addInitScript(()=>{let calls=0;Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{calls++;throw new DOMException('denied','NotAllowedError')}}});Object.defineProperty(window,'__cameraCalls',{get:()=>calls})});
 await page.goto('/vision');expect(await page.evaluate(()=>window.__cameraCalls)).toBe(0);
 await page.getByRole('button',{name:'Start local camera'}).click();
 await expect(page.locator('[data-camera-state="denied"]')).toContainText('No frames were captured');expect(await page.evaluate(()=>window.__cameraCalls)).toBe(1);
});

test('local capture emits no network request and revocation stops the session',async({page})=>{
 await page.addInitScript(()=>{class Track extends EventTarget{stop(){this.stopped=true}}const track=new Track(),stream={getTracks:()=>[track],getVideoTracks:()=>[track]};window.__cameraStream=stream;Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>stream}});Object.defineProperty(HTMLMediaElement.prototype,'srcObject',{configurable:true,get(){return this.__localStream??null},set(value){this.__localStream=value}});HTMLMediaElement.prototype.play=async()=>{};Object.defineProperty(HTMLVideoElement.prototype,'videoWidth',{configurable:true,get:()=>320});Object.defineProperty(HTMLVideoElement.prototype,'videoHeight',{configurable:true,get:()=>180});CanvasRenderingContext2D.prototype.drawImage=()=>{}});
 await page.goto('/vision');const uploads=[];page.on('request',request=>{if(!['GET','HEAD'].includes(request.method()))uploads.push(`${request.method()} ${request.url()}`)});
 await page.getByRole('button',{name:'Start local camera'}).click();await expect(page.locator('[data-camera-state="active"]')).toContainText('Nothing is uploaded');
 const capture=page.getByRole('button',{name:'Capture one local frame'});await capture.focus();await capture.press('Enter');await expect(page.getByText(/Local frame 320 by 180, digest/)).toBeVisible();expect(uploads).toEqual([]);
 await page.evaluate(()=>setTimeout(()=>window.__cameraStream.getVideoTracks()[0].dispatchEvent(new Event('ended')),0));await expect(page.locator('[data-camera-state="revoked"]')).toContainText('Camera access ended');
});
