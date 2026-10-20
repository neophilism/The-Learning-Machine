import {rasterizeScene} from './pixels.mjs';
import {recognizeIcon,renderIconSample} from './recognizer.mjs';
import {SCENE_HEIGHT,SCENE_WIDTH,SYMBOL_KINDS} from './scene.mjs';

export const MASK_MODES=Object.freeze(['manual','blanket','selective']);
const MASK_RGBA=Object.freeze([28,41,54,255]);
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const item of Object.values(value))freeze(item);Object.freeze(value)}return value};
const cellKey=(x,y)=>`${x},${y}`;
function assertCell(cell){if(!cell||!Number.isInteger(cell.x)||cell.x<1||cell.x>SCENE_WIDTH||!Number.isInteger(cell.y)||cell.y<1||cell.y>SCENE_HEIGHT)throw new RangeError('Mask cell is outside the frame');return cell}

export function maskScene(scene,{mode='manual',manualCells=[],target='circle'}={}){
 if(!MASK_MODES.includes(mode))throw new RangeError('Unknown mask mode');
 if(!Array.isArray(manualCells))throw new TypeError('manualCells must be an array');
 if(mode==='selective'&&!SYMBOL_KINDS.includes(target))throw new RangeError('Unknown selective target');
 const source=rasterizeScene(scene),cells=new Set(),manual=manualCells.map(assertCell);let recognitionRuns=0;
 if(mode==='manual')for(const cell of manual)cells.add(cellKey(cell.x,cell.y));
 if(mode==='blanket')for(let y=1;y<=SCENE_HEIGHT;y++)for(let x=1;x<=SCENE_WIDTH;x++){const offset=((y-1)*SCENE_WIDTH+x-1)*4;if(source.rgba[offset]!==255||source.rgba[offset+1]!==255||source.rgba[offset+2]!==255)cells.add(cellKey(x,y))}
 if(mode==='selective')for(const symbol of scene.symbols){recognitionRuns++;const result=recognizeIcon(renderIconSample(symbol.kind,(symbol.x-1)%5,(symbol.y-1)%5));if(result.kind===target)cells.add(cellKey(symbol.x,symbol.y))}
 const rgba=source.rgba.slice();for(const key of cells){const [x,y]=key.split(',').map(Number),offset=((y-1)*SCENE_WIDTH+x-1)*4;rgba.splice(offset,4,...MASK_RGBA)}
 return freeze({mode,target:mode==='selective'?target:null,maskedPixels:cells.size,recognitionRuns,frame:{width:SCENE_WIDTH,height:SCENE_HEIGHT,rgba}});
}
