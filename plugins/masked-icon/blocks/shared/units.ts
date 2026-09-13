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
