import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const handoff = read('milwaukee-cleanout-floor-handoff/index.html');

test('the Milwaukee worksheet gives each step its own written scope and stays local', () => {
  assert.match(handoff, /<h2 id="before-clear">Before the cleanout<\/h2>/);
  assert.match(handoff, /<h2 id="room-notes">Record the room handoff<\/h2>/);
  assert.match(handoff, /<h2 id="floor-estimate">Before approving the flooring estimate<\/h2>/);
  assert.match(handoff, /Pause on disputed, occupied or unapproved areas/);
  assert.match(handoff, /keep access codes out/i);
  assert.doesNotMatch(handoff, /<form\b|<script\b|<input\b|<textarea\b|mailto:|tel:/i);
  assert.match(read('milwaukee-cleanout-floor-handoff/worksheet.css'), /@media print/);
});

test('Milwaukee household disposal and flooring sources appear as distinct routes', () => {
  assert.match(handoff, /milwaukee-bulky-items\/#donation-pickup/);
  assert.match(handoff, /woodfloors\.org\/refinishing-your-floors\//);
  assert.match(handoff, /datcp\.wi\.gov\/Pages\/Publications\/LandlordTenantGuide\.aspx/);
  assert.match(read('milwaukee-bulky-items/index.html'), /href="\.\.\/milwaukee-cleanout-floor-handoff\/"/);
});
