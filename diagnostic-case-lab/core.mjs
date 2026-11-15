// Deterministic teaching fixtures only. No requests, storage writes or outbound email.
export const CASE_ID = "SYN-API-001";
export const FIXTURES = Object.freeze({
  rejected_save: Object.freeze({
    label: "Save rejected",
    applicationSuccess: false,
    savedRows: 0,
    savedReference: null,
    reason: "The storage adapter rejected the write."
  }),
  missing_reference: Object.freeze({
    label: "Success flag without a record",
    applicationSuccess: true,
    savedRows: 0,
    savedReference: null,
    reason: "A success flag was returned without a verifiable saved record."
  }),
  confirmed_save: Object.freeze({
    label: "One record confirmed",
    applicationSuccess: true,
    savedRows: 1,
    savedReference: "SYN-0001",
    reason: "The fixture has one matching saved record."
  })
});

export function diagnose(fixtureKey = "rejected_save", displayRule = "legacy") {
  if (!Object.hasOwn(FIXTURES, fixtureKey)) throw new RangeError("Unknown synthetic fixture");
  if (!["legacy", "guarded"].includes(displayRule)) throw new RangeError("Unknown display rule");

  const fixture = FIXTURES[fixtureKey];
  const transport = { httpStatus: 200, httpOk: true };
  const application = { success: fixture.applicationSuccess };
  const persistence = { savedRows: fixture.savedRows, reference: fixture.savedReference };
  const saved = application.success === true &&
    persistence.savedRows === 1 &&
    typeof persistence.reference === "string" &&
    persistence.reference.length > 0;
  const claimsSuccess = displayRule === "legacy" ? transport.httpOk : saved;
  const statusMessage = displayRule === "legacy"
    ? "Sent"
    : saved
      ? "Saved: " + persistence.reference + ". Notification not verified."
      : "Not saved. Keep the form contents and retry only after checking the error.";
  const falseSuccess = claimsSuccess && !saved;
  const trace = [
    { stage: "TRANSPORT", observation: "HTTP 200 returned", state: "OBSERVED" },
    { stage: "APPLICATION", observation: application.success ? "success=true" : "success=false", state: application.success ? "CLAIMED" : "FAILED" },
    { stage: "PERSISTENCE", observation: "Rows=" + persistence.savedRows + "; reference=" + (persistence.reference ?? "missing"), state: saved ? "VERIFIED" : "NOT_VERIFIED" },
    { stage: "UI", observation: statusMessage, state: falseSuccess ? "MISLEADING" : "TRUTHFUL" },
    { stage: "DELIVERY", observation: "Recipient inbox was not checked", state: "UNKNOWN" }
  ];
  const checks = [
    { name: "Transport response collected", passed: transport.httpOk, note: "HTTP 200 alone is not acceptance." },
    { name: "Saved record and reference agree", passed: saved, note: saved ? "One fixture row matches SYN-0001." : "No validated saved record exists." },
    { name: "User-visible state is truthful", passed: !falseSuccess, note: falseSuccess ? "The UI says Sent without evidence of a saved record." : "No unsupported save-success claim." },
    { name: "Notification not claimed delivered", passed: !statusMessage.includes("Delivered"), note: "Delivery is out of scope for this isolated fixture." }
  ];

  return {
    caseId: CASE_ID,
    synthetic: true,
    externalSideEffects: false,
    fixture: fixtureKey,
    fixtureLabel: fixture.label,
    displayRule,
    reason: fixture.reason,
    transport,
    application,
    persistence,
    ui: { message: statusMessage, claimsSuccess },
    diagnosis: {
      recordedFailure: falseSuccess,
      acceptedSaved: saved,
      notificationDelivery: "unknown",
      recommendedChange: "Gate the success message on an application result and a verified saved reference, not HTTP status alone."
    },
    checks,
    trace
  };
}
