import {SYMBOL_KINDS} from './scene.mjs';

export const ICON_SIZE=5;
export const SAMPLE_SIZE=9;
const MAX_OFFSET=SAMPLE_SIZE-ICON_SIZE;
const TEMPLATE_ROWS=Object.freeze({
 circle:['01110','10001','10001','10001','01110'],
 diamond:['00100','01010','10001','01010','00100'],
 triangle:['00100','01010','10001','11111','00000'],
 bar:['00000','00000','11111','11111','00000']
});
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const item of Object.values(value))freeze(item);Object.freeze(value)}return value};
const assertKind=kind=>{if(!SYMBOL_KINDS.includes(kind))throw new RangeError('Unknown icon kind')};
const assertOffset=(value,name)=>{if(!Number.isInteger(value)||value<0||value>MAX_OFFSET)throw new RangeError(`${name} must be an integer from 0 to ${MAX_OFFSET}`)};
const template=kind=>TEMPLATE_ROWS[kind].join('').split('').map(value=>value==='1');

function assertSample(sample){
 if(!sample||sample.width!==SAMPLE_SIZE||sample.height!==SAMPLE_SIZE||!Array.isArray(sample.pixels)||sample.pixels.length!==SAMPLE_SIZE*SAMPLE_SIZE||sample.pixels.some(value=>typeof value!=='boolean'))throw new TypeError('Invalid icon sample');
 return sample;
}

export function renderIconSample(kind,offsetX=2,offsetY=2){
 assertKind(kind);assertOffset(offsetX,'offsetX');assertOffset(offsetY,'offsetY');
 const pixels=Array(SAMPLE_SIZE*SAMPLE_SIZE).fill(false),source=template(kind);
 for(let y=0;y<ICON_SIZE;y++)for(let x=0;x<ICON_SIZE;x++)if(source[y*ICON_SIZE+x])pixels[(y+offsetY)*SAMPLE_SIZE+x+offsetX]=true;
 return freeze({width:SAMPLE_SIZE,height:SAMPLE_SIZE,pixels});
}

function scoreWindow(sample,kind,offsetX,offsetY){
 const expected=template(kind);let intersection=0,union=0;
 for(let y=0;y<SAMPLE_SIZE;y++)for(let x=0;x<SAMPLE_SIZE;x++){
  const actual=sample.pixels[y*SAMPLE_SIZE+x];
  const inWindow=x>=offsetX&&x<offsetX+ICON_SIZE&&y>=offsetY&&y<offsetY+ICON_SIZE;
  const wanted=inWindow&&expected[(y-offsetY)*ICON_SIZE+x-offsetX];
  if(actual&&wanted)intersection++;
  if(actual||wanted)union++;
 }
 return union===0?0:intersection/union;
}

export function recognizeIcon(sample,{minimumScore=.9}={}){
 assertSample(sample);
 if(typeof minimumScore!=='number'||!Number.isFinite(minimumScore)||minimumScore<0||minimumScore>1)throw new RangeError('minimumScore must be between 0 and 1');
 let best={kind:null,score:0,offsetX:null,offsetY:null};
 for(const kind of SYMBOL_KINDS)for(let offsetY=0;offsetY<=MAX_OFFSET;offsetY++)for(let offsetX=0;offsetX<=MAX_OFFSET;offsetX++){
  const score=scoreWindow(sample,kind,offsetX,offsetY);
  if(score>best.score)best={kind,score,offsetX,offsetY};
 }
 return freeze(best.score>=minimumScore?best:{kind:null,score:best.score,offsetX:null,offsetY:null});
}

export function evaluateTarget(fixtures,target,{minimumScore=.9}={}){
 assertKind(target);if(!Array.isArray(fixtures)||fixtures.length===0)throw new TypeError('Fixtures must be a non-empty array');
 let truePositive=0,falsePositive=0,falseNegative=0,trueNegative=0;
 const results=fixtures.map((fixture,index)=>{
  if(!fixture||!SYMBOL_KINDS.includes(fixture.actual))throw new TypeError(`Invalid fixture at index ${index}`);
  const recognition=recognizeIcon(fixture.sample,{minimumScore});
  const expected=fixture.actual===target,detected=recognition.kind===target;
  if(expected&&detected)truePositive++;else if(!expected&&detected)falsePositive++;else if(expected)falseNegative++;else trueNegative++;
  return freeze({actual:fixture.actual,expected,detected,predicted:recognition.kind,score:recognition.score,offsetX:recognition.offsetX,offsetY:recognition.offsetY});
 });
 const precision=truePositive+falsePositive===0?null:truePositive/(truePositive+falsePositive);
 const recall=truePositive+falseNegative===0?null:truePositive/(truePositive+falseNegative);
 return freeze({target,counts:{truePositive,falsePositive,falseNegative,trueNegative},precision,recall,results});
}
