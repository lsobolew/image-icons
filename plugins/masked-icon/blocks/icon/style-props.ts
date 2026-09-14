import type { CSSProperties } from 'react';

import type { IconAttributes } from './types';

/**
 * The custom properties that carry the mask to CSS.
 *
 * Everything the mask needs travels as custom properties rather than as real CSS declarations,
 * because WordPress strips `mask-image` from inline styles for users without `unfiltered_html`
 * while leaving custom properties alone. The stylesheet reads them back.
 */
export function maskStyle(
	attributes: Pick< IconAttributes, 'url' | 'size' | 'fit' | 'verticalAlign' >
): CSSProperties {
	const style: Record< string, string > = {};

	if ( attributes.url ) {
		style[ '--masked-icon-image' ] = `url(${ encodeURI( attributes.url ) })`;
	}

	if ( attributes.size ) {
		style[ '--masked-icon-size' ] = attributes.size;
	}

	if ( attributes.fit && attributes.fit !== 'contain' ) {
		style[ '--masked-icon-fit' ] = attributes.fit;
	}

	// Nothing is written for the default, so a block saved before this setting existed keeps
	// exactly the markup it had and stays valid when somebody opens the post again.
	if ( attributes.verticalAlign && attributes.verticalAlign !== 'middle' ) {
		style[ '--masked-icon-align' ] = attributes.verticalAlign;
	}

	return style as CSSProperties;
}
