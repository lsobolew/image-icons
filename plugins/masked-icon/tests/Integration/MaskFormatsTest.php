<?php
/**
 * The usable-format list follows the site rather than a hardcoded list.
 *
 * @package Sobolewski\MaskedIcon
 */

declare( strict_types=1 );

namespace Sobolewski\MaskedIcon\Tests\Integration;

use Sobolewski\MaskedIcon\Modules\Blocks\MaskFormats;
use WP_UnitTestCase;

/**
 * Tests for MaskFormats.
 */
final class MaskFormatsTest extends WP_UnitTestCase {

	/**
	 * The default install offers the raster formats with an alpha channel.
	 */
	public function test_default_install_lists_transparent_formats(): void {
		$formats = MaskFormats::available();

		$this->assertContains( 'png', $formats['transparent'] );
		$this->assertContains( 'webp', $formats['transparent'] );
		$this->assertContains( 'gif', $formats['transparent'] );
	}

	/**
	 * SVG is not offered, because WordPress will not accept one.
	 *
	 * This is the case the hardcoded list got wrong: it named SVG, so the editor promised
	 * something the media library then refused.
	 */
	public function test_svg_is_absent_until_a_plugin_allows_it(): void {
		$this->assertNotContains( 'svg', MaskFormats::available()['transparent'] );

		add_filter(
			'upload_mimes',
			static function ( array $mimes ): array {
				$mimes['svg'] = 'image/svg+xml';

				return $mimes;
			}
		);

		$this->assertContains(
			'svg',
			MaskFormats::available()['transparent'],
			'a site that allows SVG uploads should see SVG offered'
		);
	}

	/**
	 * Formats WordPress stores but no browser can paint as a mask stay out of both lists.
	 */
	public function test_formats_no_browser_can_render_are_not_offered(): void {
		$formats = MaskFormats::available();
		$offered = array_merge( $formats['transparent'], $formats['opaque'] );

		$this->assertNotContains( 'tiff', $offered );
		$this->assertNotContains( 'heic', $offered );
	}

	/**
	 * Formats without an alpha channel are listed apart, so the warning can be specific.
	 */
	public function test_opaque_formats_are_listed_separately(): void {
		$formats = MaskFormats::available();

		$this->assertContains( 'jpg', $formats['opaque'] );
		$this->assertNotContains( 'jpg', $formats['transparent'] );
	}

	/**
	 * Each format appears once, under its commonest extension.
	 */
	public function test_one_entry_per_format(): void {
		$formats = MaskFormats::available();

		$this->assertNotContains( 'jpeg', $formats['opaque'], 'jpg and jpeg are one format' );
		$this->assertSame(
			array_values( array_unique( $formats['transparent'] ) ),
			$formats['transparent']
		);
	}

	/**
	 * A site that removes a format stops offering it.
	 */
	public function test_a_removed_format_disappears(): void {
		add_filter(
			'upload_mimes',
			static function ( array $mimes ): array {
				unset( $mimes['webp'] );

				return $mimes;
			}
		);

		$this->assertNotContains( 'webp', MaskFormats::available()['transparent'] );
	}
}
