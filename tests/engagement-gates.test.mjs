import test from 'node:test';
import assert from 'node:assert/strict';
import { assessEngagement } from '../diagnostic-case-lab/engagement-gates.mjs';

const acceptedScope = {
  issueCount: 1, issueType: 'webhook', issueSummary: 'Fictional save fails after HTTP 200',
  ownerAuthorizationVerified: true, safeEnvironmentApproved: true, sanitizedEvidenceAgreed: true,
  scopeReference: 'SYN-ONLY', customerAcceptedScope: true, customerAcceptedPrice: true,
  customerAcceptedExclusions: true, deliveryTargetWithTimezone: 'Fictional Monday UTC',
  clarificationWindow: 'Fictional 48 hours', customerReviewer: 'Synthetic reviewer',
  founderApprovedPaymentRoute: true, customerAcceptedPaymentTerms: true,
  paymentTiming: 'before-start', processorEvidenceVerified: true
};

test('empty inquiry cannot be invoiced, diagnosed, delivered or accepted', () => {
  const result = assessEngagement();
  assert.equal(result.externalSideEffects, false);
  assert.equal(result.advisoryOnly, true);
  assert.equal(result.readyForAuthorizedInvoice, false);
  assert.equal(result.mayBeginUnderAgreedTerms, false);
  assert.equal(result.acceptedByCustomer, false);
  assert.equal(result.blockedBy.length, 9);
});

test('two issues or unsupported issue type fail the fit gate', () => {
  assert.equal(assessEngagement({ ...acceptedScope, issueCount: 2 }).readyForAuthorizedInvoice, false);
  assert.equal(assessEngagement({ ...acceptedScope, issueType: 'account-recovery' }).readyForAuthorizedInvoice, false);
});

test('owner authority and sanitized evidence are mandatory', () => {
  assert.equal(assessEngagement({ ...acceptedScope, ownerAuthorizationVerified: false }).mayBeginUnderAgreedTerms, false);
  assert.equal(assessEngagement({ ...acceptedScope, sanitizedEvidenceAgreed: false }).readyForAuthorizedInvoice, false);
});

test('a bare inquiry or silence is not written scope acceptance', () => {
  assert.equal(assessEngagement({ ...acceptedScope, customerAcceptedScope: false }).readyForAuthorizedInvoice, false);
  assert.equal(assessEngagement({ ...acceptedScope, customerAcceptedExclusions: false }).readyForAuthorizedInvoice, false);
});

test('founder-approved method and agreed terms gate invoice readiness', () => {
  assert.equal(assessEngagement({ ...acceptedScope, founderApprovedPaymentRoute: false }).readyForAuthorizedInvoice, false);
  assert.equal(assessEngagement({ ...acceptedScope, customerAcceptedPaymentTerms: false }).readyForAuthorizedInvoice, false);
  assert.equal(assessEngagement(acceptedScope).readyForAuthorizedInvoice, true);
});

test('prepayment needs verified processor evidence before diagnosis', () => {
  const decision = assessEngagement({ ...acceptedScope, processorEvidenceVerified: false });
  assert.equal(decision.readyForAuthorizedInvoice, true);
  assert.equal(decision.mayBeginUnderAgreedTerms, false);
  assert.equal(decision.reportReadyForCustomer, false);
});

test('agreed post-report billing may proceed only on affirmative postpay terms', () => {
  const afterReport = { ...acceptedScope, paymentTiming: 'after-report', processorEvidenceVerified: false };
  assert.equal(assessEngagement(afterReport).mayBeginUnderAgreedTerms, false);
  assert.equal(assessEngagement({ ...afterReport, customerAcceptedPostpay: true }).mayBeginUnderAgreedTerms, true);
});

test('a written report or delivery timestamp cannot manufacture acceptance', () => {
  const report = { ...acceptedScope, reportWritten: true, reportEvidenceSanitized: true,
    reportLimitationsListed: true };
  assert.equal(assessEngagement(report).reportReadyForCustomer, true);
  assert.equal(assessEngagement(report).deliveredToReviewer, false);
  assert.equal(assessEngagement({ ...report, deliveryReceiptReference: 'SYN-RECEIPT', customerReviewerReceived: true }).acceptedByCustomer, false);
});

test('only explicit reviewer acceptance completes a fictional test engagement', () => {
  const report = { ...acceptedScope, reportWritten: true, reportEvidenceSanitized: true,
    reportLimitationsListed: true, deliveryReceiptReference: 'SYN-RECEIPT',
    customerReviewerReceived: true, customerAcceptanceDecision: 'accepted',
    customerAcceptanceReference: 'SYN-ACK' };
  const result = assessEngagement(report);
  assert.equal(result.deliveredToReviewer, true);
  assert.equal(result.acceptedByCustomer, true);
  assert.equal(result.blockedBy.length, 0);
  assert.equal(report.externalSideEffects, undefined);
});

test('invalid record shapes fail closed', () => {
  assert.throws(() => assessEngagement(null), TypeError);
  assert.throws(() => assessEngagement([]), TypeError);
  assert.throws(() => assessEngagement('fictional'), TypeError);
});
