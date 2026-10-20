// Deterministic browser-local stratified train/test split. No learned model yet.
function rng(seed){
 let value=seed>>>0;
 return ()=>{
  value=(value+0x6d2b79f5)>>>0;let t=value;
  t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
  return ((t^(t>>>14))>>>0)/4294967296;
 };
}
function shuffle(items,random){
 const result=items.slice();
 for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}
 return result;
}
function validateDataset(dataset){
 if(!dataset||!Array.isArray(dataset.examples)||dataset.examples.length>64)throw new TypeError('Invalid local labeled dataset');
 const ids=new Set();
 for(const e of dataset.examples){
  if(!e||typeof e.id!=='string'||!e.id||typeof e.label!=='string'||!e.label||!Array.isArray(e.pixels)||e.pixels.length!==256)throw new TypeError('Invalid labeled example');
  if(ids.has(e.id))throw new TypeError('Dataset contains duplicate example IDs');
  ids.add(e.id);
 }
}
export function stratifiedHoldout(dataset,{seed=42,testFraction=0.25}={}){
 validateDataset(dataset);
 if(!Number.isInteger(seed)||seed<0||seed>2147483647)throw new RangeError('Seed must be a nonnegative 31-bit integer');
 if(!Number.isFinite(testFraction)||testFraction<0.1||testFraction>0.5)throw new RangeError('Test fraction must be between 0.1 and 0.5');
 const groups=new Map();
 for(const example of dataset.examples){
  const list=groups.get(example.label)||[];list.push(example.id);groups.set(example.label,list);
 }
 const classes=[...groups.keys()].sort((a,b)=>a.localeCompare(b));
 const random=rng(seed),trainIds=[],testIds=[],breakdown=[],warnings=[];
 for(const label of classes){
  const ids=shuffle(groups.get(label),random);
  const wanted=ids.length>=2?Math.max(1,Math.min(ids.length-1,Math.round(ids.length*testFraction))):0;
  const test=ids.slice(0,wanted),train=ids.slice(wanted);
  testIds.push(...test);trainIds.push(...train);
  breakdown.push(Object.freeze({label,total:ids.length,train:train.length,test:test.length}));
  if(ids.length<2)warnings.push('Class "'+label+'" needs at least two examples to hold one out for testing.');
 }
 if(classes.length<2)warnings.push('At least two distinct class labels are required for classification.');
 if(dataset.examples.length===0)warnings.push('Collect original labeled examples before dividing them.');
 const result=Object.freeze({algorithm:'stratified-fisher-yates-v1',seed,testFraction,trainIds:Object.freeze(trainIds),testIds:Object.freeze(testIds),
  classes:Object.freeze(breakdown),warnings:Object.freeze(warnings),ready:classes.length>=2&&breakdown.every(b=>b.train>=1&&b.test>=1),
  source:'browser-local-labeled-examples'});
 validateHoldout(result,dataset);
 return result;
}
export function validateHoldout(split,dataset){
 validateDataset(dataset);
 if(!split||!Array.isArray(split.trainIds)||!Array.isArray(split.testIds))throw new TypeError('Invalid split');
 const ids=dataset.examples.map(e=>e.id);
 const train=new Set(split.trainIds),test=new Set(split.testIds);
 if(train.size!==split.trainIds.length||test.size!==split.testIds.length)throw new RangeError('Repeated example in a split');
 if([...train].some(id=>test.has(id)))throw new RangeError('Training/test leakage');
 const all=new Set([...train,...test]);
 if(all.size!==ids.length||ids.some(id=>!all.has(id)))throw new RangeError('Split does not cover exactly the selected dataset');
 return true;
}
