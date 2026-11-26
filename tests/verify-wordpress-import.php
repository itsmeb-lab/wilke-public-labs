<?php
declare(strict_types=1);

// Run with wp eval-file in the isolated import verification workflow.
global $wpdb;
$slug = getenv('ATLAS_DRAFT_SLUG') ?: 'home-energy-tool-lending';
$fixtures = [
    'home-energy-tool-lending' => [
        'review' => '2026-11-26',
        'excerpt' => 'thermal cameras',
        'snippets' => [
            'id="answer--power-meter--ballarat"',
            'href="#power-meter"',
            'data-operator="kent" data-fit="unknown"',
            'https://dunedinlibraries.govt.nz/collections/home-energy-audit-toolkit-heat-kit',
            'Only some kits have the Power Mate Lite.',
        ],
    ],
    'milwaukee-articulos-voluminosos' => [
        'review' => '2026-11-25',
        'excerpt' => 'recolección en la acera',
        'snippets' => [
            '<div lang="es-US">',
            'id="answer--sofa-or-mattress--milwaukee-curb"',
            'href="#sofa-or-mattress"',
            'Sofá o colchón',
            'https://city.milwaukee.gov/sanitation/Bulky-Item-Pickup',
        ],
    ],
];
$fixture = $fixtures[$slug] ?? throw new RuntimeException('Unknown draft fixture.');
$rows = $wpdb->get_results($wpdb->prepare(
    "SELECT ID, post_name, post_type, post_status, post_content, post_excerpt FROM {$wpdb->posts}
     WHERE post_name = %s AND post_type = 'page'",
    $slug
));
if (count($rows) !== 1) {
    throw new RuntimeException('Expected exactly one imported page after replay.');
}
$row = $rows[0];
if ($row->post_status !== 'draft' || is_post_publicly_viewable((int) $row->ID)) {
    throw new RuntimeException('The imported article must remain a nonpublic draft.');
}
$expectedMeta = [
    '_atlas_source_url' => 'https://itsmeb-lab.github.io/wilke-public-labs/' . $slug . '/',
    '_atlas_source_review' => $fixture['review'],
    '_atlas_import_state' => 'STAGING_DRAFT_ONLY',
];
$metadataCounts = [];
$expectedCount = getenv('ATLAS_EXPECTED_META_ROWS');
foreach ($expectedMeta as $key => $value) {
    $storedValues = get_post_meta((int) $row->ID, $key, false);
    if (!$storedValues) {
        throw new RuntimeException('Expected metadata on the draft: ' . $key);
    }
    foreach ($storedValues as $storedValue) {
        if ($storedValue !== $value) {
            throw new RuntimeException('Draft metadata differs from the source: ' . $key);
        }
    }
    $metadataCounts[$key] = count($storedValues);
    if ($expectedCount !== false && $metadataCounts[$key] !== (int) $expectedCount) {
        throw new RuntimeException('Unexpected metadata row count for ' . $key);
    }
}
foreach ($fixture['snippets'] as $snippet) {
    if (!str_contains($row->post_content, $snippet)) {
        throw new RuntimeException('An expected link or rule did not survive import: ' . $snippet);
    }
}
if (!str_contains($row->post_excerpt, $fixture['excerpt'])) {
    throw new RuntimeException('The guide description did not survive as the excerpt.');
}
echo 'One nonpublic draft page. Source, review date, status, local anchors, and excerpt survived replay.' . PHP_EOL;
echo 'Recorded metadata rows for ' . $slug . ': ' . json_encode($metadataCounts, JSON_THROW_ON_ERROR) . PHP_EOL;
