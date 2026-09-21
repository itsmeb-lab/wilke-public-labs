import test from "node:test";
import assert from "node:assert/strict";
import { ReliabilityEngine } from "../automation-reliability-lab/core.mjs";

const fixedClock = () => "2026-09-21T20:00:00.000Z";

test("successful workflow reaches terminal success", () => {
  const engine = new ReliabilityEngine(fixedClock);
  const result = engine.start("order-1", "success");
  assert.equal(result.outcome, "SUCCESS");
  assert.equal(engine.events.at(-1).event, "WORKFLOW_COMPLETED");
});

test("recovery workflow uses bounded retry and fallback", () => {
  const engine = new ReliabilityEngine(fixedClock);
  engine.start("order-2", "recover");
  assert.ok(engine.events.some((e) => e.event === "RETRY_SCHEDULED"));
  assert.ok(engine.events.some((e) => e.event === "FALLBACK_ACTIVATED"));
  assert.equal(engine.stats.recovered, 1);
});
test("gated action cannot dispatch before approval", () => {
  const engine = new ReliabilityEngine(fixedClock);
  const result = engine.start("order-3", "gated");
  assert.equal(result.status, "waiting_approval");
  assert.equal(engine.events.some((e) => e.event === "SIMULATED_DISPATCH"), false);
  engine.decide(true);
  assert.equal(engine.events.some((e) => e.event === "APPROVAL_GRANTED"), true);
});

test("duplicate completed request is suppressed", () => {
  const engine = new ReliabilityEngine(fixedClock);
  engine.start("order-4", "success");
  const replay = engine.start("order-4", "success");
  assert.equal(replay.status, "duplicate");
  assert.equal(engine.stats.duplicates, 1);
});

test("rejected approval ends without dispatch", () => {
  const engine = new ReliabilityEngine(fixedClock);
  engine.start("order-5", "gated");
  engine.decide(false);
  assert.equal(engine.events.some((e) => e.event === "APPROVAL_REJECTED"), true);
  assert.equal(engine.events.some((e) => e.event === "SIMULATED_DISPATCH"), false);
});
