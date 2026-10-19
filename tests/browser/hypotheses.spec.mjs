import {test,expect} from '@playwright/test';
test('visitor can test multiple self-authored hypotheses without forced choice',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Continue'}).click();
 const textarea=page.getByLabel(/Your reasoning/);
 await textarea.fill('Blur every pixel instead of recognizing');
 await page.getByRole('button',{name:'Add alternative hypothesis'}).click();
 await textarea.fill('Use a known geometric location');
 await page.getByRole('button',{name:'Add alternative hypothesis'}).click();
 const hypotheses=page.getByRole('list',{name:'Hypothesis alternatives'});
 await expect(hypotheses.getByRole('listitem')).toHaveCount(2);
 await page.getByRole('button',{name:'Continue'}).click();
 await page.getByRole('button',{name:'Previous'}).click();
 await expect(hypotheses.getByRole('listitem')).toHaveCount(2);
});
