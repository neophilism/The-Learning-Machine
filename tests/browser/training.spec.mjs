import {test,expect} from '@playwright/test';
test('real local classifier trains on labels without posting drawings',async({page})=>{
 const posts=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url())});
 await page.goto('/shapes');
 const label=page.getByLabel('Training class label'),preset=page.getByLabel('Original drawing preset');
 await expect(page.getByRole('button',{name:'Save example'})).toBeEnabled();
 for(const [className,kind] of [['Line','horizontal'],['Line','horizontal'],['Square','square'],['Square','square']]){
  await label.fill(className);await preset.selectOption(kind);
  await page.getByRole('button',{name:'Load selected preset'}).click();
  await page.getByRole('button',{name:'Save example'}).click();
 }
 await page.getByRole('button',{name:'Create held-out split'}).click();
 await expect(page.getByText(/Ready for later classifier training/)).toBeVisible();
 await page.getByRole('button',{name:'Train local classifier'}).click();
 await expect(page.getByText(/Classifier trained on 2 examples/)).toBeVisible();
 await expect(page.getByText(/final training loss/)).toBeVisible();
 expect(posts).toEqual([]);
});
