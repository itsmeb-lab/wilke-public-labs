const targets = [
  ['hardwood alias', 'https://milwaukee-hardwood.vercel.app/'],
  ['hardwood project domain', 'https://milwaukee-hardwood-public.vercel.app/'],
  ['Milwaukee custom domain', 'https://milwaukee.wilkeservices.com/'],
  ['main site cleanout guide', 'https://wilkeservices.com/property/estate-rental-cleanouts'],
  ['main site hardwood path', 'https://wilkeservices.com/milwaukee/hardwood-flooring'],
];
const lines = await Promise.all(targets.map(async ([label, url]) => {
  try {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(10000) });
    const html = response.ok && response.headers.get('content-type')?.includes('text/html') ? await response.text() : '';
    const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
    const loc = response.headers.get('location');
    const redirect = loc ? new URL(loc, url) : null;
    return {
      label, url, http: response.status, title: title ?? null,
      redirect: redirect ? redirect.origin + redirect.pathname : null,
      hardwoodCopy: /hardwood/i.test(html),
      publicFormMarkup: /<form\b/i.test(html),
      recipientConsentCopy: /consent|permission to share/i.test(html),
    };
  } catch (error) {
    return { label, url, http: null, error: error.name };
  }
}));
console.log('MILWAUKEE_PUBLIC_READ ' + JSON.stringify(lines));
