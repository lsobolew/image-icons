<?php
/**
 * Plugin activation.
 *
 * @package Sobolewski\ImageIcons
 */

declare( strict_types=1 );

namespace Sobolewski\ImageIcons\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Records the version the data was written by, and nothing else.
 *
 * There is deliberately no rewrite flush and no option seeded here: this plugin registers no post
 * types, taxonomies or rewrite rules, so there is nothing to rebuild, and it reads no settings, so
 * an options row would be written and never looked at again.
 */
final class Activator {

	/**
	 * Option holding the data schema version.
	 */
	const VERSION_OPTION = 'image_icons_version';

	/**
	 * Called by register_activation_hook.
	 *
	 * @param bool $network_wide Whether the plugin is being activated network-wide.
	 */
	public static function activate( $network_wide = false ): void {
		if ( $network_wide && is_multisite() ) {
			foreach ( self::site_ids() as $site_id ) {
				switch_to_blog( $site_id );
				self::activate_single_site();
				restore_current_blog();
			}

			return;
		}

		self::activate_single_site();
	}

	/**
	 * Initializes a single site.
	 */
	private static function activate_single_site(): void {
		update_option( self::VERSION_OPTION, IMAGE_ICONS_VERSION );
	}

	/**
	 * Site ids in the network.
	 *
	 * @return int[]
	 */
	private static function site_ids(): array {
		if ( ! is_multisite() ) {
			return array();
		}

		return array_map(
			'intval',
			get_sites(
				array(
					'fields' => 'ids',
					'number' => 0,
				)
			)
		);
	}
}
