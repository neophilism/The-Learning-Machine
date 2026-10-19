export function addApproach(items,proposal,max=10){
 if(!Array.isArray(items)||items.some(x=>typeof x!=='string'||!x.trim()))throw new TypeError('Invalid approach list');
 if(typeof proposal!=='string'||!proposal.trim()||proposal.length>2000)throw new TypeError('Approach must be a bounded nonempty string');
 if(items.length>=max)throw new RangeError('Maximum number of approaches reached');
 const text=proposal.trim();if(items.some(x=>x.toLocaleLowerCase()===text.toLocaleLowerCase()))throw new RangeError('Duplicate approach');
 return Object.freeze([...items,text]);
}
export function mergeApproaches(items,draft=''){
 if(!Array.isArray(items)||typeof draft!=='string')throw new TypeError('Invalid alternatives');
 const all=[...items,...(draft.trim()?[draft.trim()]:[])];
 return all.join('\n— Alternative approach —\n');
}
