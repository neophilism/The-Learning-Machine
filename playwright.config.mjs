import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',timeout:30000,expect:{timeout:10000},
 use:{baseURL:'http://127.0.0.1:4321'},
 projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['Pixel 5']}}],
 webServer:{command:'pnpm dev',url:'http://127.0.0.1:4321',reuseExistingServer:!process.env.CI,timeout:90000},
 workers:process.env.CI?2:undefined,retries:process.env.CI?1:0
});
