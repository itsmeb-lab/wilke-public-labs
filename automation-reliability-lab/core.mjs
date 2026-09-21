export class ReliabilityEngine {
  constructor(clock = () => new Date().toISOString()) {
    this.clock = clock;
    this.events = [];
    this.stats = { runs: 0, recovered: 0, duplicates: 0, pendingApprovals: 0 };
    this.completedKeys = new Set();
    this.pending = null;
    this.sequence = 0;
  }

  receipt(event, detail, state = "OK", meta = {}) {
    const item = {
      seq: ++this.sequence,
      at: this.clock(),
      event,
      detail,
      state,
      ...meta,
    };
    this.events.push(item);
    return item;
  }

  start(key, mode = "success") {
    if (!key?.trim()) throw new Error("An idempotency key is required.");
    const normalizedKey = key.trim();

    if (this.completedKeys.has(normalizedKey)) {
      this.stats.duplicates += 1;
      this.receipt("DUPLICATE_SUPPRESSED", `Request ${normalizedKey} already completed`, "BLOCKED", { key: normalizedKey });
      return { status: "duplicate", key: normalizedKey };
    }

    this.stats.runs += 1;
    this.receipt("REQUEST_RECEIVED", `Accepted ${normalizedKey}`, "OK", { key: normalizedKey, mode });
    this.receipt("INPUT_VALIDATED", "Required fields and demo policy passed", "OK", { key: normalizedKey });

    if (mode === "gated") {
      this.pending = { key: normalizedKey, action: "simulated consequential dispatch" };
      this.stats.pendingApprovals = 1;
      this.receipt("APPROVAL_REQUIRED", "Dispatch paused pending explicit human decision", "WAITING", { key: normalizedKey });
      return { status: "waiting_approval", key: normalizedKey };
    }    this.receipt("IDEMPOTENCY_GUARD", "No prior completed request with this key", "OK", { key: normalizedKey });

    if (mode === "recover") {
      this.receipt("PRIMARY_ATTEMPT_FAILED", "Injected provider failure for demo", "FAILED", { key: normalizedKey, attempt: 1 });
      this.receipt("RETRY_SCHEDULED", "Bounded retry scheduled", "RECOVERING", { key: normalizedKey, attempt: 2 });
      this.receipt("RETRY_FAILED", "Injected second provider failure for demo", "FAILED", { key: normalizedKey, attempt: 2 });
      this.receipt("FALLBACK_ACTIVATED", "Switched to sandbox fallback path", "RECOVERING", { key: normalizedKey });
      this.stats.recovered += 1;
    } else {
      this.receipt("PRIMARY_ATTEMPT_OK", "Primary sandbox path succeeded", "OK", { key: normalizedKey, attempt: 1 });
    }

    this.receipt("SIMULATED_DISPATCH", "No external side effect; sandbox dispatch recorded", "OK", { key: normalizedKey });
    return this.complete(normalizedKey, mode === "recover" ? "RECOVERED" : "SUCCESS");
  }

  decide(approved) {
    if (!this.pending) throw new Error("There is no pending approval.");
    const { key } = this.pending;
    this.pending = null;
    this.stats.pendingApprovals = 0;

    if (!approved) {
      this.receipt("APPROVAL_REJECTED", "Human rejected the consequential action", "BLOCKED", { key });
      return this.complete(key, "REJECTED");
    }

    this.receipt("APPROVAL_GRANTED", "Human explicitly approved the consequential action", "OK", { key });
    this.receipt("SIMULATED_DISPATCH", "Approved sandbox dispatch recorded; no external side effect", "OK", { key });
    return this.complete(key, "SUCCESS");
  }

  complete(key, outcome) {
    this.completedKeys.add(key);
    this.receipt("WORKFLOW_COMPLETED", `Terminal outcome: ${outcome}`, outcome, { key });
    return { status: outcome.toLowerCase(), key, outcome };
  }

  exportReceipts() {
    return JSON.stringify({
      generated_at: this.clock(),
      sandbox: true,
      stats: this.stats,
      events: this.events,
    }, null, 2);
  }

  reset() {
    this.events = [];
    this.stats = { runs: 0, recovered: 0, duplicates: 0, pendingApprovals: 0 };
    this.completedKeys.clear();
    this.pending = null;
    this.sequence = 0;
  }
}