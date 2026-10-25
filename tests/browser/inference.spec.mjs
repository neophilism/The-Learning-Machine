import {test,expect} from '@playwright/test';
test('held-out and fresh drawing predictions expose computed scores without uploads',async({page})=>{
 const posts=[];page.on('request',request=>{if(request.method()==='POST')posts.push(request.url())});
 await page.goto('/shapes');
 const label=page.getByLabel('Training class label'),preset=page.getByLabel('Original drawing preset');
 await expect(page.getByRole('button',{name:'Save example'})).toBeEnabled();
 for(const [className,kind] of [['Line','horizontal'],['Line','horizontal'],['Square','square'],['Square','square']]){
  await label.fill(className);await preset.selectOption(kind);
  await page.getByRole('button',{name:'Load selected preset'}).click();
  await page.getByRole('button',{name:'Save example'}).click();
 }
 await page.getByRole('button',{name:'Create held-out split'}).click();
 await page.getByRole('button',{name:'Train local classifier'}).click();
 await expect(page.getByRole('region',{name:'Held-out inference results'})).toContainText('2 of 2 unseen examples');
 await expect(page.getByRole('table',{name:'Held-out confusion matrix'})).toContainText('Actual total');
 await expect(page.getByRole('list',{name:'Per-class held-out metrics'})).toContainText('precision 100.0% (1/1); recall 100.0% (1/1)');
 const comparison=page.getByRole('region',{name:'Memorization versus generalization trial'});
 await expect(comparison).toContainText('Both methods receive the same 2 held-out example IDs');
 await expect(comparison).toContainText('learned parameters matched 2 of 2');
 await expect(comparison.getByRole('table',{name:'Per-example memorization and generalization outcomes'})).toContainText('success');
 await expect(comparison).toContainText(/Held-out IDs: ex-/);
 await expect(comparison).toContainText(/does not prove either method will generalize/);
 await preset.selectOption('diagonal');
 await page.getByRole('button',{name:'Load selected preset'}).click();
 await page.getByRole('button',{name:'Predict current drawing'}).click();
 const scores=page.getByRole('list',{name:'Calculated class scores'});
 await expect(scores).toContainText('Line:');
 await expect(scores).toContainText('Square:');
 await expect(page.getByText(/not calibrated certainty/)).toBeVisible();
 expect(posts).toEqual([]);
});
