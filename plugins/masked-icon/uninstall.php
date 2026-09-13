<?php
/**
 * Plugin uninstall routine - called by WordPress when the plugin is deleted.
 *
 * This file runs WITHOUT the plugin loaded, so there is no autoloader and none of the constants
 * from masked-icon.php. That is why the option names are spelled out literally.
 *
 * @package Sobolewski\MaskedIcon
 */

declare( strict_types=1 );

// Without this constant the file was called directly.
defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

/**
 * Removes the plugin data from a single site.
 */
function masked_icon_uninstall_site(): void {
	delete_option( 'masked_icon_settings' );
	delete_option( 'masked_icon_version' );
	delete_option( 'masked_icon_flush_rewrite' );

	// Custom post type entries are kept on purpose - silently deleting user content is a bad default.
}

if ( is_multisite() ) {
	$masked_icon_site_ids = get_sites(
		array(
			'fields' => 'ids',
			'number' => 0,
		)
	);

	foreach ( $masked_icon_site_ids as $masked_icon_site_id ) {
		switch_to_blog( (int) $masked_icon_site_id );
		masked_icon_uninstall_site();
		restore_current_blog();
	}
} else {
	masked_icon_uninstall_site();
}
