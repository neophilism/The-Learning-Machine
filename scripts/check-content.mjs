import {readFileSync} from 'node:fs';
import {compileLearningModule} from '../packages/content/src/compiler.mjs';
const paths=['content/modules/intro-visual-reasoning.json'];
for(const path of paths){const m=JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));const compiled=compileLearningModule(m);console.log(compiled.lessonId+' compiled with '+compiled.nodes.length+' nodes, sha256='+compiled.digest);}
