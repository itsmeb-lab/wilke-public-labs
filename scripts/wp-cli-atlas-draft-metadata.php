<?php
declare(strict_types=1);

// Opt-in WP-CLI helper for replaying the same Atlas WXR draft.
if (!class_exists('WP_CLI', false)) {
    return;
}

WP_CLI::add_wp_hook('add_post_metadata', static function ($check, $postId, $key, $value) {
    $atlasKeys = ['_atlas_source_url', '_atlas_source_review', '_atlas_import_state'];
    if ($check !== null || !is_string($value) || !in_array($key, $atlasKeys, true)) {
        return $check;
    }
    if (get_post_type($postId) !== 'page' || get_post_status($postId) !== 'draft') {
        return $check;
    }
    $storedValues = get_post_meta($postId, $key, false);
    return in_array($value, $storedValues, true) ? false : $check;
}, 10, 4);
