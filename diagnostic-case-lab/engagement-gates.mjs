// Pure decision aid for an actual one-issue diagnostic engagement.
// It does not verify caller-provided evidence, send mail, invoice, charge or persist data.
const ISSUE_TYPES = new Set(['node-api', 'webhook', 'lead-form']);
const TIMINGS = new Set(['before-start', 'after-report']);

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function assessEngagement(record = {}) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new TypeError('Expected one engagement record object');
  }
  const checks = [
    ['one_issue', record.issueCount === 1 && ISSUE_TYPES.has(record.issueType) && hasText(record.issueSummary),
      'One explicitly described Node API, webhook, or lead-form issue'],
    ['authority', record.ownerAuthorizationVerified === true && record.safeEnvironmentApproved === true &&
      record.sanitizedEvidenceAgreed === true, 'Authorized system owner, exact safe environment and sanitized evidence'],
    ['written_scope', hasText(record.scopeReference) && record.customerAcceptedScope === true &&
      record.customerAcceptedPrice === true && record.customerAcceptedExclusions === true,
      'Affirmative customer acceptance of one-issue scope, $150 fee and exclusions'],
    ['schedule', hasText(record.deliveryTargetWithTimezone) && hasText(record.clarificationWindow) &&
      hasText(record.customerReviewer), 'Agreed delivery target, time zone, clarification window and reviewer'],
    ['merchant_gate', record.founderApprovedPaymentRoute === true &&
      record.customerAcceptedPaymentTerms === true && TIMINGS.has(record.paymentTiming),
      'Founder-approved payment route and customer-agreed payment terms (not a live checkout)'],
    ['start_payment_condition', record.paymentTiming === 'after-report' ?
      record.customerAcceptedPostpay === true : record.processorEvidenceVerified === true,
      'Agreed post-report terms or independently verified prepayment evidence'],
    ['report_complete', record.reportWritten === true && record.reportEvidenceSanitized === true &&
      record.reportLimitationsListed === true, 'Evidence-backed report complete with redactions and limitations'],
    ['delivery_receipt', hasText(record.deliveryReceiptReference) && record.customerReviewerReceived === true,
      'Deliverable receipt and named reviewer acknowledgment'],
    ['explicit_acceptance', record.customerAcceptanceDecision === 'accepted' &&
      hasText(record.customerAcceptanceReference), 'Explicit acceptance of the diagnostic report, not silence']
  ].map(([id, passed, criterion]) => ({ id, passed, criterion }));

  const passingThrough = (id) => checks.slice(0, checks.findIndex(check => check.id === id) + 1)
    .every(check => check.passed);
  const readyForAuthorizedInvoice = passingThrough('merchant_gate');
  const mayBeginUnderAgreedTerms = passingThrough('start_payment_condition');
  const reportReadyForCustomer = passingThrough('report_complete') && mayBeginUnderAgreedTerms;
  const deliveredToReviewer = passingThrough('delivery_receipt') && reportReadyForCustomer;
  const acceptedByCustomer = passingThrough('explicit_acceptance') && deliveredToReviewer;

  return {
    schema: 'wilke-one-issue-engagement-gates-v1',
    externalSideEffects: false,
    advisoryOnly: true,
    checks,
    readyForAuthorizedInvoice,
    mayBeginUnderAgreedTerms,
    reportReadyForCustomer,
    deliveredToReviewer,
    acceptedByCustomer,
    blockedBy: checks.filter(check => !check.passed).map(check => check.id)
  };
}
