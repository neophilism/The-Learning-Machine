import {test,expect} from '@playwright/test';

test('visitor sees real position-independent recognition and distractor rejection',async({page})=>{
 await page.goto('/vision');
 const region=page.getByRole('region',{name:'Run a selective icon recognizer'});
 await expect(region).toBeVisible();
 await region.getByLabel('Target shape').selectOption('circle');
 await page.getByRole('button',{name:'Add symbol'}).click();
 await expect(region.getByRole('status')).toContainText(/Precision 100%. Recall 100%./);
 const circleRows=region.getByRole('row').filter({hasText:'circle'});
 await expect(circleRows.first()).toContainText('yes');
 await expect(region.getByRole('table')).toContainText(/diamond|triangle|bar/);
});
