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
	RangeControl,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import type { ComponentType } from 'react';

import { LENGTH_UNITS, toLength, unitOf } from '../shared/units';
import { formatsHelp } from '../shared/formats';
import {
	HOVER_ANIMATION_OPTIONS,
	IDLE_ANIMATION_OPTIONS,
	DEFAULT_IDLE_INTERVAL,
	DEFAULT_HOVER_DURATION,
} from '../shared/icon-options';
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
	maskedIconIdle: string;
	maskedIconIdleInterval: number;
	maskedIconAnimation: string;
	maskedIconDuration: number;
	/** Pre-0.2 "slide on hover" toggle, still read so older buttons keep working. */
	maskedIconAnimate: boolean;
}

type Attributes = Partial< ButtonIconAttributes > & Record< string, unknown >;

const POSITION_OPTIONS: SelectOption[] = [
	{ label: __( 'After text', 'image-icons' ), value: 'after' },
	{ label: __( 'Before text', 'image-icons' ), value: 'before' },
];

const DEFAULTS: ButtonIconAttributes = {
	maskedIconUrl: '',
	maskedIconId: 0,
	maskedIconPosition: 'after',
	maskedIconSize: '1em',
	maskedIconRatio: '',
	maskedIconGap: '0.5em',
	maskedIconOriginal: false,
	maskedIconIdle: '',
	maskedIconIdleInterval: DEFAULT_IDLE_INTERVAL,
	maskedIconAnimation: '',
	maskedIconDuration: DEFAULT_HOVER_DURATION,
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
	'image-icons/button-attributes',
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
				maskedIconIdle: { type: 'string', default: DEFAULTS.maskedIconIdle },
				maskedIconIdleInterval: {
					type: 'number',
					default: DEFAULTS.maskedIconIdleInterval,
				},
				maskedIconAnimation: { type: 'string', default: DEFAULTS.maskedIconAnimation },
				maskedIconDuration: { type: 'number', default: DEFAULTS.maskedIconDuration },
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
	const idle = ( attributes.maskedIconIdle as string ) || '';

	// The slide adds no class of its own, so a button saved by an earlier version produces exactly
	// the markup it produced then and stays valid when somebody opens the post again.
	const className = [
		'has-image-icons',
		position === 'before' ? 'is-icon-before' : 'is-icon-after',
		attributes.maskedIconOriginal ? 'is-icon-original' : '',
		idle ? `is-icon-idle-${ idle }` : '',
		animation ? 'is-icon-animated' : '',
		animation && animation !== 'slide' ? `is-icon-anim-${ animation }` : '',
	]
		.filter( Boolean )
		.join( ' ' );

	const style: Record< string, string > = {
		'--image-icons-image': `url(${ encodeURI( url ) })`,
		'--image-icons-size': ( attributes.maskedIconSize as string ) || DEFAULTS.maskedIconSize,
		'--image-icons-gap': ( attributes.maskedIconGap as string ) || DEFAULTS.maskedIconGap,
	};

	// Only written when the media library knew the dimensions, so a button saved before this
	// existed - or one masked with an SVG that reports no size - keeps exactly the markup it had
	// and falls back to the square box.
	const ratio = ( attributes.maskedIconRatio as string ) || '';

	if ( ratio ) {
		style[ '--image-icons-ratio' ] = ratio;
	}

	// Only written when the animation that reads it is actually on, so a button carries no
	// declaration for something it does not do.
	if ( idle ) {
		style[ '--image-icons-idle-interval' ] = `${
			( attributes.maskedIconIdleInterval as number ) ?? DEFAULT_IDLE_INTERVAL
		}s`;
	}

	if ( animation ) {
		style[ '--image-icons-hover-duration' ] = `${
			( attributes.maskedIconDuration as number ) ?? DEFAULT_HOVER_DURATION
		}s`;
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
					<PanelBody title={ __( 'Icon', 'image-icons' ) } initialOpen={ false }>
						{ /* One row, so Replace and Remove are not two buttons stuck together. */ }
						<div className="image-icons-media-actions">
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
												? __( 'Replace icon', 'image-icons' )
												: __( 'Choose icon', 'image-icons' ) }
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
									{ __( 'Remove icon', 'image-icons' ) }
								</Button>
							) }
						</div>

						<p className="components-base-control__help">{ formatsHelp() }</p>

						{ url && (
							<>
								<SelectControl
									label={ __( 'Position', 'image-icons' ) }
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
									label={ __( 'Size', 'image-icons' ) }
									units={ LENGTH_UNITS }
									value={
										( attributes.maskedIconSize as string ) || DEFAULTS.maskedIconSize
									}
									onChange={ ( next?: string ) =>
										setAttributes( {
											maskedIconSize:
												toLength(
													next,
													unitOf( attributes.maskedIconSize as string )
												) || DEFAULTS.maskedIconSize,
										} )
									}
								/>

								<UnitControl
									label={ __( 'Gap', 'image-icons' ) }
									units={ LENGTH_UNITS }
									value={
										( attributes.maskedIconGap as string ) || DEFAULTS.maskedIconGap
									}
									onChange={ ( next?: string ) =>
										setAttributes( {
											maskedIconGap:
												toLength(
													next,
													unitOf( attributes.maskedIconGap as string )
												) || DEFAULTS.maskedIconGap,
										} )
									}
								/>

								<ToggleControl
									label={ __( 'Keep the original colours', 'image-icons' ) }
									help={ __(
										'Draws the file as it is instead of using it as a mask, so it keeps its own colours and stops following the text - including when the button changes colour on hover. Size, position, gap and the hover animation carry on working.',
										'image-icons'
									) }
									checked={ Boolean( attributes.maskedIconOriginal ) }
									onChange={ ( next: boolean ) =>
										setAttributes( { maskedIconOriginal: next } )
									}
								/>

								<SelectControl
									label={ __( 'Idle animation', 'image-icons' ) }
									help={ __(
										'Plays on its own, to draw the eye. Use it sparingly: on the page it never stops.',
										'image-icons'
									) }
									value={ ( attributes.maskedIconIdle as string ) || '' }
									options={ IDLE_ANIMATION_OPTIONS }
									onChange={ ( next: string ) =>
										setAttributes( { maskedIconIdle: next } )
									}
								/>

								{ Boolean( attributes.maskedIconIdle ) && (
									<RangeControl
										label={ __( 'Repeat every', 'image-icons' ) }
										help={ __(
											'The icon moves at the start of each interval and rests for the remainder, so a longer interval means it twitches less often rather than more slowly.',
											'image-icons'
										) }
										min={ 0.5 }
										max={ 10 }
										step={ 0.5 }
										value={
											( attributes.maskedIconIdleInterval as number ) ??
											DEFAULT_IDLE_INTERVAL
										}
										onChange={ ( next?: number ) =>
											setAttributes( {
												maskedIconIdleInterval:
													next ?? DEFAULT_IDLE_INTERVAL,
											} )
										}
									/>
								) }

								<SelectControl
									label={ __( 'Hover animation', 'image-icons' ) }
									help={ __(
										'Plays while the pointer is on the button, and while somebody who reached it with the keyboard has it focused. It takes over from the idle one.',
										'image-icons'
									) }
									value={ animationOf( attributes ) }
									options={ HOVER_ANIMATION_OPTIONS }
									onChange={ ( next: string ) =>
										setAttributes( {
											maskedIconAnimation: next,
											// The old boolean would otherwise keep the slide alive
											// underneath whatever was picked here.
											maskedIconAnimate: false,
										} )
									}
								/>

								{ Boolean( animationOf( attributes ) ) && (
									<RangeControl
										label={ __( 'Speed', 'image-icons' ) }
										help={ __(
											'How long one cycle of the animation takes. Shorter is livelier.',
											'image-icons'
										) }
										min={ 0.1 }
										max={ 3 }
										step={ 0.1 }
										value={
											( attributes.maskedIconDuration as number ) ??
											DEFAULT_HOVER_DURATION
										}
										onChange={ ( next?: number ) =>
											setAttributes( {
												maskedIconDuration:
													next ?? DEFAULT_HOVER_DURATION,
											} )
										}
									/>
								) }

								<p className="components-base-control__help">
									{ __(
										'Readers who ask their system for reduced motion get none of these.',
										'image-icons'
									) }
								</p>
							</>
						) }
					</PanelBody>
				</InspectorControls>
			</>
		);
	},
	'withImageIconControls'
);

addFilter( 'editor.BlockEdit', 'image-icons/button-controls', withIconControls );

/** Puts the icon on the saved markup. */
addFilter(
	'blocks.getSaveContent.extraProps',
	'image-icons/button-save',
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
	'withImageIconPreview'
);

addFilter( 'editor.BlockListBlock', 'image-icons/button-preview', withIconPreview );
