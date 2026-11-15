import { diagnose } from "./core.mjs";

const $ = (id) => document.getElementById(id);
let current = null;
const actions = [...document.querySelectorAll("[data-case]")];

function renderRows(body, items, columns) {
  const fragment = document.createDocumentFragment();
  for (const item of items) {
    const row = document.createElement("tr");
    for (const key of columns) {
      const cell = document.createElement("td");
      cell.textContent = String(item[key] ?? "");
      if (key === "state" || key === "result") cell.dataset.state = String(item[key] ?? "").toLowerCase();
      row.append(cell);
    }
    fragment.append(row);
  }
  body.replaceChildren(fragment);
}

function show(fixture, rule) {
  current = diagnose(fixture, rule);
  for (const action of actions) {
    action.setAttribute("aria-pressed", String(action.dataset.case === fixture && action.dataset.rule === rule));
  }
  $("caseName").textContent = current.fixtureLabel;
  $("resultStatus").textContent = current.diagnosis.recordedFailure ? "FALSE SUCCESS" :
    current.diagnosis.acceptedSaved ? "SAVED · NOT DELIVERED" : "NOT SAVED";
  $("resultStatus").dataset.state = current.diagnosis.recordedFailure ? "bad" :
    current.diagnosis.acceptedSaved ? "good" : "neutral";
  $("transportValue").textContent = "HTTP " + current.transport.httpStatus;
  $("applicationValue").textContent = "success=" + current.application.success;
  $("persistenceValue").textContent = current.persistence.savedRows + " row(s) · " + (current.persistence.reference ?? "no reference");
  $("uiValue").textContent = current.ui.message;
  $("finding").textContent = current.diagnosis.recordedFailure
    ? "The UI claims Sent because HTTP succeeded, even though no record was saved."
    : current.diagnosis.acceptedSaved
      ? "The save is verified in this fixture. Email delivery and owner acknowledgment remain untested."
      : "The UI declines to claim success because there is no verified saved record.";
  renderRows($("traceBody"), current.trace, ["stage", "observation", "state"]);
  renderRows($("checkBody"), current.checks.map(item => ({
    name: item.name,
    result: item.passed ? "PASS" : "NOT MET",
    note: item.note
  })), ["name", "result", "note"]);
}

actions.forEach(action => action.addEventListener("click", () => show(action.dataset.case, action.dataset.rule)));
$("downloadBtn").addEventListener("click", () => {
  if (!current) return;
  const payload = { exportedAt: new Date().toISOString(), ...current };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "synthetic-diagnostic-" + current.fixture + ".json";
  anchor.click();
  URL.revokeObjectURL(url);
});
show("rejected_save", "legacy");
