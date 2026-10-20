import {test,expect} from '@playwright/test';

test('camera permission is requested only after the explicit gesture and denial is contained',async({page})=>{
 await page.addInitScript(()=>{let calls=0;Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{calls++;throw new DOMException('denied','NotAllowedError')}}});Object.defineProperty(window,'__cameraCalls',{get:()=>calls})});
 await page.goto('/vision');expect(await page.evaluate(()=>window.__cameraCalls)).toBe(0);
 await page.getByRole('button',{name:'Start local camera'}).click();
 await expect(page.locator('[data-camera-state="denied"]')).toContainText('No frames were captured');expect(await page.evaluate(()=>window.__cameraCalls)).toBe(1);
});

test('local capture emits no network request and revocation stops the session',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;const stream=canvas.captureStream();window.__cameraStream=stream;return stream}}})});
 await page.goto('/vision');const uploads=[];page.on('request',request=>{if(!['GET','HEAD'].includes(request.method()))uploads.push(`${request.method()} ${request.url()}`)});
 await page.getByRole('button',{name:'Start local camera'}).click();await expect(page.locator('[data-camera-state="active"]')).toContainText('Nothing is uploaded');
 await page.getByRole('button',{name:'Capture one local frame'}).click();await expect(page.getByText(/Local frame 320 by 180, digest/)).toBeVisible();expect(uploads).toEqual([]);
 await page.evaluate(()=>window.__cameraStream.getVideoTracks()[0].dispatchEvent(new Event('ended')));await expect(page.locator('[data-camera-state="revoked"]')).toContainText('Camera access ended');
});
