export const SCENE_WIDTH=24;
export const SCENE_HEIGHT=16;
export const MAX_SYMBOLS=12;
export const SYMBOL_KINDS=Object.freeze(['circle','diamond','triangle','bar']);
export const SYMBOL_COLORS=Object.freeze(['blue','gold','magenta','green']);

const PALETTE=Object.freeze({blue:'#176b87',gold:'#d08b00',magenta:'#a23b72',green:'#2d7d46'});
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const item of Object.values(value))freeze(item);Object.freeze(value)}return value};
const assertInteger=(value,name,min,max)=>{if(!Number.isInteger(value)||value<min||value>max)throw new RangeError(`${name} must be an integer from ${min} to ${max}`)};
const assertChoice=(value,values,name)=>{if(!values.includes(value))throw new RangeError(`Unknown ${name}`)};

function normalizeSymbol(symbol,index){
 if(!symbol||typeof symbol!=='object')throw new TypeError('Symbol must be an object');
 assertChoice(symbol.kind,SYMBOL_KINDS,'symbol kind');assertChoice(symbol.color,SYMBOL_COLORS,'symbol color');
 assertInteger(symbol.x,'x',1,SCENE_WIDTH);assertInteger(symbol.y,'y',1,SCENE_HEIGHT);
 return freeze({id:`symbol-${index+1}`,kind:symbol.kind,color:symbol.color,x:symbol.x,y:symbol.y});
}
function assertScene(scene){
 if(!scene||scene.version!==1||!Number.isInteger(scene.seed)||scene.seed<0||scene.seed>2147483647||!Array.isArray(scene.symbols)||scene.symbols.length>MAX_SYMBOLS)throw new TypeError('Invalid scene');
 scene.symbols.forEach((symbol,index)=>{const normalized=normalizeSymbol(symbol,index);if(symbol.id!==normalized.id)throw new TypeError('Symbols must use canonical IDs')});
 return scene;
}
function random(seed){let state=(seed>>>0)||0x6d2b79f5;return()=>{state+=0x6d2b79f5;let n=state;n=Math.imul(n^n>>>15,n|1);n^=n+Math.imul(n^n>>>7,n|61);return((n^n>>>14)>>>0)/4294967296}}

export function createScene(seed=17,count=5){
 assertInteger(seed,'seed',0,2147483647);assertInteger(count,'count',1,MAX_SYMBOLS);const next=random(seed);const symbols=[];
 for(let index=0;index<count;index++)symbols.push(normalizeSymbol({kind:SYMBOL_KINDS[Math.floor(next()*SYMBOL_KINDS.length)],color:SYMBOL_COLORS[Math.floor(next()*SYMBOL_COLORS.length)],x:1+Math.floor(next()*SCENE_WIDTH),y:1+Math.floor(next()*SCENE_HEIGHT)},index));
 return freeze({version:1,seed,symbols});
}
export function addSymbol(scene,input){assertScene(scene);if(scene.symbols.length>=MAX_SYMBOLS)throw new RangeError('Scene is full');return freeze({...scene,symbols:[...scene.symbols,normalizeSymbol(input,scene.symbols.length)]})}
export function removeLastSymbol(scene){assertScene(scene);if(scene.symbols.length===0)throw new RangeError('Scene is empty');return freeze({...scene,symbols:scene.symbols.slice(0,-1)})}
export function symbolColor(color){assertChoice(color,SYMBOL_COLORS,'symbol color');return PALETTE[color]}
export function describeScene(scene){assertScene(scene);const summary=`Reproducible scene seed ${scene.seed}: ${scene.symbols.length} original geometric ${scene.symbols.length===1?'symbol':'symbols'} on a ${SCENE_WIDTH} by ${SCENE_HEIGHT} grid.`;const items=scene.symbols.map((symbol,index)=>`${index+1}. ${symbol.color} ${symbol.kind} at column ${symbol.x}, row ${symbol.y}.`);return freeze({summary,items})}
export function snapshotScene(scene){assertScene(scene);return scene.symbols.map(({kind,color,x,y})=>`${kind}:${color}:${x},${y}`).join('|')}
