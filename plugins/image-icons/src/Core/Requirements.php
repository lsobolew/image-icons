<?php
/**
 * Minimum PHP and WordPress versions.
 *
 * @package Sobolewski\ImageIcons
 */

declare( strict_types=1 );

namespace Sobolewski\ImageIcons\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Decides whether the environment can run the plugin, and says so if it cannot.
 *
 * The check and the message are deliberately separate. `met()` runs while the plugin file is being
 * included - before `after_setup_theme`, let alone `init` - and calling a translation function
 * that early makes WordPress load the text domain just in time and report `_doing_it_wrong` for
 * the trouble. So the check records only which requirement failed, and the sentence is built in
 * `render_notice()`, which runs on `admin_notices` when translations are long since available.
 */
final class Requirements {

	/**
	 * Which requirement failed: 'php', 'wp', or an empty string while everything is fine.
	 *
	 * @var string
	 */
	private static $failed = '';

	/**
	 * Whether the environment satisfies the plugin requirements.
	 */
	public static function met(): bool {
		if ( version_compare( PHP_VERSION, IMAGE_ICONS_MIN_PHP, '<' ) ) {
			self::$failed = 'php';

			return false;
		}

		if ( version_compare( (string) get_bloginfo( 'version' ), IMAGE_ICONS_MIN_WP, '<' ) ) {
			self::$failed = 'wp';

			return false;
		}

		return true;
	}

	/**
	 * Admin notice shown when the requirements are not met.
	 */
	public static function render_notice(): void {
		if ( '' === self::$failed || ! current_user_can( 'activate_plugins' ) ) {
			return;
		}

		if ( 'php' === self::$failed ) {
			$message = sprintf(
				/* translators: 1: required PHP version, 2: PHP version this server runs */
				__( 'Image Icons requires PHP %1$s or newer. This server runs %2$s.', 'image-icons' ),
				IMAGE_ICONS_MIN_PHP,
				PHP_VERSION
			);
		} else {
			$message = sprintf(
				/* translators: 1: required WordPress version, 2: WordPress version this site runs */
				__( 'Image Icons requires WordPress %1$s or newer. This site runs %2$s.', 'image-icons' ),
				IMAGE_ICONS_MIN_WP,
				(string) get_bloginfo( 'version' )
			);
		}

		printf(
			'<div class="notice notice-error"><p>%s</p></div>',
			esc_html( $message )
		);
	}
}
