import {test,expect} from '@playwright/test';

test('music lesson previews locally synthesized candidate audio after a gesture',async({page})=>{
 await page.addInitScript(()=>{
  const calls={oscillators:0,starts:0};window.__musicPreviewCalls=calls;
  class Parameter{setValueAtTime(){}linearRampToValueAtTime(){}}
  class Oscillator{constructor(){calls.oscillators++}connect(){}disconnect(){}start(){calls.starts++}stop(){if(this.onended)this.onended()}frequency=new Parameter();type='sine';onended=null}
  class Gain{connect(){}disconnect(){}gain=new Parameter()}
  class Context{currentTime=0;destination={};createOscillator(){return new Oscillator()}createGain(){return new Gain()}async resume(){}async close(){}}
  window.AudioContext=Context;
 });
 await page.goto('/audio');
 expect(await page.evaluate(()=>window.__musicPreviewCalls.starts)).toBe(0);
 await page.getByRole('button',{name:'Play unseen melody preview'}).click();
 await expect.poll(()=>page.evaluate(()=>window.__musicPreviewCalls.starts)).toBe(4);
});

test('keyboard route commits, revises, and transfers without playing audio',async({page})=>{
 await page.addInitScript(()=>{window.AudioContext=class{constructor(){throw new Error('Audio must remain unused')}}});
 await page.goto('/audio');
 const prediction=page.getByLabel('Your prediction');await prediction.focus();await page.keyboard.press('End');
 const run=page.getByRole('button',{name:'Commit prediction and run experiment'});await run.focus();await page.keyboard.press('Enter');
 await expect(page.getByRole('region',{name:'Observed model evidence'})).toContainText('You predicted falling');
 await expect(page.getByText(/Held-out evidence: \d of 4/)).toBeVisible();
 await expect(page.getByText(/disagreement is allowed|prediction matched/)).toBeVisible();
 const revision=page.getByLabel('What would you test next?');await revision.focus();await page.keyboard.type('I will test interval direction on another unseen melody.');
 const record=page.getByRole('button',{name:'Record revision'});await record.focus();await page.keyboard.press('Enter');
 const transfer=page.getByRole('button',{name:'Test revision on the other unseen melody'});await transfer.focus();await page.keyboard.press('Enter');
 await expect(page.locator('[data-music-lesson-complete="true"]')).toContainText('Completion records your reasoning, not agreement');
});

test('music lesson requires a meaningful revision and supports reset',async({page})=>{
 await page.goto('/audio');
 await page.getByRole('button',{name:'Commit prediction and run experiment'}).click();
 await page.getByRole('button',{name:'Record revision'}).click();
 await expect(page.getByRole('alert')).toContainText(/3.500/);
 await page.getByRole('button',{name:'Reset lesson'}).click();
 await expect(page.getByRole('button',{name:'Commit prediction and run experiment'})).toBeEnabled();
});
