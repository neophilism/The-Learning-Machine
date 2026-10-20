import {readFileSync} from 'node:fs';
import {validateUsLawPack} from '../packages/evidence/src/authorities.mjs';
const path=new URL('../content/us-law/authorities.json',import.meta.url);
const pack=JSON.parse(readFileSync(path,'utf8'));
const status=validateUsLawPack(pack);
console.log('U.S. law content validated:',JSON.stringify(status.count),'decisions:',JSON.stringify(status.stances),'curated:',status.asOf);
