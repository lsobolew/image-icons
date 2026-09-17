import type { CSSProperties } from 'react';

import type { IconAttributes } from './types';

type StyleAttributes = Pick<
	IconAttributes,
	'url' | 'size' | 'ratio' | 'original' | 'presetColor' | 'customColor'
>;

/**
 * The custom properties that carry the mask to CSS.
 *
 * Everything the mask needs travels as custom properties rather than as real CSS declarations,
 * because WordPress strips `mask-image` from inline styles for users without `unfiltered_html`
 * while leaving custom properties alone. The stylesheet reads them back.
 */
export function maskStyle( attributes: StyleAttributes ): CSSProperties {
	const style: Record< string, string > = {};

	if ( attributes.url ) {
		style[ '--image-icons-image' ] = `url(${ encodeURI( attributes.url ) })`;
	}

	if ( attributes.size ) {
		style[ '--image-icons-size' ] = attributes.size;
	}

	// Only written when the media library knew the dimensions. Without it the icon falls back to a
	// square, which is what every icon in this plugin used to be.
	if ( attributes.ratio ) {
		style[ '--image-icons-ratio' ] = attributes.ratio;
	}

	// A palette colour is a class, so the literal declaration is only for a custom one.
	if ( ! attributes.presetColor && attributes.customColor ) {
		style.color = attributes.customColor;
	}

	return style as CSSProperties;
}

/**
 * The classes that go with those properties.
 *
 * Colour follows the shape core uses for its own text colour - a `has-<slug>-color` class for a
 * palette entry, a `color` declaration for a custom one - so a theme that restyles palette colours
 * restyles these too.
 */
export function maskClasses( attributes: StyleAttributes & { align?: string } ): string {
	return [
		attributes.original ? 'is-original' : '',
		attributes.presetColor ? `has-${ attributes.presetColor }-color` : '',
		attributes.presetColor || attributes.customColor ? 'has-text-color' : '',
		attributes.align ? `has-text-align-${ attributes.align }` : '',
	]
		.filter( Boolean )
		.join( ' ' );
}
