import {test,expect} from '@playwright/test';

test('visitor rule editor serializes controlled terms and previews their exact effect',async({page})=>{
 await page.goto('/policy');
 await expect(page.getByRole('status')).toContainText('Rule matches the example.');
 await expect(page.getByRole('status')).toContainText('Outcome: permit');
 await page.getByLabel('Effect when every term matches').selectOption('restrict');
 await expect(page.getByRole('status')).toContainText('Outcome: restrict');
 await page.getByLabel('Output is distributed').check();
 await expect(page.getByRole('status')).toContainText('Rule does not match the example.');
 await expect(page.getByRole('status')).toContainText('Outcome: unresolved');
 const serialized=await page.getByLabel('Portable local JSON').inputValue();
 const policy=JSON.parse(serialized);
 expect(policy.framework).toBe('hypothetical');
 expect(policy.rules).toHaveLength(1);
 expect(policy.rules[0].sourceIds).toEqual(['visitor-authored-hypothesis']);
 expect(policy.rules[0].when.conditions).toContainEqual({operator:'eq',fact:'outputs.distributed',value:true});
});

