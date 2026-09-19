import { useBlockProps } from '@wordpress/block-editor';

import { maskStyle, maskClasses } from './style-props';
import type { IconSaveProps } from './types';

/**
 * The block root is a plain element that carries no mask of its own, and the masked shape lives in
 * a span inside it.
 *
 * The extra element is not decoration. A block's root participates in the theme's layout, and an
 * `inline-block` root escapes a constrained layout entirely - the icon ends up pinned to the left
 * edge of the viewport instead of sitting where the content column starts. A block-level wrapper
 * behaves, and the span inside stays inline so the icon keeps its baseline and its sizing. It is
 * also what makes alignment work: the wrapper is what `text-align` applies to.
 */
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

	const mark = (
		<span
			className="wp-block-sobol-image-icons-icon__mark"
			style={ maskStyle( attributes ) }
			{ ...accessibility }
		/>
	);

	const blockProps = useBlockProps.save( { className: maskClasses( attributes ) } );

	return (
		<div { ...blockProps }>
			{ href ? (
				<a
					className="wp-block-sobol-image-icons-icon__link"
					href={ href }
					target={ linkTarget || undefined }
					rel={ rel || undefined }
				>
					{ mark }
				</a>
			) : (
				mark
			) }
		</div>
	);
}
