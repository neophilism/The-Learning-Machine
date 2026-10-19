export const STAGES = Object.freeze(['encounter','hypothesis','prediction','experiment','observation','explanation','challenge','revision','transfer','reflection','complete']);
const NEXT = Object.fromEntries(STAGES.slice(0,-1).map((v,i)=>[v,STAGES[i+1]]));
const REQUIRED = {hypothesis:'hypothesis',prediction:'prediction',observation:'observation',explanation:'explanation',revision:'revision',transfer:'transfer'};
export function initialState(experienceId='foundation-demo') { return {experienceId, stage:'encounter', events:[], answers:{}}; }
export function transition(state, action) {
  if (!STAGES.includes(state?.stage)) throw new TypeError('Invalid learning state');
  if (!action || typeof action.type !== 'string') throw new TypeError('Invalid action');
  if(action.type==='RESET') return initialState(state.experienceId);
  if(action.type==='DIRECT_ANSWER') return {...state,stage:'reflection',events:[...state.events,{type:action.type}]};
  if(action.type==='BACK') {const index=STAGES.indexOf(state.stage);return {...state,stage:STAGES[Math.max(0,index-1)],events:[...state.events,{type:action.type}]};}
  if(action.type!=='ADVANCE') throw new RangeError('Unknown action');
  if(state.stage==='complete') return state;
  const required=REQUIRED[state.stage];
  if(required && (typeof action.answer!=='string' || !action.answer.trim())) throw new RangeError(`Answer required for ${state.stage}`);
  const answers=required?{...state.answers,[required]:action.answer.trim()}:state.answers;
  const events=[...state.events,{type:'ADVANCE',from:state.stage,to:NEXT[state.stage],answer:required?action.answer.trim():null}];
  return {...state,stage:NEXT[state.stage],answers,events};
}
export function runFoundationDemonstration() {
 let state=initialState(); const answers={hypothesis:'Detect the symbol before masking it',prediction:'Blanket blur will not require recognition',observation:'Blanket blur covers all pixels without recognizing a target',explanation:'Selective detection analyzes content, while blanket blur does not',revision:'Recognition is necessary for selective masking, not every blur',transfer:'A speech censor needs recognition, muting all audio does not'};
 while(state.stage!=='complete') state=transition(state,{type:'ADVANCE',answer:answers[state.stage]});
 return state;
}
