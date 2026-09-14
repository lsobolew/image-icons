/**
 * The "which files can I use?" sentence, built from what this site actually accepts.
 *
 * The list used to be written into the controls by hand, and was wrong in both directions: it
 * offered SVG, which WordPress refuses to upload unless a plugin allows it, and it left out
 * formats a particular site does take. PHP works the real list out per site and per user - see
 * src/Modules/Blocks/MaskFormats.php - and puts it here.
 */
import { __, sprintf } from '@wordpress/i18n';

interface MaskFormats {
	/** Formats with an alpha channel, which are the ones worth using. */
	transparent: string[];
	/** Formats a browser can show but which have no transparency to cut a shape from. */
	opaque: string[];
}

declare global {
	interface Window {
		maskedIconFormats?: MaskFormats;
	}
}

/**
 * How each format is written when people write it.
 *
 * Upper-casing the extension is right for most and wrong for the few that are ordinarily spelled
 * with mixed case, and "WEBP" reads like shouting. Anything not listed falls back to upper case,
 * which is the correct guess for a format this plugin has not heard of.
 */
const DISPLAY_NAMES: Record< string, string > = {
	jpg: 'JPEG',
	webp: 'WebP',
	svg: 'SVG',
	ico: 'ICO',
};

function displayName( extension: string ): string {
	return DISPLAY_NAMES[ extension ] ?? extension.toUpperCase();
}

/** Joins extensions the way a sentence would: "PNG, WebP and AVIF". */
function list( extensions: string[] ): string {
	const names = extensions.map( displayName );

	if ( names.length < 2 ) {
		return names.join( '' );
	}

	return sprintf(
		/* translators: 1: a comma-separated list of file formats, 2: the last file format. */
		__( '%1$s and %2$s', 'image-icons' ),
		names.slice( 0, -1 ).join( ', ' ),
		names[ names.length - 1 ]
	);
}

/**
 * A sentence naming the formats this site accepts, or a general one if PHP never reached us.
 *
 * The fallback matters: the script is registered for the block editor, and somebody embedding the
 * controls elsewhere would otherwise get a sentence with a hole in it.
 */
export function formatsHelp(): string {
	const formats = window.maskedIconFormats;

	if ( ! formats?.transparent?.length ) {
		return __(
			'The icon is cut out of the parts of the image that are not transparent, so a file with a transparent background gives the best result.',
			'image-icons'
		);
	}

	const usable = sprintf(
		/* translators: %s: a list of file formats, e.g. "PNG, WebP and AVIF". */
		__(
			'%s work here. The icon is cut out of the parts that are not transparent, so a transparent background gives the best result.',
			'image-icons'
		),
		list( formats.transparent )
	);

	if ( ! formats.opaque.length ) {
		return usable;
	}

	return `${ usable } ${ sprintf(
		/* translators: %s: a list of file formats that cannot be transparent, e.g. "JPG and BMP". */
		__(
			'%s can be uploaded but cannot be transparent, so they come out as a solid rectangle.',
			'image-icons'
		),
		list( formats.opaque )
	) }`;
}
