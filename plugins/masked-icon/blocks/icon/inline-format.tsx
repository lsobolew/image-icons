/**
 * An inline icon, inserted into text rather than placed as a block.
 *
 * This is the shape the plugin is really for: "Read more →" with the arrow sitting inside the
 * sentence, inheriting its colour and its font size. A block cannot do that - blocks are
 * block-level - so it is a rich-text format, which is what WordPress uses for anything that lives
 * inside a paragraph, a heading or a list item.
 *
 * ## Why the element is an <img> and not a <span>
 *
 * Rich-text serialises an `object: true` format as a start tag with no closing tag - see
 * createElementHTML() in @wordpress/rich-text. That is correct for a void element and only for a
 * void element. A <span> written that way leaves the rest of the paragraph parsed as its children:
 *
 *     <p>Read more <span class="..."> and then some</p>
 *
 * which swallows the following text into the icon and drags it out of place. So the element has to
 * be one HTML calls void, and <img> is the honest choice: it is an image, `alt` gives it real
 * accessibility rather than an aria-hidden patch, and where the stylesheet never arrives - a feed
 * reader, an email - the source image still shows instead of nothing.
 *
 * The image's own pixels are collapsed to nothing by the stylesheet; what you see is the mask
 * painted over currentColor. See blocks/icon/style.scss.
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
					src: encodeURI( url ),
					// The mask travels as a custom property for the same reason it does in the
					// block: WordPress strips mask-image from inline styles for users without
					// unfiltered_html, and custom properties survive.
					style: `--masked-icon-image:url(${ encodeURI( url ) })`,
					// An inline icon sits beside text that already carries the meaning, so it is
					// decorative by default. An empty alt is how HTML says that, and it keeps the
					// icon out of the accessibility tree without an aria attribute.
					alt: '',
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
	tagName: 'img',
	className: 'wp-block-masked-icon-icon__inline',
	// A void inline element: it carries no text of its own, so it is inserted rather than wrapped
	// around a selection. Changing tagName to a non-void element breaks the serialised markup.
	object: true,
	attributes: {
		src: 'src',
		style: 'style',
		alt: 'alt',
	},
	edit: InlineIconButton,
} );
