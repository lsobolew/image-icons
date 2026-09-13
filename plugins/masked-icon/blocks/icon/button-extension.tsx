/**
 * Adds an icon to the native core/button block.
 *
 * The deliberate choice here is what this does *not* do. It does not register another button
 * block, so every native affordance - block styles, colour and typography supports, theme.json
 * styling, the width controls, link settings - keeps working untouched. The icon arrives as a
 * pseudo-element driven by custom properties, which means no extra markup inside the anchor and
 * no JavaScript on the front end.
 *
 * The custom properties matter for a second reason: WordPress strips `mask-image` from inline
 * styles for anyone without `unfiltered_html`, and on multisite that is everyone except the super
 * admin. A custom property survives, so the button looks the same for the site owner and for the
 * editor who is not an administrator.
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls, MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import {
	PanelBody,
	Button,
	TextControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import type { ComponentType } from 'react';

import type { SelectOption } from '../shared/types';

const BLOCK = 'core/button';

interface ButtonIconAttributes {
	maskedIconUrl: string;
	maskedIconId: number;
	maskedIconPosition: string;
	maskedIconSize: string;
	maskedIconGap: string;
	maskedIconAnimate: boolean;
}

type Attributes = Partial< ButtonIconAttributes > & Record< string, unknown >;

const POSITION_OPTIONS: SelectOption[] = [
	{ label: __( 'After text', 'masked-icon' ), value: 'after' },
	{ label: __( 'Before text', 'masked-icon' ), value: 'before' },
];

const DEFAULTS: ButtonIconAttributes = {
	maskedIconUrl: '',
	maskedIconId: 0,
	maskedIconPosition: 'after',
	maskedIconSize: '1em',
	maskedIconGap: '0.5em',
	maskedIconAnimate: false,
};

/** Adds our attributes to the button block definition. */
addFilter(
	'blocks.registerBlockType',
	'masked-icon/button-attributes',
	( settings: Record< string, unknown >, name: string ) => {
		if ( name !== BLOCK ) {
			return settings;
		}

		return {
			...settings,
			attributes: {
				...( settings.attributes as Record< string, unknown > ),
				maskedIconUrl: { type: 'string', default: DEFAULTS.maskedIconUrl },
				maskedIconId: { type: 'number', default: DEFAULTS.maskedIconId },
				maskedIconPosition: { type: 'string', default: DEFAULTS.maskedIconPosition },
				maskedIconSize: { type: 'string', default: DEFAULTS.maskedIconSize },
				maskedIconGap: { type: 'string', default: DEFAULTS.maskedIconGap },
				maskedIconAnimate: { type: 'boolean', default: DEFAULTS.maskedIconAnimate },
			},
		};
	}
);

/** The class names and custom properties that turn the pseudo-element into an icon. */
function iconProps( attributes: Attributes ) {
	const url = ( attributes.maskedIconUrl as string ) || '';

	if ( ! url ) {
		return { className: '', style: {} as Record< string, string > };
	}

	const position = ( attributes.maskedIconPosition as string ) || DEFAULTS.maskedIconPosition;
	const animate = Boolean( attributes.maskedIconAnimate );

	const className = [
		'has-masked-icon',
		position === 'before' ? 'is-icon-before' : 'is-icon-after',
		animate ? 'is-icon-animated' : '',
	]
		.filter( Boolean )
		.join( ' ' );

	const style: Record< string, string > = {
		'--masked-icon-image': `url(${ encodeURI( url ) })`,
		'--masked-icon-size': ( attributes.maskedIconSize as string ) || DEFAULTS.maskedIconSize,
		'--masked-icon-gap': ( attributes.maskedIconGap as string ) || DEFAULTS.maskedIconGap,
	};

	return { className, style };
}

/** Sidebar controls, added to the button's own inspector. */
const withIconControls = createHigherOrderComponent(
	( BlockEdit: ComponentType< Record< string, unknown > > ) => ( props: Record< string, unknown > ) => {
		if ( props.name !== BLOCK ) {
			return <BlockEdit { ...props } />;
		}

		const attributes = props.attributes as Attributes;
		const setAttributes = props.setAttributes as ( next: Attributes ) => void;
		const url = ( attributes.maskedIconUrl as string ) || '';

		return (
			<>
				<BlockEdit { ...props } />

				<InspectorControls>
					<PanelBody title={ __( 'Icon', 'masked-icon' ) } initialOpen={ false }>
						<MediaUploadCheck>
							<MediaUpload
								allowedTypes={ [ 'image' ] }
								value={ attributes.maskedIconId as number }
								onSelect={ ( media: { id: number; url: string } ) =>
									setAttributes( {
										maskedIconUrl: media.url,
										maskedIconId: media.id,
									} )
								}
								render={ ( { open }: { open: () => void } ) => (
									<Button variant="secondary" onClick={ open }>
										{ url
											? __( 'Replace icon', 'masked-icon' )
											: __( 'Choose icon', 'masked-icon' ) }
									</Button>
								) }
							/>
						</MediaUploadCheck>

						{ url && (
							<>
								<Button
									variant="link"
									isDestructive
									onClick={ () =>
										setAttributes( { maskedIconUrl: '', maskedIconId: 0 } )
									}
								>
									{ __( 'Remove icon', 'masked-icon' ) }
								</Button>

								<SelectControl
									label={ __( 'Position', 'masked-icon' ) }
									value={
										( attributes.maskedIconPosition as string ) ||
										DEFAULTS.maskedIconPosition
									}
									options={ POSITION_OPTIONS }
									onChange={ ( next: string ) =>
										setAttributes( { maskedIconPosition: next } )
									}
								/>

								<TextControl
									label={ __( 'Size', 'masked-icon' ) }
									value={
										( attributes.maskedIconSize as string ) || DEFAULTS.maskedIconSize
									}
									onChange={ ( next: string ) =>
										setAttributes( { maskedIconSize: next } )
									}
								/>

								<TextControl
									label={ __( 'Gap', 'masked-icon' ) }
									value={
										( attributes.maskedIconGap as string ) || DEFAULTS.maskedIconGap
									}
									onChange={ ( next: string ) =>
										setAttributes( { maskedIconGap: next } )
									}
								/>

								<ToggleControl
									label={ __( 'Slide on hover', 'masked-icon' ) }
									help={ __(
										'Nudges the icon away from the text on hover. Respects reduced-motion settings.',
										'masked-icon'
									) }
									checked={ Boolean( attributes.maskedIconAnimate ) }
									onChange={ ( next: boolean ) =>
										setAttributes( { maskedIconAnimate: next } )
									}
								/>
							</>
						) }
					</PanelBody>
				</InspectorControls>
			</>
		);
	},
	'withMaskedIconControls'
);

addFilter( 'editor.BlockEdit', 'masked-icon/button-controls', withIconControls );

/** Puts the icon on the saved markup. */
addFilter(
	'blocks.getSaveContent.extraProps',
	'masked-icon/button-save',
	( props: Record< string, unknown >, blockType: { name: string }, attributes: Attributes ) => {
		if ( blockType.name !== BLOCK ) {
			return props;
		}

		const { className, style } = iconProps( attributes );

		if ( ! className ) {
			return props;
		}

		return {
			...props,
			className: [ props.className, className ].filter( Boolean ).join( ' ' ),
			style: { ...( props.style as object ), ...style },
		};
	}
);

/** Shows the same icon in the editor canvas. */
const withIconPreview = createHigherOrderComponent(
	( BlockListBlock: ComponentType< Record< string, unknown > > ) =>
		( props: Record< string, unknown > ) => {
			if ( props.name !== BLOCK ) {
				return <BlockListBlock { ...props } />;
			}

			const { className, style } = iconProps( props.attributes as Attributes );

			if ( ! className ) {
				return <BlockListBlock { ...props } />;
			}

			return (
				<BlockListBlock
					{ ...props }
					className={ [ props.className, className ].filter( Boolean ).join( ' ' ) }
					wrapperProps={ { ...( props.wrapperProps as object ), style } }
				/>
			);
		},
	'withMaskedIconPreview'
);

addFilter( 'editor.BlockListBlock', 'masked-icon/button-preview', withIconPreview );
