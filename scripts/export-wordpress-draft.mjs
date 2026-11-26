import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { guideRow } from './export-wordpress-comparison.mjs';

const base = 'https://itsmeb-lab.github.io/wilke-public-labs/';
const xml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const cdata = (value) => '<![CDATA[' + value.replaceAll(']]>', ']]]]><![CDATA[>') + ']]>';

export function buildWordPressDraft(slug) {
  const [name, title, excerpt, source, checkedOn, state, content] = guideRow(slug);
  const date = checkedOn + ' 12:00:00';
  const meta = {
    _atlas_source_url: source,
    _atlas_source_review: checkedOn,
    _atlas_import_state: state,
  };
  const entries = Object.entries(meta).map(([key, value]) =>
    '      <wp:postmeta><wp:meta_key>' + cdata(key) + '</wp:meta_key><wp:meta_value>' + cdata(value) +
    '</wp:meta_value></wp:postmeta>').join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0"',
    '  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"',
    '  xmlns:content="http://purl.org/rss/1.0/modules/content/"',
    '  xmlns:dc="http://purl.org/dc/elements/1.1/"',
    '  xmlns:wp="http://wordpress.org/export/1.2/">',
    '  <channel>',
    '    <title>Wilke Public Labs</title>',
    '    <link>' + xml(base) + '</link>',
    '    <description>Draft exchange for one source-linked guide</description>',
    '    <language>en-US</language>',
    '    <wp:wxr_version>1.2</wp:wxr_version>',
    '    <wp:base_site_url>' + xml(base) + '</wp:base_site_url>',
    '    <wp:base_blog_url>' + xml(base) + '</wp:base_blog_url>',
    '    <item>',
    '      <title>' + xml(title) + '</title>',
    '      <link>' + xml(source) + '</link>',
    '      <dc:creator>' + cdata('atlas-import') + '</dc:creator>',
    '      <guid isPermaLink="false">' + xml(source) + '</guid>',
    '      <description></description>',
    '      <content:encoded>' + cdata(content) + '</content:encoded>',
    '      <excerpt:encoded>' + cdata(excerpt) + '</excerpt:encoded>',
    '      <wp:post_id>1</wp:post_id>',
    '      <wp:post_date>' + cdata(date) + '</wp:post_date>',
    '      <wp:post_date_gmt>' + cdata(date) + '</wp:post_date_gmt>',
    '      <wp:post_modified>' + cdata(date) + '</wp:post_modified>',
    '      <wp:post_modified_gmt>' + cdata(date) + '</wp:post_modified_gmt>',
    '      <wp:comment_status><![CDATA[closed]]></wp:comment_status>',
    '      <wp:ping_status><![CDATA[closed]]></wp:ping_status>',
    '      <wp:post_name>' + cdata(name) + '</wp:post_name>',
    '      <wp:status><![CDATA[draft]]></wp:status>',
    '      <wp:post_parent>0</wp:post_parent>',
    '      <wp:menu_order>0</wp:menu_order>',
    '      <wp:post_type><![CDATA[page]]></wp:post_type>',
    '      <wp:post_password></wp:post_password>',
    '      <wp:is_sticky>0</wp:is_sticky>',
    entries,
    '    </item>',
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 4 || args[0] !== '--slug' || args[2] !== '--output' || !args[3].endsWith('.xml')) {
    throw new Error('Usage: node scripts/export-wordpress-draft.mjs --slug GUIDE --output DRAFT.xml');
  }
  writeFileSync(resolve(args[3]), buildWordPressDraft(args[1]), { flag: 'wx' });
}
