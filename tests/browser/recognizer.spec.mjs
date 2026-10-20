import {test,expect} from '@playwright/test';

test('visitor sees computed confusion denominators and threshold uncertainty',async({page})=>{
 await page.goto('/vision');
 const region=page.getByRole('region',{name:'Run a selective icon recognizer'});
 await expect(region).toBeVisible();
 await region.getByLabel('Target shape').selectOption('circle');
 const summary=region.locator('p[role="status"]');
 await expect(summary).toContainText(/Precision 100% \(2\/2\).*Recall 100% \(2\/2\).*False positives 0.*Missed targets 0/);
 await region.getByLabel('Apply one deterministic pixel change per sample').check();
 const threshold=region.getByLabel('Minimum score');
 await threshold.press('End');
 await threshold.press('ArrowLeft');
 await expect(summary).toContainText(/Precision not applicable \(0\/0\).*Recall 0% \(0\/2\).*Missed targets 2.*Near-threshold uncertain results 3/);
 await threshold.press('ArrowLeft');
 await threshold.press('ArrowLeft');
 await expect(summary).toContainText(/Recall 100% \(2\/2\).*Missed targets 0/);
 await expect(region.getByRole('table')).toContainText('within 5 points of threshold');
});
