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
 * Loads translations from languages/ (plugins hosted on WordPress.org also receive community
 * translations automatically).
 */
final class I18n {

	/**
	 * Registers the text domain.
	 */
	public function load(): void {
		load_plugin_textdomain(
			'masked-icon',
			false,
			dirname( MASKED_ICON_BASENAME ) . '/languages'
		);
	}
}
