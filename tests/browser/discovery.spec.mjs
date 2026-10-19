import {test,expect} from '@playwright/test';
test('visitor supplies an unconventional hypothesis and can ask for direct explanation',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{name:/Learning begins with a question/})).toBeVisible();
 await expect(page.getByRole('region',{name:'Interactive Socratic learning exercise'})).toBeVisible();
 await page.getByRole('button',{name:'Continue'}).click();
 await page.getByLabel(/Your reasoning/).fill('Blur every pixel without recognizing anything');
 await page.getByRole('button',{name:'Continue with your answer'}).click();
 await page.getByRole('button',{name:'Previous'}).click();
 await expect(page.getByLabel(/Your reasoning/)).toHaveValue('Blur every pixel without recognizing anything');
 await page.getByRole('button',{name:'See direct explanation'}).click();
 await expect(page.getByText(/Selective masking usually requires/)).toBeVisible();
 await page.getByRole('button',{name:'Continue'}).click();
 await expect(page.getByText(/You completed the learning journey/)).toBeVisible();
});
test('typing and advancing produce no POST requests',async({page})=>{
 const posts=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url())});
 await page.goto('/');await page.getByRole('button',{name:'Continue'}).click();
 await page.getByLabel(/Your reasoning/).fill('I can disagree');
 await page.getByRole('button',{name:'Continue with your answer'}).click();
 expect(posts).toEqual([]);
});
test('site fits mobile viewport and exposes progressbar',async({page})=>{
 await page.goto('/');await expect(page.getByRole('progressbar',{name:'Learning journey progress'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)).toBe(false);
});
