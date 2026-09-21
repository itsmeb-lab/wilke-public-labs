import test from 'node:test';
import assert from 'node:assert/strict';
import {WatchdogEngine} from '../windows-process-recovery-watchdog/core.mjs';
const clock=()=> '2026-09-21T23:00:00.000Z';
test('starts when absent',()=>{const e=new WatchdogEngine(clock);const r=e.check();assert.equal(r.status,'started');assert.equal(e.running,true);assert.equal(e.stats.starts,1);});
test('healthy check avoids duplicate start',()=>{const e=new WatchdogEngine(clock);const a=e.check();const pid=a.pid;const b=e.check();assert.equal(b.status,'healthy');assert.equal(b.pid,pid);assert.equal(e.stats.duplicatesAvoided,1);});
test('restarts after crash with new pid',()=>{const e=new WatchdogEngine(clock);const first=e.check().pid;e.crash();const r=e.check();assert.equal(r.status,'restarted');assert.notEqual(r.pid,first);assert.equal(e.stats.restarts,1);});
test('receipts include crash and recovery',()=>{const e=new WatchdogEngine(clock);e.check();e.crash();e.check();assert.ok(e.events.some(x=>x.event==='PROCESS_EXITED'));assert.ok(e.events.some(x=>x.event==='RESTARTED'));});