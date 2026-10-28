import {test,expect} from '@playwright/test';

test('music lesson commits prediction, reveals real evidence, revises, and transfers',async({page})=>{
 await page.goto('/audio');
 const run=page.getByRole('button',{name:'Commit prediction and run experiment'});
 await expect(run).toBeEnabled();
 await page.getByLabel('Your prediction').selectOption('falling');
 await run.click();
 await expect(page.getByRole('region',{name:'Observed model evidence'})).toContainText('You predicted falling');
 await expect(page.getByText(/Held-out evidence: \d of 4/)).toBeVisible();
 await expect(page.getByText(/disagreement is allowed|prediction matched/)).toBeVisible();
 await page.getByLabel('What would you test next?').fill('I will test interval direction on another unseen melody.');
 await page.getByRole('button',{name:'Record revision'}).click();
 await page.getByRole('button',{name:'Test revision on the other unseen melody'}).click();
 await expect(page.locator('[data-music-lesson-complete="true"]')).toContainText('Completion records your reasoning, not agreement');
});

test('music lesson requires a meaningful revision and supports reset',async({page})=>{
 await page.goto('/audio');
 await page.getByRole('button',{name:'Commit prediction and run experiment'}).click();
 await page.getByRole('button',{name:'Record revision'}).click();
 await expect(page.getByRole('alert')).toContainText('3–500');
 await page.getByRole('button',{name:'Reset lesson'}).click();
 await expect(page.getByRole('button',{name:'Commit prediction and run experiment'})).toBeEnabled();
});
