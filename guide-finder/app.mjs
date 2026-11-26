import { guides, regions } from './index-data.mjs';
import { buildSearchIndex, searchGuides } from './search.mjs';

const index = buildSearchIndex(guides);
const finder = document.getElementById('finder');
const query = document.getElementById('lookup');
const region = document.getElementById('region');
const status = document.getElementById('result-status');
const results = document.getElementById('matches');

const states = { listed: 'Listed by organizer', excluded: 'Excluded', ask: 'Ask first', paused: 'No current need', unknown: 'Unconfirmed' };
for (const { id, label } of regions) region.append(new Option(label, id));

function addText(parent, tag, value, className) {
  const child = document.createElement(tag);
  if (className) child.className = className;
  child.textContent = value;
  parent.append(child);
  return child;
}

function render() {
  const matches = searchGuides(index, { query: query.value, region: region.value });
  results.replaceChildren();
  if (!matches.length) {
    status.textContent = query.value.trim() || region.value
      ? 'No matching guide questions. Clear the region or try a shorter task.'
      : 'Start with a task or choose a region.';
    return;
  }
  status.textContent = matches.length === 8
    ? 'Showing the top eight guide questions.'
    : matches.length + (matches.length === 1 ? ' matching question.' : ' matching questions.');

  for (const item of matches) {
    const card = document.createElement('li');
    const heading = document.createElement('h3');
    const task = addText(heading, 'a', item.label);
    task.href = '../' + item.slug + '/#' + item.id;
    card.append(heading);
    addText(card, 'p', item.title, 'finder-result-source');
    const list = document.createElement('ul');
    list.className = 'finder-operators';
    for (const route of item.routes.slice(0, 4)) {
      const row = document.createElement('li');
      const link = addText(row, 'a', route.name + ' · ' + route.area);
      link.href = '../' + item.slug + '/#answer--' + item.id + '--' + route.id;
      row.append(document.createTextNode(' — ' + states[route.fit]));
      list.append(row);
    }
    card.append(list);
    if (item.routes.length > 4) addText(card, 'p', 'Open the question to see all ' + item.routes.length + ' matching services.', 'finder-result-source');
    results.append(card);
  }
}

query.addEventListener('input', render);
region.addEventListener('change', render);
render();
finder.hidden = false;
