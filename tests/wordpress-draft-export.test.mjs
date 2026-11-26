import assert from 'node:assert/strict';
import test from 'node:test';
import { buildWordPressDraft } from '../scripts/export-wordpress-draft.mjs';

test('WXR stages exactly one reviewed guide as a draft WordPress page', () => {
  const wxr = buildWordPressDraft('home-energy-tool-lending');
  assert.equal((wxr.match(/<item>/g) ?? []).length, 1);
  assert.match(wxr, /<wp:wxr_version>1\.2<\/wp:wxr_version>/);
  assert.match(wxr, /<wp:post_type><!\[CDATA\[page\]\]>/);
  assert.match(wxr, /<wp:status><!\[CDATA\[draft\]\]>/);
  assert.match(wxr, /<wp:post_name><!\[CDATA\[home-energy-tool-lending\]\]>/);
  assert.match(wxr, /<wp:meta_key><!\[CDATA\[_atlas_source_url\]\]>/);
  assert.match(wxr, /<wp:meta_value><!\[CDATA\[STAGING_DRAFT_ONLY\]\]>/);
  assert.match(wxr, /href="#answer--power-meter--ballarat"/);
  assert.match(wxr, /id="answer--power-meter--ballarat"/);
  assert.match(wxr, /https:\/\/dunedinlibraries\.govt\.nz/);
  assert.doesNotMatch(wxr, /<!DOCTYPE|<script\b|<form\b|<wp:attachment_url>|<wp:status><!\[CDATA\[publish/);
  assert.equal(wxr, buildWordPressDraft('home-energy-tool-lending'));
  assert.throws(() => buildWordPressDraft('../index'), /Unknown comparison guide/);
});
