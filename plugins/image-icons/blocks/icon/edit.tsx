import {
	useBlockProps,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadCheck,
	BlockControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	SelectControl,
	ToolbarButton,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { maskStyle } from './style-props';
import type { IconEditProps } from './types';
import { LENGTH_UNITS, toLength, unitOf } from '../shared/units';
import { formatsHelp } from '../shared/formats';
import type { SelectOption } from '../shared/types';

interface Media {
	id: number;
	url: string;
	alt?: string;
}

const FIT_OPTIONS: SelectOption[] = [
	{ label: __( 'Contain', 'image-icons' ), value: 'contain' },
	{ label: __( 'Cover', 'image-icons' ), value: 'cover' },
];

export default function Edit( { attributes, setAttributes }: IconEditProps ) {
	const { url, label, size, fit, href } = attributes;

	const blockProps = useBlockProps( { className: url ? undefined : 'is-placeholder' } );

	const onSelect = ( media: Media ) =>
		setAttributes( {
			url: media.url,
			mediaId: media.id,
			// Alt text from the library is a reasonable first guess at an accessible name.
			label: label || media.alt || '',
		} );

	if ( ! url ) {
		return (
			<div { ...blockProps }>
				<MediaPlaceholder
					icon="art"
					labels={ {
						title: __( 'Image Icons', 'image-icons' ),
						instructions: `${ __(
							'Pick any image. It is used as a mask, so the icon takes the colour of the surrounding text rather than the colours in the file.',
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

	return (
		<>
			<BlockControls>
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

				<ToolbarButton onClick={ () => setAttributes( { url: '', mediaId: 0 } ) }>
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

					<SelectControl
						label={ __( 'Fit', 'image-icons' ) }
						value={ fit }
						options={ FIT_OPTIONS }
						onChange={ ( next: string ) => setAttributes( { fit: next } ) }
					/>

					<TextControl
						label={ __( 'Label', 'image-icons' ) }
						help={ __(
							'Describes the icon for screen readers. Leave empty when the icon is decorative and repeats nearby text.',
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
