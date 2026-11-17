// Explicit deny-by-default policy for synthetic in-memory inquiry QA.
// No site form submission or arbitrary query token may leave this browser.
export function allowInquiryRequest(request) {
  let url;
  try { url = new URL(request?.url); } catch { return false; }
  if (url.origin !== 'https://wilkeservices.com' || request?.method !== 'GET') return false;
  if (url.pathname === '/software-diagnostic') {
    const campaign = new Map([
      ['utm_source', 'wilke_public_labs'], ['utm_medium', 'referral'],
      ['utm_campaign', 'software_diagnostic'], ['utm_content', 'diagnostic_case_lab']
    ]);
    return url.searchParams.size === campaign.size &&
      [...url.searchParams].every(([key, value]) => campaign.get(key) === value);
  }
  return url.search === '' && (url.pathname.startsWith('/assets/') ||
    url.pathname === '/favicon.ico' || url.pathname === '/manifest.webmanifest');
}
