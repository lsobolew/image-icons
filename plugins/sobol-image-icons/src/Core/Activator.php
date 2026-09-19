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
	const VERSION_OPTION = 'sobol_image_icons_version';

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
		update_option( self::VERSION_OPTION, SOBOL_IMAGE_ICONS_VERSION );
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

		return self::paged_site_ids();
	}

	/**
	 * Every site id on the network, a page at a time.
	 *
	 * Asking for all of them in one query is fine on a network of five and a
	 * way to exhaust memory or time out on a network of fifty thousand - and a plugin activated
	 * network-wide on one of those is exactly when this runs. Paging keeps the working set to one
	 * batch whatever the size of the network.
	 *
	 * @return int[]
	 */
	public static function paged_site_ids(): array {
		$batch  = 200;
		$offset = 0;
		$ids    = array();

		do {
			$page = get_sites(
				array(
					'fields' => 'ids',
					'number' => $batch,
					'offset' => $offset,
				)
			);

			foreach ( $page as $id ) {
				$ids[] = (int) $id;
			}

			$found   = count( $page );
			$offset += $batch;
		} while ( $found === $batch );

		return $ids;
	}
}
