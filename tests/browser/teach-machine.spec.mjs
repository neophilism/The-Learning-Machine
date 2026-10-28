import {test,expect} from '@playwright/test';

test('Teach a Machine integrates training, test evidence, revision and transfer on an accessible route',async({page})=>{
 const posts=[];page.on('request',request=>{if(request.method()==='POST')posts.push(request.url())});
 await page.goto('/shapes');
 await expect(page).toHaveTitle(/Teach a Machine/);
 await expect(page.getByRole('navigation',{name:'Teach a Machine lesson progress'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Save example'})).toBeEnabled();
 await page.getByLabel('Before training, what visual pattern do you expect the model to learn?').fill('Lines should differ from closed squares.');

 const label=page.getByLabel('Training class label'),preset=page.getByLabel('Original drawing preset');
 for(const [index,[className,kind]] of [['Line','horizontal'],['Line','diagonal'],['Square','square'],['Square','square']].entries()){
  await label.fill(className);await preset.selectOption(kind);
  await page.getByRole('button',{name:'Load selected preset'}).click();
  await page.getByRole('button',{name:'Save example'}).click();
  await expect(page.getByRole('heading',{name:`Examples saved: ${index+1} / 64`})).toBeVisible();
 }
 await page.getByRole('button',{name:'Create held-out split'}).click();
 await expect(page.getByRole('button',{name:'Train local classifier'})).toBeVisible();
 await page.getByRole('button',{name:'Train local classifier'}).click();
 await expect(page.getByRole('region',{name:'Held-out inference results'})).toBeVisible();
 await expect(page.getByRole('region',{name:'Memorization versus generalization trial'})).toBeVisible();

 await page.getByLabel('What will you revise, and what evidence led you there?').fill('Add varied line angles because the held-out comparison is narrow.');
 await page.getByRole('button',{name:'Record revision and return to examples'}).click();
 await expect(page.getByText(/1 evidence-based revision has been recorded/)).toBeVisible();

 await page.getByRole('button',{name:'Create held-out split'}).click();
 await expect(page.getByRole('button',{name:'Train local classifier'})).toBeVisible();
 await page.getByRole('button',{name:'Train local classifier'}).click();
 await expect(page.getByRole('region',{name:'Held-out inference results'})).toBeVisible();
 await preset.selectOption('cross');
 await page.getByRole('button',{name:'Load selected preset'}).click();
 await page.getByRole('button',{name:'Predict current drawing'}).click();
 await expect(page.getByText(/Transfer complete:/)).toBeVisible();
 await expect(page.locator('[data-state="complete"]')).toHaveCount(5);
 expect(posts).toEqual([]);
});
