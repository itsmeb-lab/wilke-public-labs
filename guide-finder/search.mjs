const filler = new Set(['a', 'about', 'an', 'and', 'are', 'at', 'being', 'can', 'do', 'for', 'from', 'get', 'how', 'i', 'in', 'into', 'is', 'it', 'me', 'my', 'near', 'nearby', 'need', 'of', 'old', 'rules', 'the', 'there', 'this', 'to', 'use', 'want', 'what', 'where', 'who', 'with', 'you']);
const aliases = new Map(Object.entries({
  eyeglasses: 'glasses',
  eyeglass: 'glasses',
  cases: 'case',
  aids: 'aid',
  spectacles: 'glasses',
  lenses: 'lens',
  frames: 'frame',
  sofas: 'couch',
  sofa: 'couch',
  couches: 'couch',
  mattresses: 'mattress',
  carpeting: 'carpet',
  seeds: 'seed',
  tools: 'tool',
  bags: 'bag',
  cafes: 'cafe',
  cards: 'card',
  reservations: 'reservation',
  booking: 'reservation',
  bookings: 'reservation',
  documents: 'document',
  towels: 'towel',
  scanners: 'scan',
  scanning: 'scan',
  dropoff: 'drop',
  bulk: 'bulky',
  donations: 'donate',
  donation: 'donate',
  papers: 'document',
  paper: 'document',
  paperwork: 'document',
  shredded: 'shred',
  shredding: 'shred',
  takes: 'take',
  tapes: 'tape',
}));

function words(text) {
  return text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/\b(\d+)\s*[xx]\s*(\d+)\b/g, '$1x$2')
    .replace(/\bget\s+into\b/g, 'enter')
    .replace(/'s\b|'s\b/g, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word && !filler.has(word))
    .map((word) => aliases.get(word) ?? word);
}

const tokens = (text) => new Set(words(text));

export function buildSearchIndex(guides) {
  return guides.map((guide) => ({
    ...guide,
    tasks: guide.tasks.map((task) => ({
      ...task,
      intent: tokens([task.label, ...task.aliases].join(' ')),
      context: tokens(guide.title),
      routes: task.routes.map((route) => ({ ...route, terms: tokens(route.name + ' ' + route.area) })),
    })),
  }));
}

export function searchGuides(index, { query = '', region = '', limit = 8 } = {}) {
  const needle = [...tokens(query.slice(0, 120))];
  const results = [];
  if (!needle.length && !region) return results;

  for (const guide of index) {
    for (const task of guide.tasks) {
      const routes = [];
      let score = 0;
      for (const route of task.routes) {
        if (region && route.region !== region) continue;
        const weights = needle.map((word) => task.intent.has(word) ? 8 : route.terms.has(word) ? 3 : task.context.has(word) ? 2 : 0);
        if (weights.includes(0)) continue;
        const total = weights.reduce((sum, weight) => sum + weight, 0);
        routes.push(route);
        score = Math.max(score, total);
      }
      if (routes.length) results.push({ slug: guide.slug, title: guide.title, id: task.id, label: task.label, score, routes });
    }
  }
  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title) || a.label.localeCompare(b.label)).slice(0, limit);
}

