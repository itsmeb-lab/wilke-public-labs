import { ReliabilityEngine } from "./core.mjs";

const engine = new ReliabilityEngine();
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const refs = {
  key: $("requestKey"),
  runs: $("runsStat"),
  recovered: $("recoveredStat"),
  duplicate: $("duplicateStat"),
  approval: $("approvalStat"),
  stateChip: $("stateChip"),
  stateSubtitle: $("stateSubtitle"),
  approvalBox: $("approvalBox"),
  approvalText: $("approvalText"),
  receiptBody: $("receiptBody"),
  receiptCount: $("receiptCount"),
  healthBadge: $("healthBadge"),
};

function setState(label, subtitle, tone = "neutral") {
  refs.stateChip.textContent = label;
  refs.stateSubtitle.textContent = subtitle;
  refs.stateChip.dataset.tone = tone;
}

function resetFlow() {
  document.querySelectorAll(".flow-step").forEach((step) => {
    step.classList.remove("active", "done", "failed");
  });
  document.querySelectorAll(".flow-line").forEach((line) => line.classList.remove("done"));
}

function markStep(name, state = "done") {
  const step = document.querySelector(`[data-step="${name}"]`);
  if (step) step.classList.add(state);
  const steps = [...document.querySelectorAll(".flow-step")];
  const index = steps.indexOf(step);
  document.querySelectorAll(".flow-line").forEach((line, i) => {
    if (i < index) line.classList.add("done");
  });
}

function renderStats() {
  refs.runs.textContent = engine.stats.runs;
  refs.recovered.textContent = engine.stats.recovered;
  refs.duplicate.textContent = engine.stats.duplicates;
  refs.approval.textContent = engine.stats.pendingApprovals;
}

function stateClass(state) {
  if (["FAILED", "BLOCKED", "REJECTED"].includes(state)) return "state-bad";
  if (["WAITING", "RECOVERING", "RECOVERED"].includes(state)) return "state-warn";
  return "state-ok";
}function renderReceipts() {
  refs.receiptCount.textContent = `${engine.events.length} event${engine.events.length === 1 ? "" : "s"}`;
  if (!engine.events.length) {
    refs.receiptBody.innerHTML = '<tr class="empty-row"><td colspan="5">Run a scenario to generate evidence.</td></tr>';
    return;
  }
  refs.receiptBody.innerHTML = engine.events.slice().reverse().map((e) => `
    <tr>
      <td>${e.seq}</td>
      <td>${new Date(e.at).toLocaleTimeString()}</td>
      <td class="event-name">${e.event}</td>
      <td>${e.detail}</td>
      <td class="${stateClass(e.state)}">${e.state}</td>
    </tr>`).join("");
}

function render() {
  renderStats();
  renderReceipts();
}

async function animateCommonStart() {
  resetFlow();
  refs.approvalBox.classList.add("hidden");
  setState("RUNNING", "Request received. Validating input and policy.", "running");
  markStep("received", "active");
  await sleep(220);
  markStep("received");
  markStep("validated", "active");
  await sleep(220);
  markStep("validated");
  markStep("guarded", "active");
}

async function run(mode) {
  const key = refs.key.value.trim();
  if (!key) {
    refs.key.focus();
    return;
  }

  await animateCommonStart();
  const before = engine.events.length;
  const result = engine.start(key, mode);
  render();

  if (result.status === "duplicate") {
    resetFlow();
    setState("BLOCKED", "Duplicate request suppressed before dispatch.", "blocked");
    markStep("received");
    markStep("validated");
    markStep("guarded", "failed");
    return;
  }

  markStep("guarded");
  if (result.status === "waiting_approval") {
    setState("WAITING", "Consequential dispatch is paused for explicit approval.", "waiting");
    refs.approvalBox.classList.remove("hidden");
    refs.approvalText.textContent = `Request ${key} is waiting. No dispatch can occur until you approve or reject it.`;
    return;
  }  if (mode === "recover") {
    setState("RECOVERING", "Primary path failed. Bounded retry and fallback are running.", "recovering");
    markStep("dispatched", "failed");
    await sleep(420);
    markStep("dispatched");
  } else {
    setState("DISPATCHED", "Sandbox dispatch recorded. No external side effect occurred.", "running");
    markStep("dispatched", "active");
    await sleep(260);
    markStep("dispatched");
  }

  markStep("completed");
  setState(result.outcome, mode === "recover" ? "Workflow recovered through the fallback path." : "Workflow completed successfully.", "ok");
  if (engine.events.length === before) render();
}

async function decide(approved) {
  if (!engine.pending) return;
  markStep("guarded");
  setState(approved ? "APPROVED" : "REJECTED", approved ? "Approval granted. Completing sandbox dispatch." : "Approval rejected. Dispatch remains blocked.", approved ? "ok" : "blocked");
  refs.approvalBox.classList.add("hidden");
  await sleep(260);
  const result = engine.decide(approved);
  render();

  if (approved) {
    markStep("dispatched");
    markStep("completed");
  } else {
    markStep("dispatched", "failed");
    markStep("completed");
  }
  setState(result.outcome, approved ? "Approved workflow completed with an inspectable receipt." : "Workflow ended without dispatch.", approved ? "ok" : "blocked");
}

function downloadReceipts() {
  const blob = new Blob([engine.exportReceipts()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `automation-reliability-receipts-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function resetDemo() {
  engine.reset();
  resetFlow();
  refs.approvalBox.classList.add("hidden");
  refs.key.value = "demo-order-001";
  setState("IDLE", "No run started yet.");
  render();
}$("successBtn").addEventListener("click", () => run("success"));
$("failureBtn").addEventListener("click", () => run("recover"));
$("approvalBtn").addEventListener("click", () => run("gated"));
$("replayBtn").addEventListener("click", () => run("success"));
$("approveBtn").addEventListener("click", () => decide(true));
$("rejectBtn").addEventListener("click", () => decide(false));
$("downloadBtn").addEventListener("click", downloadReceipts);
$("resetBtn").addEventListener("click", resetDemo);

render();
