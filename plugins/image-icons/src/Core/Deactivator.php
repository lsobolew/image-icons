<?php
/**
 * Plugin deactivation.
 *
 * @package Sobolewski\ImageIcons
 */

declare( strict_types=1 );

namespace Sobolewski\ImageIcons\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Cleans up the temporary state only. User data is left alone - that is what uninstall.php is for.
 */
final class Deactivator {

	/**
	 * Called by register_deactivation_hook.
	 */
	public static function deactivate(): void {
		delete_option( Activator::FLUSH_FLAG );
		wp_clear_scheduled_hook( 'imageicons_daily_maintenance' );
		flush_rewrite_rules();
	}
}
