export const GRID_SIZE=16;
export const PIXEL_COUNT=GRID_SIZE*GRID_SIZE;
export const MAX_EXAMPLES=64;
const freeze=v=>{if(v&&typeof v==='object'){for(const item of Object.values(v))freeze(item);Object.freeze(v)}return v};
function validatePixels(pixels){
 if(!Array.isArray(pixels)||pixels.length!==PIXEL_COUNT||pixels.some(n=>n!==0&&n!==1))throw new TypeError('Expected a 16×16 binary drawing');
 return pixels;
}
function validateDataset(state){
 if(!state||!Array.isArray(state.examples)||!Number.isInteger(state.nextId)||state.nextId<1)throw new TypeError('Invalid local dataset state');
 return state;
}
function validateLabel(label){
 if(typeof label!=='string'||!label.trim()||label.trim().length>40)throw new TypeError('Label must be 1–40 characters');
 return label.trim();
}
export function blankDrawing(){return freeze(Array(PIXEL_COUNT).fill(0))}
export function setDrawingCell(pixels,row,col,filled=true){
 validatePixels(pixels);
 if(!Number.isInteger(row)||row<0||row>=GRID_SIZE||!Number.isInteger(col)||col<0||col>=GRID_SIZE||typeof filled!=='boolean')throw new RangeError('Drawing coordinate out of bounds');
 const next=pixels.slice();next[row*GRID_SIZE+col]=filled?1:0;
 return freeze(next);
}
export function presetDrawing(kind){
 if(!['diagonal','square','cross','horizontal'].includes(kind))throw new RangeError('Unknown original shape preset');
 const pixels=Array(PIXEL_COUNT).fill(0);
 for(let row=0;row<GRID_SIZE;row++)for(let col=0;col<GRID_SIZE;col++){
  let mark=false;
  if(kind==='diagonal')mark=Math.abs(row-col)<=1;
  if(kind==='square')mark=row>=3&&row<=12&&col>=3&&col<=12&&(row===3||row===12||col===3||col===12);
  if(kind==='cross')mark=Math.abs(col-7)<=1||Math.abs(row-7)<=1;
  if(kind==='horizontal')mark=row>=7&&row<=8&&col>=2&&col<=13;
  if(mark)pixels[row*GRID_SIZE+col]=1;
 }
 return freeze(pixels);
}
export function createShapeDataset(){return freeze({nextId:1,examples:[]})}
export function addShapeExample(state,label,pixels){
 validateDataset(state);const name=validateLabel(label);validatePixels(pixels);
 if(state.examples.length>=MAX_EXAMPLES)throw new RangeError('Dataset is full');
 if(!pixels.includes(1))throw new RangeError('Draw or choose a nonempty shape');
 const example={id:'ex-'+state.nextId,label:name,pixels:pixels.slice()};
 return freeze({nextId:state.nextId+1,examples:[...state.examples,example]});
}
export function removeShapeExample(state,id){
 validateDataset(state);
 if(typeof id!=='string'||!state.examples.some(ex=>ex.id===id))throw new RangeError('Unknown example');
 return freeze({nextId:state.nextId,examples:state.examples.filter(ex=>ex.id!==id)});
}
export function relabelShapeExample(state,id,newLabel){
 validateDataset(state);const label=validateLabel(newLabel);
 if(!state.examples.some(ex=>ex.id===id))throw new RangeError('Unknown example');
 return freeze({nextId:state.nextId,examples:state.examples.map(ex=>ex.id===id?{...ex,label}:ex)});
}
export function shapeCounts(state){
 validateDataset(state);
 const classes=new Map();
 for(const ex of state.examples)classes.set(ex.label,(classes.get(ex.label)||0)+1);
 return Object.freeze([...classes.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([label,count])=>Object.freeze({label,count})));
}
