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
	{ label: __( 'Contain', 'masked-icon' ), value: 'contain' },
	{ label: __( 'Cover', 'masked-icon' ), value: 'cover' },
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
						title: __( 'Masked Icon', 'masked-icon' ),
						instructions: `${ __(
							'Pick any image. It is used as a mask, so the icon takes the colour of the surrounding text rather than the colours in the file.',
							'masked-icon'
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
								{ __( 'Replace', 'masked-icon' ) }
							</ToolbarButton>
						) }
					/>
				</MediaUploadCheck>

				<ToolbarButton onClick={ () => setAttributes( { url: '', mediaId: 0 } ) }>
					{ __( 'Remove image', 'masked-icon' ) }
				</ToolbarButton>
			</BlockControls>

			<InspectorControls>
				<PanelBody title={ __( 'Icon', 'masked-icon' ) }>
					<UnitControl
						label={ __( 'Size', 'masked-icon' ) }
						help={ __(
							'1em keeps the icon in step with the text around it.',
							'masked-icon'
						) }
						units={ LENGTH_UNITS }
						value={ size }
						onChange={ ( next?: string ) =>
							setAttributes( { size: toLength( next, unitOf( size ) ) || '1em' } )
						}
					/>

					<SelectControl
						label={ __( 'Fit', 'masked-icon' ) }
						value={ fit }
						options={ FIT_OPTIONS }
						onChange={ ( next: string ) => setAttributes( { fit: next } ) }
					/>

					<TextControl
						label={ __( 'Label', 'masked-icon' ) }
						help={ __(
							'Describes the icon for screen readers. Leave empty when the icon is decorative and repeats nearby text.',
							'masked-icon'
						) }
						value={ label }
						onChange={ ( next: string ) => setAttributes( { label: next } ) }
					/>

					<TextControl
						label={ __( 'Link', 'masked-icon' ) }
						type="url"
						value={ href }
						onChange={ ( next: string ) => setAttributes( { href: next } ) }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<span
					className="wp-block-masked-icon-icon__mark"
					style={ maskStyle( attributes ) }
				/>
			</div>
		</>
	);
}
