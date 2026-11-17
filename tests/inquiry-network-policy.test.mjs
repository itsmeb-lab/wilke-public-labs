import test from 'node:test';
import assert from 'node:assert/strict';
import { allowInquiryRequest } from '../diagnostic-case-lab/inquiry-network-policy.mjs';

const offer = 'https://wilkeservices.com/software-diagnostic?utm_source=wilke_public_labs&utm_medium=referral&utm_campaign=software_diagnostic&utm_content=diagnostic_case_lab';
const check = (url, method = 'GET') => allowInquiryRequest({ url, method });

test('allow only exact published offer campaign and query-free static assets', () => {
  assert.equal(check(offer), true);
  assert.equal(check('https://wilkeservices.com/assets/software-diagnostic-DkKHF59w.js'), true);
  assert.equal(check('https://wilkeservices.com/favicon.ico'), true);
});

test('fail closed on any submission or arbitrary live API call', () => {
  assert.equal(check(offer, 'POST'), false);
  assert.equal(check('https://wilkeservices.com/api/quote?test=true'), false);
  assert.equal(check('https://wilkeservices.com/api/inquiry', 'PATCH'), false);
});

test('fail closed for analytics and other third-party hosts', () => {
  assert.equal(check('https://www.googletagmanager.com/gtag/js?id=G-FAKE'), false);
  assert.equal(check('https://grok.com/grok-app-builder/extensions.js'), false);
  assert.equal(check('https://lookalike.wilkeservices.com/assets/a.js'), false);
});

test('reject campaign spoofing, sensitive query values and duplicate parameters', () => {
  assert.equal(check(offer + '&email=visitor@example.invalid'), false);
  assert.equal(check(offer.replace('wilke_public_labs', 'sk_live_123')), false);
  assert.equal(check(offer + '&utm_source=wilke_public_labs'), false);
  assert.equal(check('https://wilkeservices.com/assets/index.js?token=secret'), false);
});

test('malformed and non-HTTP URLs do not create an allow rule', () => {
  assert.equal(check('javascript:alert(1)'), false);
  assert.equal(check('not a URL'), false);
  assert.equal(allowInquiryRequest(null), false);
});
