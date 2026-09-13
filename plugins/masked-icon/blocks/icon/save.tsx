import { useBlockProps } from '@wordpress/block-editor';

import { maskStyle } from './style-props';
import type { IconSaveProps } from './types';

export default function save( { attributes }: IconSaveProps ) {
	const { url, label, href, linkTarget, rel } = attributes;

	if ( ! url ) {
		return null;
	}

	// An icon with a name is announced; a decorative one is hidden rather than read out as an
	// unlabelled image.
	const accessibility = label
		? { role: 'img', 'aria-label': label }
		: { 'aria-hidden': true };

	const blockProps = useBlockProps.save( {
		style: maskStyle( attributes ),
		...accessibility,
	} );

	if ( href ) {
		return (
			<a
				className="wp-block-masked-icon-icon__link"
				href={ href }
				target={ linkTarget || undefined }
				rel={ rel || undefined }
			>
				<span { ...blockProps } />
			</a>
		);
	}

	return <span { ...blockProps } />;
}
