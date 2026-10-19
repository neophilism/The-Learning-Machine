import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';
const html=readFileSync(new URL('../apps/web/dist/index.html',import.meta.url),'utf8');
for(const s of ['<html lang="en"','<main','The Learning Machine','Learning begins with a question','Interactive Socratic learning exercise'])assert.ok(html.includes(s),'Missing built page: '+s);
console.log('Built public shell includes its compiled Socratic experience and semantic landmarks.');
