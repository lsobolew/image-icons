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
	attributes: Pick< IconAttributes, 'url' | 'size' | 'fit' >
): CSSProperties {
	const style: Record< string, string > = {};

	if ( attributes.url ) {
		style[ '--image-icons-image' ] = `url(${ encodeURI( attributes.url ) })`;
	}

	if ( attributes.size ) {
		style[ '--image-icons-size' ] = attributes.size;
	}

	if ( attributes.fit && attributes.fit !== 'contain' ) {
		style[ '--image-icons-fit' ] = attributes.fit;
	}

	return style as CSSProperties;
}
