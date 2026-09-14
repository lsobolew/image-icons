<?php
/**
 * Plugin uninstall routine - called by WordPress when the plugin is deleted.
 *
 * This file runs WITHOUT the plugin loaded, so there is no autoloader and none of the constants
 * from image-icons.php. That is why the option names are spelled out literally.
 *
 * @package Sobolewski\ImageIcons
 */

declare( strict_types=1 );

// Without this constant the file was called directly.
defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

/**
 * Removes the plugin data from a single site.
 */
function image_icons_uninstall_site(): void {
	// The only row the plugin ever writes. Icons themselves live in post content and in the media
	// library, and are deliberately left alone: deleting somebody's images and emptying their
	// posts because they removed a plugin would be indefensible.
	delete_option( 'image_icons_version' );
}

if ( is_multisite() ) {
	$image_icons_site_ids = get_sites(
		array(
			'fields' => 'ids',
			'number' => 0,
		)
	);

	foreach ( $image_icons_site_ids as $image_icons_site_id ) {
		switch_to_blog( (int) $image_icons_site_id );
		image_icons_uninstall_site();
		restore_current_blog();
	}
} else {
	image_icons_uninstall_site();
}
