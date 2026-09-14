<?php
/**
 * Which image formats can actually be used as an icon here.
 *
 * @package Sobolewski\MaskedIcon
 */

declare( strict_types=1 );

namespace Sobolewski\MaskedIcon\Modules\Blocks;

defined( 'ABSPATH' ) || exit;

/**
 * Works out the real list of usable formats for this site and this user.
 *
 * Two sets have to agree, and neither is a constant.
 *
 * What the site accepts is per-site and per-user: get_allowed_mime_types() reflects multisite
 * upload settings, the upload_mimes filter, and the user's own unfiltered_upload capability. SVG
 * is the one people expect and WordPress refuses by default - it is markup, so it can carry a
 * script - and a plugin that adds it shows up here automatically.
 *
 * What a browser can paint as a mask is narrower than what WordPress will store. TIFF and HEIC
 * upload happily and no browser will render them, so an icon masked with one is simply invisible.
 *
 * The remaining split that matters is transparency: a mask is cut from the opaque parts of the
 * image, so a format that cannot be transparent gives a solid rectangle. That is worth saying out
 * loud rather than leaving somebody to discover it.
 */
final class MaskFormats {

	/**
	 * Formats a browser can use as a mask, and that carry an alpha channel.
	 *
	 * @var string[]
	 */
	const WITH_TRANSPARENCY = array(
		'image/png',
		'image/webp',
		'image/avif',
		'image/gif',
		'image/svg+xml',
		'image/x-icon',
		'image/vnd.microsoft.icon',
	);

	/**
	 * Formats a browser can display, but which have no transparency to cut a shape out of.
	 *
	 * @var string[]
	 */
	const WITHOUT_TRANSPARENCY = array(
		'image/jpeg',
		'image/bmp',
	);

	/**
	 * The usable formats, as extensions, for the current user.
	 *
	 * @return array{transparent: string[], opaque: string[]}
	 */
	public static function available(): array {
		$allowed = get_allowed_mime_types();

		return array(
			'transparent' => self::extensions( $allowed, self::WITH_TRANSPARENCY ),
			'opaque'      => self::extensions( $allowed, self::WITHOUT_TRANSPARENCY ),
		);
	}

	/**
	 * Extensions from the allowed map whose MIME type is in the wanted list.
	 *
	 * The allowed map is keyed by an extension pattern - "jpg|jpeg|jpe" - so one key can name
	 * several spellings of the same format. Only the first is kept: a list reading "jpg, jpeg,
	 * jpe" spends three entries telling the reader one thing.
	 *
	 * @param array<string, string> $allowed Extension pattern => MIME type.
	 * @param string[]              $wanted  MIME types to keep.
	 * @return string[]
	 */
	private static function extensions( array $allowed, array $wanted ): array {
		$extensions = array();

		foreach ( $allowed as $pattern => $mime ) {
			if ( ! in_array( $mime, $wanted, true ) ) {
				continue;
			}

			$first = explode( '|', (string) $pattern )[0];

			if ( '' !== $first && ! in_array( $first, $extensions, true ) ) {
				$extensions[] = $first;
			}
		}

		return $extensions;
	}
}
