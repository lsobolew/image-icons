<?php
/**
 * The plugin's central guarantee: its markup survives being saved by a non-privileged user.
 *
 * @package Sobolewski\ImageIcons
 */

declare( strict_types=1 );

namespace Sobolewski\ImageIcons\Tests\Integration;

use WP_UnitTestCase;

/**
 * WordPress runs post content through wp_kses_post() for every user without `unfiltered_html`.
 * On a single site that is authors and contributors; **on multisite it is everyone except the
 * super admin**, a site administrator included.
 *
 * That filter strips `mask-image` and `-webkit-mask-image` from style attributes. An icon plugin
 * that writes the mask directly into the style attribute therefore works perfectly for its author,
 * who is an administrator on their own machine, and silently renders a blank box for a client's
 * editor. Worse, for a static block the rewritten markup no longer matches what save() produces,
 * so the editor reports the block as invalid the next time the post is opened.
 *
 * This plugin avoids that by carrying the mask in CSS custom properties, which survive, and
 * resolving them in a stylesheet. These tests are what keep that promise honest - they fail the
 * moment somebody moves a mask declaration back into the markup.
 */
final class KsesCompatibilityTest extends WP_UnitTestCase {

	/**
	 * Markup exactly as the block's save() writes it.
	 */
	private const ICON_MARKUP = '<!-- wp:image-icons/icon {"url":"https://example.com/arrow.png","size":"1.5em","label":"Next"} -->' .
		'<div class="wp-block-image-icons-icon"><span class="wp-block-image-icons-icon__mark" style="--image-icons-image:url(https://example.com/arrow.png);--image-icons-size:1.5em" role="img" aria-label="Next"></span></div>' .
		'<!-- /wp:image-icons/icon -->';

	/**
	 * A core Button carrying an icon, as the editor extension saves it.
	 */
	private const BUTTON_MARKUP = '<!-- wp:buttons --><div class="wp-block-buttons">' .
		'<!-- wp:button {"maskedIconUrl":"https://example.com/arrow.png"} -->' .
		'<div class="wp-block-button has-image-icons is-icon-after" style="--image-icons-image:url(https://example.com/arrow.png);--image-icons-size:1em;--image-icons-gap:0.5em">' .
		'<a class="wp-block-button__link wp-element-button">Learn more</a></div>' .
		'<!-- /wp:button --></div><!-- /wp:buttons -->';

	/**
	 * An inline icon, as the rich-text format stores it inside someone else's paragraph.
	 */
	private const INLINE_MARKUP = '<!-- wp:paragraph -->' .
		'<p>Read more <img class="wp-block-image-icons-icon__inline" src="https://example.com/arrow.png" ' .
		'alt="" style="--image-icons-image:url(https://example.com/arrow.png)"> and then some</p>' .
		'<!-- /wp:paragraph -->';

	/**
	 * Markup samples the plugin produces.
	 *
	 * @return array<string, array{0: string}>
	 */
	public static function markup_provider(): array {
		return array(
			'inline icon in a paragraph'          => array( self::INLINE_MARKUP ),
			'inline icon with a palette colour'   => array(
				'<!-- wp:paragraph --><p>Read more <img ' .
				'class="wp-block-image-icons-icon__inline has-accent-3-color has-text-color" ' .
				'src="https://example.com/arrow.png" alt="Next" ' .
				'style="--image-icons-image:url(https://example.com/arrow.png);--image-icons-size:1.5em"> here</p>' .
				'<!-- /wp:paragraph -->',
			),
			'inline icon with a custom colour'    => array(
				'<!-- wp:paragraph --><p>Read more <img ' .
				'class="wp-block-image-icons-icon__inline has-text-color" ' .
				'src="https://example.com/arrow.png" alt="" ' .
				'style="--image-icons-image:url(https://example.com/arrow.png);color:#d00000"> here</p>' .
				'<!-- /wp:paragraph -->',
			),
			'inline icon keeping its own colours' => array(
				'<!-- wp:paragraph --><p>Our <img ' .
				'class="wp-block-image-icons-icon__inline is-original" ' .
				'src="https://example.com/logo.png" alt="Logo" ' .
				'style="--image-icons-image:url(https://example.com/logo.png)"> logo</p>' .
				'<!-- /wp:paragraph -->',
			),
			'icon block'                          => array( self::ICON_MARKUP ),
			'button with icon'                    => array( self::BUTTON_MARKUP ),
			'decorative icon'                     => array(
				'<!-- wp:image-icons/icon {"url":"https://example.com/star.svg"} -->' .
				'<div class="wp-block-image-icons-icon"><span class="wp-block-image-icons-icon__mark" style="--image-icons-image:url(https://example.com/star.svg);--image-icons-size:1em" aria-hidden="true"></span></div>' .
				'<!-- /wp:image-icons/icon -->',
			),
		);
	}

	/**
	 * KSES leaves the markup alone.
	 *
	 * @dataProvider markup_provider
	 *
	 * @param string $markup Saved markup.
	 */
	public function test_markup_survives_kses( string $markup ): void {
		$this->assertSame(
			$markup,
			wp_kses_post( $markup ),
			'KSES rewrote this markup, so it would break for users without unfiltered_html.'
		);
	}

	/**
	 * An author stores exactly what an administrator would.
	 *
	 * @dataProvider markup_provider
	 *
	 * @param string $markup Saved markup.
	 */
	public function test_author_stores_the_same_markup( string $markup ): void {
		$author = self::factory()->user->create( array( 'role' => 'author' ) );

		wp_set_current_user( $author );

		$this->assertFalse(
			current_user_can( 'unfiltered_html' ),
			'This test proves nothing if the user may post unfiltered HTML.'
		);

		$post_id = self::factory()->post->create(
			array(
				'post_content' => $markup,
				'post_author'  => $author,
			)
		);

		$this->assertSame( $markup, get_post( $post_id )->post_content );
	}

	/**
	 * The custom property carrying the mask is what survives - a direct declaration is not.
	 *
	 * This is the reason the plugin is built the way it is, pinned down so nobody "simplifies" it.
	 */
	public function test_a_direct_mask_declaration_would_not_survive(): void {
		$safe   = '<span style="--image-icons-image:url(https://example.com/a.png)"></span>';
		$unsafe = '<span style="mask-image:url(https://example.com/a.png)"></span>';
		$webkit = '<span style="-webkit-mask-image:url(https://example.com/a.png)"></span>';

		$this->assertSame( $safe, wp_kses_post( $safe ), 'Custom properties are expected to survive.' );
		$this->assertNotSame( $unsafe, wp_kses_post( $unsafe ), 'mask-image is expected to be stripped.' );
		$this->assertNotSame( $webkit, wp_kses_post( $webkit ), '-webkit-mask-image is expected to be stripped.' );
	}
}
