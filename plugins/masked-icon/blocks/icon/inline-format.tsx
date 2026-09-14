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
 *
 * ## Editing one that already exists
 *
 * An object format gets `isObjectActive` and `activeObjectAttributes` from the editor whenever the
 * caret is on its element (see format-edit.js in @wordpress/block-editor). Those are what let the
 * toolbar button light up and the settings open on the icon you selected, the way the native
 * highlight format behaves - without them every click would insert another icon instead of editing
 * the one in front of you.
 */
import { insertObject, useAnchor } from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';
import {
	RichTextToolbarButton,
	MediaUpload,
	MediaUploadCheck,
	useSettings,
} from '@wordpress/block-editor';
import {
	Popover,
	Button,
	TextControl,
	ToggleControl,
	ColorPalette,
	BaseControl,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { registerFormat } from '../shared/register';
import { LENGTH_UNITS } from '../shared/units';
import { readSettings, writeSettings, EMPTY_SETTINGS } from './inline-settings';
import type { IconSettings } from './inline-settings';

import type { ReactNode } from 'react';

const NAME = 'masked-icon/inline';

/** One entry of a theme's colour palette, as theme.json defines it. */
interface PaletteColor {
	name: string;
	slug: string;
	color: string;
}

interface FormatEditProps {
	value: RichTextValue;
	onChange: ( next: RichTextValue ) => void;
	onFocus: () => void;
	isObjectActive: boolean;
	activeObjectAttributes: Record< string, string >;
	contentRef: React.RefObject< HTMLElement >;
}

interface SelectedMedia {
	id: number;
	url: string;
	alt?: string;
}

/**
 * The settings popover, anchored on the selected icon.
 *
 * useAnchor is what keeps it pinned to the element rather than to the toolbar, which is how core's
 * own link and highlight popovers behave.
 */
function IconSettingsPopover( {
	settings,
	onChange,
	onClose,
	contentRef,
}: {
	settings: IconSettings;
	onChange: ( next: IconSettings ) => void;
	onClose: () => void;
	contentRef: React.RefObject< HTMLElement >;
} ) {
	// useAnchor finds the element with `tagName.className` and pins the popover to it, so the
	// settings follow the icon you selected rather than floating by the toolbar. It reads only
	// those two plus isActive, which is narrower than the WPFormat its type asks for.
	const anchor = useAnchor( {
		editableContentElement: contentRef.current,
		settings: {
			name: NAME,
			tagName: 'img',
			className: 'wp-block-masked-icon-icon__inline',
			isActive: true,
		} as unknown as Parameters< typeof useAnchor >[ 0 ][ 'settings' ],
	} );
	const [ palette ] = useSettings( 'color.palette' ) as [ PaletteColor[] | undefined ];
	const colors: PaletteColor[] = palette || [];

	// ColorPalette works in literal colours, so a stored palette slug has to be turned back into
	// one to show which swatch is selected.
	const selected = settings.presetColor
		? colors.find( ( entry ) => entry.slug === settings.presetColor )?.color || ''
		: settings.customColor;

	const onColor = ( next?: string ) => {
		const match = colors.find( ( entry ) => entry.color === next );

		onChange( {
			...settings,
			presetColor: match?.slug || '',
			customColor: match ? '' : next || '',
		} );
	};

	return (
		<Popover
			anchor={ anchor }
			onClose={ onClose }
			placement="bottom"
			className="masked-icon-inline-settings"
		>
			<div className="masked-icon-inline-settings__body">
				<MediaUploadCheck>
					<MediaUpload
						allowedTypes={ [ 'image' ] }
						onSelect={ ( media: SelectedMedia ) =>
							onChange( { ...settings, src: media.url } )
						}
						render={ ( { open }: { open: () => void } ) => (
							<Button variant="secondary" onClick={ open }>
								{ __( 'Replace image', 'masked-icon' ) }
							</Button>
						) }
					/>
				</MediaUploadCheck>

				<UnitControl
					label={ __( 'Size', 'masked-icon' ) }
					units={ LENGTH_UNITS }
					value={ settings.size || '1em' }
					onChange={ ( next?: string ) => onChange( { ...settings, size: next || '' } ) }
				/>

				<TextControl
					label={ __( 'Alternative text', 'masked-icon' ) }
					help={ __(
						'Describes the icon for screen readers. Leave it empty when the icon only decorates text that already says the same thing.',
						'masked-icon'
					) }
					value={ settings.alt }
					onChange={ ( next: string ) => onChange( { ...settings, alt: next } ) }
				/>

				<ToggleControl
					label={ __( 'Keep the original colours', 'masked-icon' ) }
					help={ __(
						'Draws the file as it is instead of using it as a mask, so it keeps its own colours and stops following the text. The size still applies.',
						'masked-icon'
					) }
					checked={ settings.original }
					onChange={ ( next: boolean ) => onChange( { ...settings, original: next } ) }
				/>

				{ ! settings.original && (
					<BaseControl
						__nextHasNoMarginBottom
						id="masked-icon-inline-colour"
						label={ __( 'Colour', 'masked-icon' ) }
						help={ __(
							'Leave this unset and the icon takes the colour of the text around it, which is what makes it behave like a glyph.',
							'masked-icon'
						) }
					>
						<ColorPalette
							value={ selected }
							colors={ colors }
							onChange={ onColor }
						/>
					</BaseControl>
				) }
			</div>
		</Popover>
	);
}

function InlineIcon( {
	value,
	onChange,
	onFocus,
	isObjectActive,
	activeObjectAttributes,
	contentRef,
}: FormatEditProps ): ReactNode {
	// The position of the icon being edited, captured when the settings open rather than read as
	// they are applied. Opening the popover moves focus out of the editable area, and anything that
	// then changes the selection would otherwise redirect the next save at whatever is selected now.
	const [ editing, setEditing ] = useState< number | null >( null );

	const apply = ( next: IconSettings ) => {
		if ( editing === null ) {
			return;
		}

		// An object occupies one position in the value, and its settings live in `replacements` at
		// that index. Writing there is how the editor's own formats edit an object in place;
		// rich-text's replace() is the String.replace-alike for text and does something else
		// entirely. Removing and re-inserting would work too, at the cost of the caret position
		// and a second undo step.
		const replacements = value.replacements.slice();

		replacements[ editing ] = {
			type: NAME,
			attributes: writeSettings( next, activeObjectAttributes ),
		} as ( typeof replacements )[ number ];

		onChange( { ...value, replacements } );
		onFocus();
	};

	const insert = ( media: SelectedMedia ) => {
		if ( ! media.url ) {
			return;
		}

		onChange(
			insertObject( value, {
				type: NAME,
				attributes: writeSettings( {
					...EMPTY_SETTINGS,
					src: media.url,
					// The library's alt text is a reasonable first guess; an empty one leaves the
					// icon decorative, which is the right default for an icon beside text.
					alt: media.alt || '',
				} ),
			} )
		);

		onFocus();
	};

	// With an icon selected the button opens its settings; otherwise it picks an image to insert.
	if ( isObjectActive ) {
		return (
			<>
				<RichTextToolbarButton
					icon="art"
					title={ __( 'Masked icon', 'masked-icon' ) }
					isActive
					onClick={ () => setEditing( value.start as number ) }
				/>

				{ editing !== null && (
					<IconSettingsPopover
						settings={ readSettings( activeObjectAttributes ) }
						onChange={ apply }
						onClose={ () => setEditing( null ) }
						contentRef={ contentRef }
					/>
				) }
			</>
		);
	}

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
		className: 'class',
	},
	edit: InlineIcon,
} );
