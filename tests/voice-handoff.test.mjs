import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENARIOS,SyntheticHandoff,isBusinessHours,simulateScenario} from '../voice-to-crm-handoff/engine.mjs';

test('daytime appointment goes to owner review without external side effects',()=>{
  const {receipt:r}=simulateScenario('appointment');
  assert.equal(r.status,'OWNER_REVIEW_REQUIRED');
  assert.equal(r.owner,'Scheduling desk');
  assert.equal(r.handoffCreated,true);
  assert.equal(r.sms,'PREVIEW_ONLY');
  assert.equal(r.persisted,false);
  assert.equal(r.externalCalls,0);
});
test('replayed webhook does not create duplicate handoff',()=>{
  const {receipt:r,first}=simulateScenario('duplicate');
  assert.equal(first.handoffCreated,true);
  assert.equal(r.status,'REPLAY_SUPPRESSED');
  assert.equal(r.handoffCreated,false);
  assert.equal(r.receiptId,first.receiptId);
});
test('after-hours caller needs callback review, not a booking',()=>{
  const {receipt:r}=simulateScenario('afterHours');
  assert.equal(r.status,'CALLBACK_REVIEW_REQUIRED');
  assert.match(r.owner,/callback/i);
});
test('without SMS consent no SMS preview is created',()=>{
  const {receipt:r}=simulateScenario('noConsent');
  assert.equal(r.sms,'SUPPRESSED');
  assert.equal(r.status,'OWNER_REVIEW_REQUIRED');
});
test('urgent issue remains human-only and suppresses SMS',()=>{
  const {receipt:r}=simulateScenario('urgent');
  assert.equal(r.status,'HUMAN_REVIEW_REQUIRED');
  assert.equal(r.sms,'SUPPRESSED');
  assert.match(r.owner,/human/i);
});
test('invalid caller does not create a handoff or poison dedupe map',()=>{
  const instance=new SyntheticHandoff(),invalid=SCENARIOS.invalid.call;
  assert.equal(instance.process(invalid).status,'VALIDATION_REJECTED');
  assert.equal(instance.process({...invalid,caller:'+12125550119'}).status,'OWNER_REVIEW_REQUIRED');
});
test('unknown scenario is rejected',()=>assert.throws(()=>simulateScenario('missing'),RangeError));
test('non-demo phone patterns are rejected by the sandbox guard',()=>{
  const r=new SyntheticHandoff().process({...SCENARIOS.appointment.call,caller:'+12125551234'});
  assert.equal(r.status,'VALIDATION_REJECTED');
});
test('non-demo call identifier is rejected',()=>{
  const r=new SyntheticHandoff().process({...SCENARIOS.appointment.call,id:'REAL-CLIENT-209'});
  assert.equal(r.status,'VALIDATION_REJECTED');
});
test('missing intent cannot route into handoff',()=>{
  const r=new SyntheticHandoff().process({...SCENARIOS.appointment.call,intent:null});
  assert.equal(r.handoffCreated,false);
});
test('weekend and after-hours are not business hours',()=>{
  assert.equal(isBusinessHours('2026-10-31T14:30:00Z'),false);
  assert.equal(isBusinessHours('2026-10-28T02:30:00Z'),false);
  assert.equal(isBusinessHours('2026-10-28T14:30:00Z'),true);
});
test('fixtures retain invented identifiers and reserved fictional phone numbers',()=>{
  for(const s of Object.values(SCENARIOS)){
    assert.match(s.call.id,/^DEMO-CALL-/);
    if(s.call.caller.startsWith('+1')) assert.match(s.call.caller,/55501/);
  }
});
