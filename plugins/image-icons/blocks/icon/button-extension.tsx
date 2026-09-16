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
	imageIconsUrl: string;
	imageIconsId: number;
	imageIconsPosition: string;
	imageIconsSize: string;
	/** The image's own proportions, as a CSS ratio - "800/1028". Empty when they are unknown. */
	imageIconsRatio: string;
	imageIconsGap: string;
	imageIconsOriginal: boolean;
	imageIconsIdle: string;
	imageIconsIdleInterval: number;
	imageIconsAnimation: string;
	imageIconsDuration: number;
	/** Pre-0.2 "slide on hover" toggle, still read so older buttons keep working. */
	imageIconsAnimate: boolean;
}

type Attributes = Partial< ButtonIconAttributes > & Record< string, unknown >;

const POSITION_OPTIONS: SelectOption[] = [
	{ label: __( 'After text', 'image-icons' ), value: 'after' },
	{ label: __( 'Before text', 'image-icons' ), value: 'before' },
];

const DEFAULTS: ButtonIconAttributes = {
	imageIconsUrl: '',
	imageIconsId: 0,
	imageIconsPosition: 'after',
	imageIconsSize: '1em',
	imageIconsRatio: '',
	imageIconsGap: '0.5em',
	imageIconsOriginal: false,
	imageIconsIdle: '',
	imageIconsIdleInterval: DEFAULT_IDLE_INTERVAL,
	imageIconsAnimation: '',
	imageIconsDuration: DEFAULT_HOVER_DURATION,
	imageIconsAnimate: false,
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
	const chosen = ( attributes.imageIconsAnimation as string ) || '';

	if ( chosen ) {
		return chosen;
	}

	return attributes.imageIconsAnimate ? 'slide' : '';
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
				imageIconsUrl: { type: 'string', default: DEFAULTS.imageIconsUrl },
				imageIconsId: { type: 'number', default: DEFAULTS.imageIconsId },
				imageIconsPosition: { type: 'string', default: DEFAULTS.imageIconsPosition },
				imageIconsSize: { type: 'string', default: DEFAULTS.imageIconsSize },
				imageIconsRatio: { type: 'string', default: DEFAULTS.imageIconsRatio },
				imageIconsGap: { type: 'string', default: DEFAULTS.imageIconsGap },
				imageIconsOriginal: { type: 'boolean', default: DEFAULTS.imageIconsOriginal },
				imageIconsIdle: { type: 'string', default: DEFAULTS.imageIconsIdle },
				imageIconsIdleInterval: {
					type: 'number',
					default: DEFAULTS.imageIconsIdleInterval,
				},
				imageIconsAnimation: { type: 'string', default: DEFAULTS.imageIconsAnimation },
				imageIconsDuration: { type: 'number', default: DEFAULTS.imageIconsDuration },
				imageIconsAnimate: { type: 'boolean', default: DEFAULTS.imageIconsAnimate },
			},
		};
	}
);

/** The class names and custom properties that turn the pseudo-element into an icon. */
function iconProps( attributes: Attributes ) {
	const url = ( attributes.imageIconsUrl as string ) || '';

	if ( ! url ) {
		return { className: '', style: {} as Record< string, string > };
	}

	const position = ( attributes.imageIconsPosition as string ) || DEFAULTS.imageIconsPosition;
	const animation = animationOf( attributes );
	const idle = ( attributes.imageIconsIdle as string ) || '';

	// The slide adds no class of its own, so a button saved by an earlier version produces exactly
	// the markup it produced then and stays valid when somebody opens the post again.
	const className = [
		'has-image-icons',
		position === 'before' ? 'is-icon-before' : 'is-icon-after',
		attributes.imageIconsOriginal ? 'is-icon-original' : '',
		idle ? `is-icon-idle-${ idle }` : '',
		animation ? 'is-icon-animated' : '',
		animation && animation !== 'slide' ? `is-icon-anim-${ animation }` : '',
	]
		.filter( Boolean )
		.join( ' ' );

	const style: Record< string, string > = {
		'--image-icons-image': `url(${ encodeURI( url ) })`,
		'--image-icons-size': ( attributes.imageIconsSize as string ) || DEFAULTS.imageIconsSize,
		'--image-icons-gap': ( attributes.imageIconsGap as string ) || DEFAULTS.imageIconsGap,
	};

	// Only written when the media library knew the dimensions, so a button saved before this
	// existed - or one masked with an SVG that reports no size - keeps exactly the markup it had
	// and falls back to the square box.
	const ratio = ( attributes.imageIconsRatio as string ) || '';

	if ( ratio ) {
		style[ '--image-icons-ratio' ] = ratio;
	}

	// Only written when the animation that reads it is actually on, so a button carries no
	// declaration for something it does not do.
	if ( idle ) {
		style[ '--image-icons-idle-interval' ] = `${
			( attributes.imageIconsIdleInterval as number ) ?? DEFAULT_IDLE_INTERVAL
		}s`;
	}

	if ( animation ) {
		style[ '--image-icons-hover-duration' ] = `${
			( attributes.imageIconsDuration as number ) ?? DEFAULT_HOVER_DURATION
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
		const url = ( attributes.imageIconsUrl as string ) || '';

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
									value={ attributes.imageIconsId as number }
									onSelect={ ( media: SelectedMedia ) =>
										setAttributes( {
											imageIconsUrl: media.url,
											imageIconsId: media.id,
											imageIconsRatio: ratioOf( media ),
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
										setAttributes( { imageIconsUrl: '', imageIconsId: 0 } )
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
										( attributes.imageIconsPosition as string ) ||
										DEFAULTS.imageIconsPosition
									}
									options={ POSITION_OPTIONS }
									onChange={ ( next: string ) =>
										setAttributes( { imageIconsPosition: next } )
									}
								/>

								<UnitControl
									label={ __( 'Size', 'image-icons' ) }
									units={ LENGTH_UNITS }
									value={
										( attributes.imageIconsSize as string ) || DEFAULTS.imageIconsSize
									}
									onChange={ ( next?: string ) =>
										setAttributes( {
											imageIconsSize:
												toLength(
													next,
													unitOf( attributes.imageIconsSize as string )
												) || DEFAULTS.imageIconsSize,
										} )
									}
								/>

								<UnitControl
									label={ __( 'Gap', 'image-icons' ) }
									units={ LENGTH_UNITS }
									value={
										( attributes.imageIconsGap as string ) || DEFAULTS.imageIconsGap
									}
									onChange={ ( next?: string ) =>
										setAttributes( {
											imageIconsGap:
												toLength(
													next,
													unitOf( attributes.imageIconsGap as string )
												) || DEFAULTS.imageIconsGap,
										} )
									}
								/>

								<ToggleControl
									label={ __( 'Keep the original colours', 'image-icons' ) }
									help={ __(
										'Draws the file as it is instead of using it as a mask, so it keeps its own colours and stops following the text - including when the button changes colour on hover. Size, position, gap and the hover animation carry on working.',
										'image-icons'
									) }
									checked={ Boolean( attributes.imageIconsOriginal ) }
									onChange={ ( next: boolean ) =>
										setAttributes( { imageIconsOriginal: next } )
									}
								/>

								<SelectControl
									label={ __( 'Idle animation', 'image-icons' ) }
									help={ __(
										'Plays on its own, to draw the eye. Use it sparingly: on the page it never stops.',
										'image-icons'
									) }
									value={ ( attributes.imageIconsIdle as string ) || '' }
									options={ IDLE_ANIMATION_OPTIONS }
									onChange={ ( next: string ) =>
										setAttributes( { imageIconsIdle: next } )
									}
								/>

								{ Boolean( attributes.imageIconsIdle ) && (
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
											( attributes.imageIconsIdleInterval as number ) ??
											DEFAULT_IDLE_INTERVAL
										}
										onChange={ ( next?: number ) =>
											setAttributes( {
												imageIconsIdleInterval:
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
											imageIconsAnimation: next,
											// The old boolean would otherwise keep the slide alive
											// underneath whatever was picked here.
											imageIconsAnimate: false,
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
											( attributes.imageIconsDuration as number ) ??
											DEFAULT_HOVER_DURATION
										}
										onChange={ ( next?: number ) =>
											setAttributes( {
												imageIconsDuration:
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
