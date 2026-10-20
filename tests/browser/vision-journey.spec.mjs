import {test,expect} from '@playwright/test';

test('module requires a recognition and non-recognition comparison through the keyboard path',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Continue'}).click();
 await page.getByRole('button',{name:'Continue'}).click();
 await page.getByRole('button',{name:'Continue without prediction'}).click();
 const run=page.getByRole('button',{name:'Run this experiment'});
 await page.getByLabel('Masking method').selectOption('selective');
 await run.focus();await run.press('Enter');
 await expect(page.getByText(/selective: concealed/)).toBeVisible();
 await page.getByRole('button',{name:'Continue'}).click();
 await expect(page.getByRole('alert')).toContainText('Compare selective masking');
 await page.getByLabel('Masking method').selectOption('blanket');
 await run.focus();await run.press('Enter');
 await expect(page.getByText(/blanket: concealed/)).toBeVisible();
 await expect(page.getByText(/Compared methods: selective, blanket/)).toBeVisible();
 await page.getByRole('button',{name:'Continue'}).click();
 await expect(page.getByText(/Compare the computed pixel changes/)).toBeVisible();
});
