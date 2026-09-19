/**
 * Units offered by the length controls.
 *
 * `em` comes first and is the default on purpose: an icon that sits next to text should scale with
 * that text, and a value in em keeps it in step when the theme, the block or the reader changes the
 * font size. The rest are there for the cases where a fixed size really is wanted.
 */
export const LENGTH_UNITS = [
	{ value: 'em', label: 'em', default: 1 },
	{ value: 'rem', label: 'rem', default: 1 },
	{ value: 'px', label: 'px', default: 16 },
	{ value: 'vw', label: 'vw', default: 2 },
];

/**
 * Makes a length from whatever UnitControl handed over.
 *
 * The control reports a bare number while somebody is mid-edit - clearing the field and typing a
 * new figure goes through states like "" and "2" before it settles on "2em". Writing those
 * straight into the document produces `--sobol-image-icons-size:2`, which is not a length at all, so the
 * declaration is silently dropped by the browser and the icon snaps back to its default size. The
 * unit already on the value wins; otherwise the one the caller was last showing.
 */
export function toLength( value: string | undefined, fallbackUnit = 'em' ): string {
	const text = ( value ?? '' ).trim();

	if ( ! text ) {
		return '';
	}

	return /^-?[\d.]+$/.test( text ) ? `${ text }${ fallbackUnit }` : text;
}

/** The unit part of a length, for keeping it across an edit that drops it. */
export function unitOf( value: string | undefined, fallback = 'em' ): string {
	const match = ( value ?? '' ).trim().match( /[a-z%]+$/i );

	return match ? match[ 0 ] : fallback;
}
