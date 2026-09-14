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
 * Nothing to undo on deactivation.
 *
 * The plugin schedules no cron events and registers no rewrite rules, so there is nothing
 * transient to clear. User data is left alone either way - that is what uninstall.php is for. The
 * hook stays wired up so there is an obvious place for cleanup if the plugin ever grows some.
 */
final class Deactivator {

	/**
	 * Called by register_deactivation_hook.
	 */
	public static function deactivate(): void {
	}
}
