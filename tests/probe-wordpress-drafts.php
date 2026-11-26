<?php
declare(strict_types=1);

function atlasRequire(bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$mode = $args[0] ?? '';
atlasRequire(in_array($mode, ['create', 'repeat', 'verify'], true), 'Specify a probe mode.');
$sandboxHost = parse_url(home_url(), PHP_URL_HOST);
atlasRequire($sandboxHost === '127.0.0.1' && str_starts_with(DB_NAME, 'atlas_draft_'), 'Expected disposable loopback WordPress.');
$csv = fopen(__DIR__ . '/../wordpress-exchange/comparisons-draft.csv', 'rb');
atlasRequire($csv !== false, 'Unable to open the draft exchange.');
$columns = ['slug', 'heading', 'description', 'canonical_reference', 'reviewed_on', 'publication_state', 'comparison_html'];
atlasRequire(fgetcsv($csv, null, ',', '"', '') === $columns, 'Header columns differ.');

$created = 0;
$expected = 0;
while (($fields = fgetcsv($csv, null, ',', '"', '')) !== false) {
    atlasRequire(count($fields) === count($columns), 'Unexpected width.');
    $row = array_combine($columns, $fields);
    $slug = $row['slug'];
    atlasRequire(preg_match('/^[a-z]+(?:-[a-z]+)*$/D', $slug) === 1, 'Unexpected slug.');
    atlasRequire($row['publication_state'] === 'STAGING_DRAFT_ONLY', 'Expected a staging directive.');
    atlasRequire($row['canonical_reference'] === 'https://itsmeb-lab.github.io/wilke-public-labs/' . $slug . '/', 'Canonical differs for ' . $slug);
    $current = get_page_by_path($slug, OBJECT, 'page');
    if ($mode === 'create') {
        atlasRequire($current === null, 'Unexpected pre-existing page ' . $slug);
        $postId = wp_insert_post(wp_slash([
            'post_type' => 'page',
            'post_status' => 'draft',
            'post_title' => $row['heading'],
            'post_name' => $slug,
            'post_excerpt' => $row['description'],
            'post_content' => $row['comparison_html'],
            'meta_input' => [
                '_atlas_canonical_reference' => $row['canonical_reference'],
                '_atlas_source_reviewed_on' => $row['reviewed_on'],
            ],
        ]), true);
        atlasRequire(!is_wp_error($postId) && $postId > 0, 'Unable to insert draft ' . $slug);
        $created++;
        $current = get_post($postId);
    }
    atlasRequire($current instanceof WP_Post, 'Draft missing for ' . $slug);
    foreach ([
        'post_type' => 'page',
        'post_status' => 'draft',
        'post_name' => $slug,
        'post_title' => $row['heading'],
        'post_excerpt' => $row['description'],
        'post_content' => $row['comparison_html'],
    ] as $field => $value) {
        atlasRequire(get_post_field($field, $current, 'raw') === $value, $field . ' did not roundtrip for ' . $slug);
    }
    atlasRequire(get_post_meta($current->ID, '_atlas_canonical_reference', true) === $row['canonical_reference'], 'Source canonical metadata did not roundtrip.');
    atlasRequire(get_post_meta($current->ID, '_atlas_source_reviewed_on', true) === $row['reviewed_on'], 'Source review metadata did not roundtrip.');
    $expected++;
}
fclose($csv);
$drafts = count(get_posts([
    'post_type' => 'page',
    'post_status' => 'draft',
    'meta_key' => '_atlas_canonical_reference',
    'fields' => 'ids',
    'posts_per_page' => -1,
]));
atlasRequire($expected >= 10 && $drafts === $expected, 'Expected exactly one draft for each exchange row.');
echo json_encode(['mode' => $mode, 'created' => $created, 'drafts' => $drafts, 'canonical_metadata' => $expected, 'html_exact' => $expected], JSON_THROW_ON_ERROR) . PHP_EOL;
