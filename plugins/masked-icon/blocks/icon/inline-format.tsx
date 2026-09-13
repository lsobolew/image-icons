/**
 * An inline icon, inserted into text rather than placed as a block.
 *
 * This is the shape the plugin is really for: "Read more →" with the arrow sitting inside the
 * sentence, inheriting its colour and its font size. A block cannot do that - blocks are
 * block-level - so it is a rich-text format, which is what WordPress uses for anything that lives
 * inside a paragraph, a heading or a list item.
 *
 * The element it inserts is exactly the span the Masked Icon block renders, so both share one
 * stylesheet and one set of custom properties.
 */
import { insertObject } from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';
import { RichTextToolbarButton, MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

import { registerFormat } from '../shared/register';

const NAME = 'masked-icon/inline';

interface FormatEditProps {
	value: RichTextValue;
	onChange: ( next: RichTextValue ) => void;
}

function InlineIconButton( { value, onChange }: FormatEditProps ) {
	const insert = ( media: { id: number } & Record< string, unknown > ) => {
		const url = typeof media.url === 'string' ? media.url : '';

		if ( ! url ) {
			return;
		}

		onChange(
			insertObject( value, {
				type: NAME,
				attributes: {
					// The mask travels as a custom property for the same reason it does in the
					// block: WordPress strips mask-image from inline styles for users without
					// unfiltered_html, and custom properties survive.
					style: `--masked-icon-image:url(${ encodeURI( url ) })`,
					// An inline icon sits beside text that already carries the meaning, so it is
					// decorative by default and stays out of the accessibility tree.
					hidden: 'true',
				},
			} )
		);
	};

	return (
		<MediaUploadCheck>
			<MediaUpload
				allowedTypes={ [ 'image' ] }
				onSelect={ insert }
				render={ ( { open }: { open: () => void } ) => (
					<RichTextToolbarButton
						icon="art"
						title={ __( 'Masked icon', 'masked-icon' ) }
						onClick={ open }
					/>
				) }
			/>
		</MediaUploadCheck>
	);
}

registerFormat( NAME, {
	title: __( 'Masked icon', 'masked-icon' ),
	tagName: 'span',
	className: 'wp-block-masked-icon-icon__mark',
	// A void inline element: it carries no text of its own, so it is inserted rather than wrapped
	// around a selection.
	object: true,
	attributes: {
		style: 'style',
		hidden: 'aria-hidden',
		label: 'aria-label',
	},
	edit: InlineIconButton,
} );
