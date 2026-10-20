import {test,expect} from '@playwright/test';
test('visitor creates two real labeled examples and changes the dataset',async({page})=>{
 const uploads=[];page.on('request',r=>{if(r.method()==='POST')uploads.push(r.url())});
 await page.goto('/shapes');
 await expect(page.getByRole('region',{name:'Create local training examples'})).toBeVisible();
 await page.getByRole('button',{name:'Load selected preset'}).click();
 await page.getByRole('button',{name:'Save example'}).click();
 await expect(page.getByText('Examples saved: 1 / 64')).toBeVisible();
 await page.getByLabel('Training class label').fill('Shape B');
 await page.getByLabel('Original drawing preset').selectOption('cross');
 await page.getByRole('button',{name:'Load selected preset'}).click();
 await page.getByRole('button',{name:'Save example'}).click();
 await expect(page.getByText('Examples saved: 2 / 64')).toBeVisible();
 await expect(page.getByText('Classes: Shape A (1), Shape B (1)')).toBeVisible();
 await page.getByRole('button',{name:'Remove ex-1'}).click();
 await expect(page.getByText('Examples saved: 1 / 64')).toBeVisible();
 expect(uploads).toEqual([]);
});
test('keyboard drawing without a mouse produces an actual nonempty example',async({page})=>{
 await page.goto('/shapes');
 await page.getByRole('spinbutton',{name:'Row (1–16)'}).fill('3');
 await page.getByRole('spinbutton',{name:'Column (1–16)'}).fill('6');
 await page.getByRole('button',{name:'Mark cell'}).click();
 await expect(page.getByText('1 of 256 cells marked.')).toBeVisible();
 await page.getByRole('button',{name:'Save example'}).click();
 await expect(page.getByText('Examples saved: 1 / 64')).toBeVisible();
});
