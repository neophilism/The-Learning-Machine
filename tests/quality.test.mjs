import test from 'node:test';import assert from 'node:assert/strict';
import {findForbiddenImports,checkBoundaries} from '../scripts/check-boundaries.mjs';
import {findCredentialPatterns,scanRepository} from '../scripts/scan-secrets.mjs';
test('internal package boundaries are not bypassed',()=>{assert.deepEqual(checkBoundaries(),[]);assert.deepEqual(findForbiddenImports("import x from '@unrelated/private';",new Set()),['@unrelated/private']);});
test('relative imports are allowed',()=>assert.deepEqual(findForbiddenImports("import x from './local.mjs';",new Set()),[]));
test('secret scanner detects synthetic tokens and never echoes full strings',()=>{const fake='gh'+'p_'+'A'.repeat(35);const hits=findCredentialPatterns(fake);assert.equal(hits.length,1);assert.ok(!hits[0].includes('A'.repeat(20)));});
test('repo contains no detected credential values',()=>assert.deepEqual(scanRepository(),[]));
