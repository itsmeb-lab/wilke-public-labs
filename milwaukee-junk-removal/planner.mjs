import { chooseRoute } from './routes.mjs';

const planner = document.getElementById('route-planner');
const authority = document.getElementById('authority');
const handling = document.getElementById('handling');
const items = document.getElementById('items');
const result = document.getElementById('route-result');
const title = document.getElementById('result-title');
const detail = document.getElementById('result-detail');
const link = document.getElementById('result-link');

document.getElementById('choose').addEventListener('click', () => {
  const route = chooseRoute({ authority: authority.value, handling: handling.value, items: items.value });
  title.textContent = route.heading;
  detail.textContent = route.detail ?? '';
  detail.hidden = !route.detail;
  link.textContent = route.linkLabel ?? '';
  if (route.link) link.setAttribute('href', route.link);
  else link.removeAttribute('href');
  link.hidden = !route.link;
  result.hidden = false;
  result.focus();
});

for (const field of [authority, handling, items]) {
  field.addEventListener('change', () => { result.hidden = true; });
}

planner.hidden = false;
