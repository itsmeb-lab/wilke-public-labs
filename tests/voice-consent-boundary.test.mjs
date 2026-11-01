import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntheticHandoff,SCENARIOS} from '../voice-to-crm-handoff/engine.mjs';
const base=()=>({...SCENARIOS.appointment.call});
const invalid=[['text_false','false'],['text_true','true'],['text_empty',''],['one',1],['zero',0],['null',null],['undefined',undefined],['object',{}],['array',[]]];
function rejected(input){const r=new SyntheticHandoff().process(input);assert.equal(r.status,'VALIDATION_REJECTED');assert.equal(r.handoffCreated,false);assert.notEqual(r.sms,'PREVIEW_ONLY');assert.equal(r.externalCalls,0);assert.equal(r.persisted,false);}
for(const key of ['consentSms','urgent'])for(const [label,value] of invalid)test(`${key} rejects ${label}, not truthiness`,()=>rejected({...base(),[key]:value}));
for(const key of ['id','at','caller','intent','consentSms','urgent']){
 test(`required own field ${key} cannot be omitted`,()=>{const x=base();delete x[key];rejected(x);});
 test(`required field ${key} cannot be inherited`,()=>{const x=base();const v=x[key];delete x[key];Object.setPrototypeOf(x,{[key]:v});rejected(x);});
}
test('array with otherwise valid properties is rejected',()=>rejected(Object.assign([],base())));
test('literal false preserves ordinary handoff but suppresses SMS',()=>{const r=new SyntheticHandoff().process({...base(),consentSms:false});assert.equal(r.status,'OWNER_REVIEW_REQUIRED');assert.equal(r.sms,'SUPPRESSED');});
test('literal true permits preview only, never a send',()=>{const r=new SyntheticHandoff().process(base());assert.equal(r.sms,'PREVIEW_ONLY');assert.equal(r.externalCalls,0);assert.equal(r.persisted,false);});
test('urgent boolean true always suppresses SMS preview',()=>{const r=new SyntheticHandoff().process({...base(),urgent:true,consentSms:true});assert.equal(r.status,'HUMAN_REVIEW_REQUIRED');assert.equal(r.sms,'SUPPRESSED');});
test('urgent intent overrides consent even with urgent false',()=>{const r=new SyntheticHandoff().process({...base(),intent:'urgent',urgent:false,consentSms:true});assert.equal(r.status,'HUMAN_REVIEW_REQUIRED');assert.equal(r.sms,'SUPPRESSED');});
test('malformed consent does not reserve dedupe identity',()=>{const h=new SyntheticHandoff();assert.equal(h.process({...base(),consentSms:'false'}).status,'VALIDATION_REJECTED');assert.equal(h.process(base()).status,'OWNER_REVIEW_REQUIRED');assert.equal(h.process(base()).status,'REPLAY_SUPPRESSED');});
test('malformed replay is rejected without modifying accepted receipt',()=>{const h=new SyntheticHandoff();const first=h.process(base());assert.equal(h.process({...base(),consentSms:'false'}).status,'VALIDATION_REJECTED');const replay=h.process(base());assert.equal(replay.status,'REPLAY_SUPPRESSED');assert.equal(replay.receiptId,first.receiptId);assert.equal(replay.handoffCreated,false);});
