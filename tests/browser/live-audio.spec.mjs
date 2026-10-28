import {test,expect} from '@playwright/test';

test('microphone permission requires an explicit gesture and denial is contained',async({page})=>{
 await page.addInitScript(()=>{let calls=0;Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async constraints=>{calls++;window.__audioConstraints=constraints;throw new DOMException('denied','NotAllowedError')}}});Object.defineProperty(window,'__audioCalls',{get:()=>calls})});
 await page.goto('/audio');expect(await page.evaluate(()=>window.__audioCalls)).toBe(0);
 await page.getByRole('button',{name:'Start local microphone filter'}).click();
 await expect(page.locator('[data-audio-state="denied"]')).toContainText('No audio was captured');
 expect(await page.evaluate(()=>window.__audioCalls)).toBe(1);
 expect(await page.evaluate(()=>window.__audioConstraints)).toEqual({audio:{echoCancellation:true,noiseSuppression:false,autoGainControl:false},video:false});
});

test('no-microphone melody path remains available',async({page})=>{
 await page.goto('/audio');
 await expect(page.getByRole('heading',{name:'Compose an original melody'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Play original melody'})).toBeEnabled();
 await expect(page.getByText(/complete no-microphone alternative/)).toBeVisible();
});
