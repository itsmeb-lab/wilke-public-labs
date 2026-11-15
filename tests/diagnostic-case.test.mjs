import test from "node:test";
import assert from "node:assert/strict";
import { CASE_ID, FIXTURES, diagnose } from "../diagnostic-case-lab/core.mjs";

test("one-issue teaching fixture has explicit synthetic identity", () => {
  assert.equal(CASE_ID, "SYN-API-001");
  assert.equal(Object.keys(FIXTURES).length, 3);
  const result = diagnose();
  assert.equal(result.synthetic, true);
  assert.equal(result.externalSideEffects, false);
});

test("reproduces HTTP 200 false-success when storage rejects the save", () => {
  const result = diagnose("rejected_save", "legacy");
  assert.equal(result.transport.httpStatus, 200);
  assert.equal(result.application.success, false);
  assert.equal(result.persistence.savedRows, 0);
  assert.equal(result.ui.message, "Sent");
  assert.equal(result.diagnosis.recordedFailure, true);
  assert.equal(result.diagnosis.acceptedSaved, false);
});

test("guarded rendering preserves truthful failure with the same fixture", () => {
  const result = diagnose("rejected_save", "guarded");
  assert.equal(result.ui.claimsSuccess, false);
  assert.match(result.ui.message, /^Not saved/);
  assert.equal(result.diagnosis.recordedFailure, false);
  assert.equal(result.checks.find(check => check.name.includes("User-visible")).passed, true);
});

test("a success flag without matching reference is not accepted", () => {
  const result = diagnose("missing_reference", "guarded");
  assert.equal(result.application.success, true);
  assert.equal(result.diagnosis.acceptedSaved, false);
  assert.equal(result.persistence.reference, null);
});

test("one verified saved record is accepted without claiming email delivery", () => {
  const result = diagnose("confirmed_save", "guarded");
  assert.equal(result.diagnosis.acceptedSaved, true);
  assert.equal(result.persistence.savedRows, 1);
  assert.equal(result.ui.claimsSuccess, true);
  assert.match(result.ui.message, /Notification not verified/);
  assert.equal(result.diagnosis.notificationDelivery, "unknown");
});

test("receipt trace includes distinct transport, storage, UI and delivery evidence", () => {
  const result = diagnose("rejected_save", "legacy");
  assert.deepEqual(result.trace.map(item => item.stage), ["TRANSPORT", "APPLICATION", "PERSISTENCE", "UI", "DELIVERY"]);
  assert.equal(result.trace.find(item => item.stage === "UI").state, "MISLEADING");
  assert.equal(result.trace.find(item => item.stage === "DELIVERY").state, "UNKNOWN");
});

test("invalid fixture or display rule fails closed", () => {
  assert.throws(() => diagnose("not-real", "legacy"), RangeError);
  assert.throws(() => diagnose("rejected_save", "unsupported"), RangeError);
});
