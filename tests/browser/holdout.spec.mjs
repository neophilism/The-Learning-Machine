import {test,expect} from '@playwright/test';
test('training and unseen test sets remain separate with reproducible membership',async({page})=>{
 await page.goto('/shapes');
 const label=page.getByLabel('Training class label'),preset=page.getByLabel('Original drawing preset');
 for(const [className,kind] of [['A','cross'],['A','diagonal'],['B','square'],['B','horizontal']]){
  await label.fill(className);await preset.selectOption(kind);
  await page.getByRole('button',{name:'Load selected preset'}).click();
  await page.getByRole('button',{name:'Save example'}).click();
 }
 await expect(page.getByText('Examples saved: 4 / 64')).toBeVisible();
 await page.getByRole('button',{name:'Create held-out split'}).click();
 await expect(page.getByText(/Ready for later classifier training/)).toBeVisible();
 await expect(page.getByText('2 training examples, 2 unseen test examples.',{exact:false})).toBeVisible();
 await page.getByText('Inspect separate example IDs').click();
 const train=await page.getByText(/Training IDs:/).textContent();
 const held=await page.getByText(/Held-out IDs:/).textContent();
 const parse=s=>s.split(':').slice(1).join(':').split(',').map(x=>x.trim()).filter(x=>x&&x!=='none');
 const trainIds=new Set(parse(train)),testIds=parse(held);
 expect(testIds.every(id=>!trainIds.has(id))).toBe(true);
});
test('small classes get honest insufficient-data warning',async({page})=>{
 await page.goto('/shapes');
 await page.getByRole('button',{name:'Load selected preset'}).click();
 await page.getByRole('button',{name:'Save example'}).click();
 await page.getByRole('button',{name:'Create held-out split'}).click();
 await expect(page.getByText(/More examples needed/)).toBeVisible();
 await expect(page.getByRole('list',{name:'Split warnings'})).toBeVisible();
});
