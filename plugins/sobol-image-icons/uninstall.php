<?php
/**
 * Plugin uninstall routine - called by WordPress when the plugin is deleted.
 *
 * This file runs WITHOUT the plugin loaded, so there is no autoloader and none of the constants
 * from sobol-image-icons.php. That is why the option names are spelled out literally.
 *
 * @package Sobolewski\ImageIcons
 */

declare( strict_types=1 );

// Without this constant the file was called directly.
defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

/**
 * Removes the plugin data from a single site.
 */
function sobol_image_icons_uninstall_site(): void {
	// The only row the plugin ever writes. Icons themselves live in post content and in the media
	// library, and are deliberately left alone: deleting somebody's images and emptying their
	// posts because they removed a plugin would be indefensible.
	delete_option( 'sobol_image_icons_version' );
}

if ( is_multisite() ) {
	// A page at a time rather than `'number' => 0`: asking for every site at once is fine on a
	// small network and a way to run out of memory on a large one. This file runs without the
	// plugin loaded, so it cannot borrow the helper in Core\Activator and repeats the loop.
	$sobol_image_icons_batch  = 200;
	$sobol_image_icons_offset = 0;

	do {
		$sobol_image_icons_site_ids = get_sites(
			array(
				'fields' => 'ids',
				'number' => $sobol_image_icons_batch,
				'offset' => $sobol_image_icons_offset,
			)
		);

		foreach ( $sobol_image_icons_site_ids as $sobol_image_icons_site_id ) {
			switch_to_blog( (int) $sobol_image_icons_site_id );
			sobol_image_icons_uninstall_site();
			restore_current_blog();
		}

		$sobol_image_icons_found   = count( $sobol_image_icons_site_ids );
		$sobol_image_icons_offset += $sobol_image_icons_batch;
	} while ( $sobol_image_icons_found === $sobol_image_icons_batch );
} else {
	sobol_image_icons_uninstall_site();
}
