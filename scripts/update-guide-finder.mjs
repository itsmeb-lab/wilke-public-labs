import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { comparisonGuides } from './review-comparisons.mjs';

const site = new URL('../', import.meta.url);
const page = new URL('../guide-finder/index.html', import.meta.url);
const dataPath = new URL('../guide-finder/index-data.mjs', import.meta.url);
const start = '    <!-- FINDER-GUIDES:START -->\n';
const end = '    <!-- FINDER-GUIDES:END -->';
const escape = (text) => text.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
const read = (path) => readFileSync(new URL(path, site), 'utf8');

const regionNames = Object.freeze({
  'au-nsw': 'Australia · New South Wales',
  'au-qld': 'Australia · Queensland',
  'ca-ab': 'Canada · Alberta',
  'ca-bc': 'Canada · British Columbia',
  'ca-on': 'Canada · Ontario',
  'ca-qc': 'Canada · Québec',
  'gb-eng': 'United Kingdom · England',
  'gb-wls': 'United Kingdom · Wales',
  'nz-can': 'New Zealand · Canterbury',
  'nz-wko': 'New Zealand · Waikato',
  'us-az': 'United States · Arizona',
  'us-ca': 'United States · California',
  'us-co': 'United States · Colorado',
  'us-dc': 'United States · District of Columbia',
  'us-fl': 'United States · Florida',
  'us-ga': 'United States · Georgia',
  'us-il': 'United States · Illinois',
  'us-in': 'United States · Indiana',
  'us-ma': 'United States · Massachusetts',
  'us-md': 'United States · Maryland',
  'us-mi': 'United States · Michigan',
  'us-mn': 'United States · Minnesota',
  'us-nc': 'United States · North Carolina',
  'us-nj': 'United States · New Jersey',
  'us-ny': 'United States · New York',
  'us-oh': 'United States · Ohio',
  'us-sc': 'United States · South Carolina',
  'us-wi': 'United States · Wisconsin',
});

const taskAliases = {
  'repair-cafe-planner': {
    bicycle: ['bring bike repair flat tire'],
    microwave: ['bring broken microwave oven appliance repair'],
    toaster: ['bring broken toaster small appliance repair'],
    phone: ['bring mobile cell smartphone repair'],
    'ebike-electrical': ['electric bike battery e-bike repair'],
    'clothes-alteration': ['sew mend clothing tailor hemming repair'],
  },
  'shelter-linen-guide': {
    'small-towels': ['pet shelter donate hand towel washcloth linen'],
    'bath-towels': ['donate used bath towel bedding animal shelter rescue'],
    'flat-sheets': ['donate used linen flat bedsheets animal shelter rescue'],
    'fitted-sheets': ['donate used fitted bed sheet bedding animal shelter rescue'],
    comforters: ['donate bedding blanket duvet comforters animal shelter'],
    pillows: ['donate used pillow bedding animal shelter rescue'],
  },
  'milwaukee-bulky-items': {
    'sofa-or-mattress': ['dispose couch bed bulky furniture removal trash garbage pickup curb'],
    tv: ['dispose television CRT monitor electronics bulky trash'],
    'large-appliance': ['dispose fridge refrigerator stove washing machine washer dryer'],
    'mixed-cleanout': ['house apartment rental trash-out mixed load cleanout remove furniture'],
    'commercial-hauler': ['contractor truck business commercial vehicle paid hauler city dump'],
  },
  'food-scrap-drop-off': {
    'raw-meat': ['organics compost raw chicken uncooked fish bones'],
    'cooked-meat': ['organics compost cooked chicken cooked fish leftovers bones'],
    'brown-paper-bag': ['organics compost liner brown paper bag'],
    'compostable-plastic-bag': ['organics compost certified compostable plastic BPI liner biodegradable bag'],
    'tea-bag': ['organics compost tea bag loose tea sachet'],
  },
  'library-scanning': {
    usb: ['scan to USB flash thumb drive document PDF'],
    email: ['scan send to email document PDF'],
    'no-card': ['scan guest without library card no ID document'],
    tabloid: ['scan 11x17 tabloid oversized large format ledger paper'],
    duplex: ['scan two-sided double-sided both sides duplex feeder'],
  },
  'library-museum-passes': {
    'reserve-pass': ['reserve library museum pass attraction borrowing'],
    'book-venue': ['reserve separate timed ticket timed entry admission reservation aquarium'],
    'at-the-door': ['redeem pass show at desk box office in person'],
    'group-entry': ['how many people adults children family pass free entry group'],
    'return-pass': ['return physical pass library due date'],
  },
  'library-seed-borrowing': {
    'without-card': ['borrow take seed library no card registration'],
    'packet-limit': ['how many seed packets limit'],
    'unused-seeds': ['return leftover unused unsown seed'],
    'saved-seeds': ['return seed from harvest saved next generation'],
    'donate-seeds': ['donate seed gift packet surplus sealed'],
  },
  'tool-library-borrowing': {
    'household-borrower': ['borrow drill tool household individual renter resident organization'],
    'free-loan': ['borrow free no fee tool membership cost'],
    'extra-fees': ['borrow tool rental fees cost price deposit membership'],
    reserve: ['book reserve item tool pickup'],
    'return-tool': ['return tools drop due date loan period'],
  },
  'library-sensory-spaces': {
    'walk-in': ['quiet room sensory space low stimulus drop in no booking reservation'],
    'no-library-card': ['quiet room sensory library no card'],
    'dedicated-room': ['quiet library sensory calming space low stimulation'],
    'child-supervision': ['sensory room child kids age caregiver adult supervision'],
    'time-limit': ['quiet hour sensory room session duration minutes'],
  },
  'eyeglass-donation-rules': {
    'broken-frames': ['donate broken glasses eyeglass frame metal plastic spare parts recycle'],
    'loose-lenses': ['donate loose glasses lens out of frame'],
    'glasses-cases': ['donate glasses case cloth'],
    sunglasses: ['donate sun glasses sunglasses prescription tint clip-on'],
    'hearing-aids': ['donate hearing aid device used hearing equipment'],
  },
  'library-instrument-borrowing': {
    'take-home': ['borrow guitar keyboard ukulele musical instrument home library'],
    'reserve-instrument': ['hold reserve book musical instrument guitar ukulele before going'],
    'under-thirteen': ['child children kid kids youth under 13 music instrument guitar ukulele adult permission parent'],
    'three-week-loan': ['keep long musical instrument ukulele guitar loan duration days three weeks'],
    'different-return-branch': ['return borrowed guitar ukulele keyboard library different branch same location'],
  },
  'used-bicycle-donations': {
    'working-bike': ['donate used rideable bicycle bike clear out cleanout'],
    'heavy-rust': ['donate rusty broken bike bicycle heavy rust damaged cleanup junk'],
    'spare-parts': ['donate spare parts usable wheel bicycle bike component'],
    'used-helmet': ['donate used bicycle cycling bike helmet'],
    collection: ['donate bike bicycle pickup pick up collection shop'],
  },
  'library-memory-labs': {
    vhs: ['convert digitize digitise VHS tape home movies digital memory lab'],
    minidv: ['mini dv minidv camcorder tape convert digital memory lab'],
    hi8: ['convert digitize digitise hi8 video8 digital8 camcorder tape'],
    'walk-in': ['memory lab walk in no appointment tape digitization appointment booking'],
    'first-visit-orientation': ['memory lab no orientation training before first appointment tape digitizing'],
    'save-usb': ['memory lab copy video digitized home movie usb thumb flash external drive storage'],
  },
  'household-document-shredding': {
    'without-appointment': ['shred shredding documents paper free no booking appointment walk in drop off'],
    'keep-staples': ['shred shredding documents paper staples paperclips clips attached remove'],
    'watch-shredding': ['watch documents papers shredded shred shredding onsite in front witness'],
    'business-paper': ['shred shredding documents papers small business commercial records'],
    'more-than-two-boxes': ['shred shredding documents paper several boxes limit banker boxes bags pounds'],
  },
  'library-state-park-passes': {
    'day-vehicle-entry': ['borrow library state park pass provincial parks passport free car vehicle entry day use'],
    'library-hold': ['library state park pass passport reserve hold pickup before visiting'],
    'week-loan': ['keep state park pass week seven days loan length'],
    'overnight-camping': ['state park pass campsite campground camping overnight fee'],
    'capacity-or-reservation': ['state park pass park full capacity separate parking day use reservation entry permit'],
  },
};

export function compile() {
  const regionIds = new Set();
  const guides = comparisonGuides.map(({ slug }) => {
    const info = JSON.parse(read(slug + '/catalog.json'));
    const title = read(slug + '/index.html').match(/<title>([^<>]+)<\/title>/)?.[1].replace(/ \| Wilke Public Labs$/, '');
    const aliases = taskAliases[slug];
    if (!title || !aliases || Object.keys(aliases).length !== info.tasks.length) throw new Error('Review search metadata for ' + slug);
    const rules = new Map(info.rules.map((row) => [row.task + ':' + row.operator, row.fit]));
    const routes = info.operators.map(({ id, name, area, jurisdiction }) => {
      const region = jurisdiction.split('-', 2).join('-');
      if (!Object.hasOwn(regionNames, region)) throw new Error('Label this region before publishing: ' + region);
      regionIds.add(region);
      return { id, name, area, region };
    });
    const tasks = info.tasks.map(({ id, label }) => {
      if (!Object.hasOwn(aliases, id)) throw new Error('Review search phrases for ' + slug + '#' + id);
      return {
        id,
        label,
        aliases: aliases[id],
        routes: routes.map((route) => ({ ...route, fit: rules.get(id + ':' + route.id) ?? 'unknown' })),
      };
    });
    return { slug, title, tasks };
  });

  const regions = [...regionIds].map((id) => ({ id, label: regionNames[id] })).sort((a, b) => a.label.localeCompare(b.label));
  return { guides, regions };
}

export function update(mode) {
  if (mode !== '--write' && mode !== '--check') throw new Error('Use --write or --check.');
  const { guides, regions } = compile();
  const data = '// Generated by scripts/update-guide-finder.mjs.\n' +
    'export const guides = ' + JSON.stringify(guides) + ';\n' +
    'export const regions = ' + JSON.stringify(regions) + ';\n';
  const block = guides.map(({ slug, title, tasks }) =>
    '      <details class="browse-guide">\n' +
    '        <summary>' + escape(title) + '</summary>\n' +
    '        <p><a href="../' + slug + '/">Open the guide</a></p>\n' +
    '        <ul>\n' + tasks.map(({ id, label }) =>
      '          <li><a href="../' + slug + '/#' + id + '">' + escape(label) + '</a></li>').join('\n') +
    '\n        </ul>\n      </details>').join('\n') + '\n';

  const html = readFileSync(page, 'utf8').replaceAll('\r\n', '\n');
  const startAt = html.indexOf(start);
  const endAt = html.indexOf(end);
  if (startAt < 0 || endAt <= startAt || html.lastIndexOf(start) !== startAt || html.lastIndexOf(end) !== endAt) {
    throw new Error('Expected one guide finder list block.');
  }
  const rendered = html.slice(0, startAt + start.length) + block + html.slice(endAt);
  if (mode === '--write') {
    writeFileSync(dataPath, data);
    writeFileSync(page, rendered);
  } else if (rendered !== html || readFileSync(dataPath, 'utf8').replaceAll('\r\n', '\n') !== data) {
    throw new Error('Guide finder projections are stale. Regenerate with --write.');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) update(process.argv[2]);
