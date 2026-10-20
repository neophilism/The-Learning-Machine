import {test,expect} from '@playwright/test';
test('visitor receives progressively more explicit hints and may request the full explanation',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Continue'}).click();
 await page.getByRole('button',{name:'Need a hint'}).click();
 await expect(page.getByRole('region',{name:'Progressive Socratic hints'})).toBeVisible();
 await expect(page.getByRole('listitem').filter({hasText:'What is the precise outcome you want?'})).toBeVisible();
 await page.getByRole('button',{name:'Need a hint'}).click();
 await expect(page.getByRole('listitem').filter({hasText:'Could the entire frame be masked?'})).toBeVisible();
 await page.getByRole('button',{name:'See direct explanation'}).click();
 await expect(page.getByText(/Selective masking usually requires/)).toBeVisible();
});
