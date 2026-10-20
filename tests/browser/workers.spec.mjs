import {test,expect} from '@playwright/test';

test('vision results come from latest worker request after reset',async({page})=>{
 await page.goto('/vision');
 const pixels=page.getByRole('region',{name:'Execute real pixel operations'}),recognizer=page.getByRole('region',{name:'Run a selective icon recognizer'});
 await expect(pixels.getByRole('status')).toContainText('0 operations executed in the vision Worker');
 await pixels.getByRole('button',{name:'Run pixel operation'}).click();
 await pixels.getByRole('button',{name:'Reset operations'}).click();
 await expect(pixels.getByRole('status')).toContainText('0 operations executed in the vision Worker');
 await expect(pixels.locator('canvas')).toHaveAttribute('aria-label',/Worker-computed 24 by 16 pixel frame/);
 const threshold=recognizer.getByLabel('Minimum score');
 await threshold.press('End');await threshold.press('Home');await threshold.press('End');await threshold.press('ArrowLeft');
 const recognitionStatus=recognizer.locator('p[role="status"]');
 await expect(recognitionStatus).toContainText('Worker result for target circle');
 await expect(recognitionStatus).toContainText(/Recall 100% \(2\/2\)/);
});
