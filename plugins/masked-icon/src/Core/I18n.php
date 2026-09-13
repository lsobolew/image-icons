<?php
/**
 * Translation loading.
 *
 * @package Sobolewski\MaskedIcon
 */

declare( strict_types=1 );

namespace Sobolewski\MaskedIcon\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Deliberately does nothing.
 *
 * Since WordPress 4.6 a plugin hosted on WordPress.org gets its translations loaded automatically,
 * and calling load_plugin_textdomain() yourself is flagged by Plugin Check. The class stays so the
 * boot sequence has something to call, and so a fork distributed outside the directory - where the
 * call *is* still needed - has an obvious place to put it back.
 */
final class I18n {

	/**
	 * Nothing to do: WordPress.org ships the translations.
	 */
	public function load(): void {
	}
}
