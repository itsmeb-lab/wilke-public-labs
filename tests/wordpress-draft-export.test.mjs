import assert from 'node:assert/strict';
import test from 'node:test';
import { buildWordPressDraft } from '../scripts/export-wordpress-draft.mjs';

test('WXR stages exactly one reviewed guide as a draft WordPress page', () => {
  const wxr = buildWordPressDraft('home-energy-tool-lending');
  assert.equal((wxr.match(/<item>/g) ?? []).length, 1);
  assert.match(wxr, /<wp:wxr_version>1\.2<\/wp:wxr_version>/);
  assert.match(wxr, /<language>en-US<\/language>/);
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

test('Spanish WXR preserves the language, provenance and linked source', () => {
  const slug = 'milwaukee-articulos-voluminosos';
  const wxr = buildWordPressDraft(slug);
  assert.equal((wxr.match(/<item>/g) ?? []).length, 1);
  assert.match(wxr, /<language>es-US<\/language>/);
  assert.match(wxr, /<content:encoded><!\[CDATA\[<div lang="es-US">/);
  assert.match(wxr, /¿Dónde llevar muebles/);
  assert.match(wxr, /recolección en la acera/);
  assert.match(wxr, /id="answer--sofa-or-mattress--milwaukee-curb"/);
  assert.match(wxr, /https:\/\/city\.milwaukee\.gov\/sanitation\/Bulky-Item-Pickup/);
  assert.match(wxr, /_atlas_source_url.*milwaukee-articulos-voluminosos\//);
  assert.match(wxr, /<wp:status><!\[CDATA\[draft\]\]>/);
  assert.equal(wxr, buildWordPressDraft(slug));
});
