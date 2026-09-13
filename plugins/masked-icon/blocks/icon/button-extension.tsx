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
	SelectControl,
	ToggleControl,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import type { ComponentType } from 'react';

import { LENGTH_UNITS } from '../shared/units';
import type { SelectOption } from '../shared/types';

const BLOCK = 'core/button';

interface ButtonIconAttributes {
	maskedIconUrl: string;
	maskedIconId: number;
	maskedIconPosition: string;
	maskedIconSize: string;
	/** The image's own proportions, as a CSS ratio - "800/1028". Empty when they are unknown. */
	maskedIconRatio: string;
	maskedIconGap: string;
	maskedIconOriginal: boolean;
	maskedIconAnimation: string;
	/** Pre-0.2 "slide on hover" toggle, still read so older buttons keep working. */
	maskedIconAnimate: boolean;
}

type Attributes = Partial< ButtonIconAttributes > & Record< string, unknown >;

const POSITION_OPTIONS: SelectOption[] = [
	{ label: __( 'After text', 'masked-icon' ), value: 'after' },
	{ label: __( 'Before text', 'masked-icon' ), value: 'before' },
];

/**
 * Hover animations.
 *
 * Kept to the handful people actually reach for on a button: a nudge in the reading direction, a
 * turn for anything cross- or gear-shaped, a full spin for refresh icons, and two attention-
 * seeking ones. Every option is pure CSS on the pseudo-element and every one is switched off by
 * prefers-reduced-motion.
 */
const ANIMATION_OPTIONS: SelectOption[] = [
	{ label: __( 'None', 'masked-icon' ), value: '' },
	{ label: __( 'Slide', 'masked-icon' ), value: 'slide' },
	{ label: __( 'Rotate', 'masked-icon' ), value: 'rotate' },
	{ label: __( 'Spin', 'masked-icon' ), value: 'spin' },
	{ label: __( 'Grow', 'masked-icon' ), value: 'grow' },
	{ label: __( 'Bounce', 'masked-icon' ), value: 'bounce' },
	{ label: __( 'Wiggle', 'masked-icon' ), value: 'wiggle' },
];

const DEFAULTS: ButtonIconAttributes = {
	maskedIconUrl: '',
	maskedIconId: 0,
	maskedIconPosition: 'after',
	maskedIconSize: '1em',
	maskedIconRatio: '',
	maskedIconGap: '0.5em',
	maskedIconOriginal: false,
	maskedIconAnimation: '',
	maskedIconAnimate: false,
};

interface SelectedMedia {
	id: number;
	url: string;
	width?: number;
	height?: number;
}

/**
 * The image's proportions, as a CSS ratio the stylesheet can hand to aspect-ratio.
 *
 * The icon on a button is a pseudo-element, so unlike the inline icon it has no image of its own
 * to be measured from - the dimensions have to come from the media library at the moment the icon
 * is chosen. Anything the library cannot measure, such as an SVG without intrinsic dimensions,
 * returns nothing and the stylesheet falls back to a square.
 */
function ratioOf( media: SelectedMedia ): string {
	if ( ! media.width || ! media.height ) {
		return '';
	}

	return `${ media.width }/${ media.height }`;
}

/**
 * The animation to use, whichever attribute carries it.
 *
 * Buttons saved before the list existed have the boolean instead, and it means the slide.
 */
function animationOf( attributes: Attributes ): string {
	const chosen = ( attributes.maskedIconAnimation as string ) || '';

	if ( chosen ) {
		return chosen;
	}

	return attributes.maskedIconAnimate ? 'slide' : '';
}

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
				maskedIconRatio: { type: 'string', default: DEFAULTS.maskedIconRatio },
				maskedIconGap: { type: 'string', default: DEFAULTS.maskedIconGap },
				maskedIconOriginal: { type: 'boolean', default: DEFAULTS.maskedIconOriginal },
				maskedIconAnimation: { type: 'string', default: DEFAULTS.maskedIconAnimation },
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
	const animation = animationOf( attributes );

	// The slide adds no class of its own, so a button saved by an earlier version produces exactly
	// the markup it produced then and stays valid when somebody opens the post again.
	const className = [
		'has-masked-icon',
		position === 'before' ? 'is-icon-before' : 'is-icon-after',
		attributes.maskedIconOriginal ? 'is-icon-original' : '',
		animation ? 'is-icon-animated' : '',
		animation && animation !== 'slide' ? `is-icon-anim-${ animation }` : '',
	]
		.filter( Boolean )
		.join( ' ' );

	const style: Record< string, string > = {
		'--masked-icon-image': `url(${ encodeURI( url ) })`,
		'--masked-icon-size': ( attributes.maskedIconSize as string ) || DEFAULTS.maskedIconSize,
		'--masked-icon-gap': ( attributes.maskedIconGap as string ) || DEFAULTS.maskedIconGap,
	};

	// Only written when the media library knew the dimensions, so a button saved before this
	// existed - or one masked with an SVG that reports no size - keeps exactly the markup it had
	// and falls back to the square box.
	const ratio = ( attributes.maskedIconRatio as string ) || '';

	if ( ratio ) {
		style[ '--masked-icon-ratio' ] = ratio;
	}

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
						{ /* One row, so Replace and Remove are not two buttons stuck together. */ }
						<div className="masked-icon-media-actions">
							<MediaUploadCheck>
								<MediaUpload
									allowedTypes={ [ 'image' ] }
									value={ attributes.maskedIconId as number }
									onSelect={ ( media: SelectedMedia ) =>
										setAttributes( {
											maskedIconUrl: media.url,
											maskedIconId: media.id,
											maskedIconRatio: ratioOf( media ),
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
								<Button
									variant="secondary"
									isDestructive
									onClick={ () =>
										setAttributes( { maskedIconUrl: '', maskedIconId: 0 } )
									}
								>
									{ __( 'Remove icon', 'masked-icon' ) }
								</Button>
							) }
						</div>

						<p className="components-base-control__help">
							{ __(
								'PNG, SVG, WebP, AVIF and GIF all work. The icon is cut out of the parts of the image that are not transparent, so a file with a transparent background gives the best result - a JPEG, which cannot be transparent, comes out as a solid rectangle.',
								'masked-icon'
							) }
						</p>

						{ url && (
							<>
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

								<UnitControl
									label={ __( 'Size', 'masked-icon' ) }
									units={ LENGTH_UNITS }
									value={
										( attributes.maskedIconSize as string ) || DEFAULTS.maskedIconSize
									}
									onChange={ ( next?: string ) =>
										setAttributes( {
											maskedIconSize: next || DEFAULTS.maskedIconSize,
										} )
									}
								/>

								<UnitControl
									label={ __( 'Gap', 'masked-icon' ) }
									units={ LENGTH_UNITS }
									value={
										( attributes.maskedIconGap as string ) || DEFAULTS.maskedIconGap
									}
									onChange={ ( next?: string ) =>
										setAttributes( {
											maskedIconGap: next || DEFAULTS.maskedIconGap,
										} )
									}
								/>

								<ToggleControl
									label={ __( 'Keep the original colours', 'masked-icon' ) }
									help={ __(
										'Draws the file as it is instead of using it as a mask, so it keeps its own colours and stops following the text - including when the button changes colour on hover. Size, position, gap and the hover animation carry on working.',
										'masked-icon'
									) }
									checked={ Boolean( attributes.maskedIconOriginal ) }
									onChange={ ( next: boolean ) =>
										setAttributes( { maskedIconOriginal: next } )
									}
								/>

								<SelectControl
									label={ __( 'Hover animation', 'masked-icon' ) }
									help={ __(
										'Plays while the pointer is on the button. Readers who ask for reduced motion get none of them.',
										'masked-icon'
									) }
									value={ animationOf( attributes ) }
									options={ ANIMATION_OPTIONS }
									onChange={ ( next: string ) =>
										setAttributes( {
											maskedIconAnimation: next,
											// The old boolean would otherwise keep the slide alive
											// underneath whatever was picked here.
											maskedIconAnimate: false,
										} )
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
