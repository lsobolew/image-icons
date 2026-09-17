import {
	useBlockProps,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadCheck,
	BlockControls,
	AlignmentControl,
	useSettings,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	ToggleControl,
	ToolbarButton,
	BaseControl,
	ColorPalette,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { maskStyle, maskClasses } from './style-props';
import { formatsHelp } from '../shared/formats';
import { LENGTH_UNITS, toLength, unitOf } from '../shared/units';
import type { IconEditProps } from './types';

interface Media {
	id: number;
	url: string;
	alt?: string;
	width?: number;
	height?: number;
}

interface PaletteColor {
	name: string;
	slug: string;
	color: string;
}

export default function Edit( { attributes, setAttributes }: IconEditProps ) {
	const { url, label, size, align, original, presetColor, customColor, href, linkTarget } =
		attributes;

	const [ palette ] = useSettings( 'color.palette' ) as [ PaletteColor[] | undefined ];
	const colors: PaletteColor[] = palette || [];

	const blockProps = useBlockProps( {
		className: [ url ? '' : 'is-placeholder', maskClasses( attributes ) ]
			.filter( Boolean )
			.join( ' ' ),
	} );

	const onSelect = ( media: Media ) =>
		setAttributes( {
			url: media.url,
			mediaId: media.id,
			// The proportions come from the library, because the mark is an empty span with no
			// image of its own to be measured from. Without them the icon is a square and a tall
			// or wide mark sits in it with space either side.
			ratio: media.width && media.height ? `${ media.width }/${ media.height }` : '',
			// Alt text from the library is a reasonable first guess at an accessible name.
			label: label || media.alt || '',
		} );

	if ( ! url ) {
		return (
			<div { ...blockProps }>
				<MediaPlaceholder
					icon="art"
					labels={ {
						title: __( 'Image Icon', 'image-icons' ),
						instructions: `${ __(
							'Pick any image. It is used as a mask, so the icon takes the colour you set rather than the colours in the file.',
							'image-icons'
						) } ${ formatsHelp() }`,
					} }
					onSelect={ onSelect }
					accept="image/*"
					allowedTypes={ [ 'image' ] }
				/>
			</div>
		);
	}

	// ColorPalette works in literal colours, so a stored palette slug has to be turned back into
	// one to show which swatch is selected.
	const selectedColor = presetColor
		? colors.find( ( entry ) => entry.slug === presetColor )?.color || ''
		: customColor;

	const onColor = ( next?: string ) => {
		const match = colors.find( ( entry ) => entry.color === next );

		setAttributes( {
			presetColor: match?.slug || '',
			customColor: match ? '' : next || '',
		} );
	};

	return (
		<>
			<BlockControls>
				<AlignmentControl
					value={ align }
					onChange={ ( next?: string ) => setAttributes( { align: next || '' } ) }
				/>

				<MediaUploadCheck>
					<MediaUpload
						allowedTypes={ [ 'image' ] }
						value={ attributes.mediaId }
						onSelect={ onSelect }
						render={ ( { open }: { open: () => void } ) => (
							<ToolbarButton onClick={ open }>
								{ __( 'Replace', 'image-icons' ) }
							</ToolbarButton>
						) }
					/>
				</MediaUploadCheck>

				<ToolbarButton
					onClick={ () => setAttributes( { url: '', mediaId: 0, ratio: '' } ) }
				>
					{ __( 'Remove image', 'image-icons' ) }
				</ToolbarButton>
			</BlockControls>

			<InspectorControls>
				<PanelBody title={ __( 'Icon', 'image-icons' ) }>
					<UnitControl
						label={ __( 'Size', 'image-icons' ) }
						help={ __(
							'1em keeps the icon in step with the text around it.',
							'image-icons'
						) }
						units={ LENGTH_UNITS }
						value={ size }
						onChange={ ( next?: string ) =>
							setAttributes( { size: toLength( next, unitOf( size ) ) || '1em' } )
						}
					/>

					<ToggleControl
						label={ __( 'Keep the original colours', 'image-icons' ) }
						help={ __(
							'Draws the file as it is instead of using it as a mask, so it keeps its own colours. The size and placement still apply.',
							'image-icons'
						) }
						checked={ original }
						onChange={ ( next: boolean ) => setAttributes( { original: next } ) }
					/>

					{ ! original && (
						<BaseControl
							__nextHasNoMarginBottom
							id="image-icons-block-colour"
							label={ __( 'Colour', 'image-icons' ) }
							help={ __(
								'Leave this unset and the icon takes the colour of the text around it.',
								'image-icons'
							) }
						>
							<ColorPalette
								value={ selectedColor }
								colors={ colors }
								onChange={ onColor }
							/>
						</BaseControl>
					) }

					<TextControl
						label={ __( 'Alternative text', 'image-icons' ) }
						help={ __(
							'Describes the icon for screen readers. Leave it empty when the icon only decorates text that already says the same thing.',
							'image-icons'
						) }
						value={ label }
						onChange={ ( next: string ) => setAttributes( { label: next } ) }
					/>

					<TextControl
						label={ __( 'Link', 'image-icons' ) }
						type="url"
						value={ href }
						onChange={ ( next: string ) => setAttributes( { href: next } ) }
					/>

					{ Boolean( href ) && (
						<ToggleControl
							label={ __( 'Open in a new tab', 'image-icons' ) }
							checked={ '_blank' === linkTarget }
							onChange={ ( next: boolean ) =>
								setAttributes( {
									linkTarget: next ? '_blank' : '',
									// A link opening a new tab hands the new page a reference back
									// to this one unless told not to.
									rel: next ? 'noreferrer noopener' : '',
								} )
							}
						/>
					) }
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<span
					className="wp-block-image-icons-icon__mark"
					style={ maskStyle( attributes ) }
				/>
			</div>
		</>
	);
}
