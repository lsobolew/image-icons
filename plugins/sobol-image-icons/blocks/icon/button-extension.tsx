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
	sobolImageIconsUrl: string;
	sobolImageIconsId: number;
	sobolImageIconsPosition: string;
	sobolImageIconsSize: string;
	/** The image's own proportions, as a CSS ratio - "800/1028". Empty when they are unknown. */
	sobolImageIconsRatio: string;
	sobolImageIconsGap: string;
	sobolImageIconsOriginal: boolean;
	sobolImageIconsIdle: string;
	sobolImageIconsIdleInterval: number;
	sobolImageIconsAnimation: string;
	sobolImageIconsDuration: number;
	/** Pre-0.2 "slide on hover" toggle, still read so older buttons keep working. */
	sobolImageIconsAnimate: boolean;
}

type Attributes = Partial< ButtonIconAttributes > & Record< string, unknown >;

const POSITION_OPTIONS: SelectOption[] = [
	{ label: __( 'After text', 'sobol-image-icons' ), value: 'after' },
	{ label: __( 'Before text', 'sobol-image-icons' ), value: 'before' },
];

const DEFAULTS: ButtonIconAttributes = {
	sobolImageIconsUrl: '',
	sobolImageIconsId: 0,
	sobolImageIconsPosition: 'after',
	sobolImageIconsSize: '1em',
	sobolImageIconsRatio: '',
	sobolImageIconsGap: '0.5em',
	sobolImageIconsOriginal: false,
	sobolImageIconsIdle: '',
	sobolImageIconsIdleInterval: DEFAULT_IDLE_INTERVAL,
	sobolImageIconsAnimation: '',
	sobolImageIconsDuration: DEFAULT_HOVER_DURATION,
	sobolImageIconsAnimate: false,
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
	const chosen = ( attributes.sobolImageIconsAnimation as string ) || '';

	if ( chosen ) {
		return chosen;
	}

	return attributes.sobolImageIconsAnimate ? 'slide' : '';
}

/** Adds our attributes to the button block definition. */
addFilter(
	'blocks.registerBlockType',
	'sobol-image-icons/button-attributes',
	( settings: Record< string, unknown >, name: string ) => {
		if ( name !== BLOCK ) {
			return settings;
		}

		return {
			...settings,
			attributes: {
				...( settings.attributes as Record< string, unknown > ),
				sobolImageIconsUrl: { type: 'string', default: DEFAULTS.sobolImageIconsUrl },
				sobolImageIconsId: { type: 'number', default: DEFAULTS.sobolImageIconsId },
				sobolImageIconsPosition: { type: 'string', default: DEFAULTS.sobolImageIconsPosition },
				sobolImageIconsSize: { type: 'string', default: DEFAULTS.sobolImageIconsSize },
				sobolImageIconsRatio: { type: 'string', default: DEFAULTS.sobolImageIconsRatio },
				sobolImageIconsGap: { type: 'string', default: DEFAULTS.sobolImageIconsGap },
				sobolImageIconsOriginal: { type: 'boolean', default: DEFAULTS.sobolImageIconsOriginal },
				sobolImageIconsIdle: { type: 'string', default: DEFAULTS.sobolImageIconsIdle },
				sobolImageIconsIdleInterval: {
					type: 'number',
					default: DEFAULTS.sobolImageIconsIdleInterval,
				},
				sobolImageIconsAnimation: { type: 'string', default: DEFAULTS.sobolImageIconsAnimation },
				sobolImageIconsDuration: { type: 'number', default: DEFAULTS.sobolImageIconsDuration },
				sobolImageIconsAnimate: { type: 'boolean', default: DEFAULTS.sobolImageIconsAnimate },
			},
		};
	}
);

/** The class names and custom properties that turn the pseudo-element into an icon. */
function iconProps( attributes: Attributes ) {
	const url = ( attributes.sobolImageIconsUrl as string ) || '';

	if ( ! url ) {
		return { className: '', style: {} as Record< string, string > };
	}

	const position = ( attributes.sobolImageIconsPosition as string ) || DEFAULTS.sobolImageIconsPosition;
	const animation = animationOf( attributes );
	const idle = ( attributes.sobolImageIconsIdle as string ) || '';

	// The slide adds no class of its own, so a button saved by an earlier version produces exactly
	// the markup it produced then and stays valid when somebody opens the post again.
	const className = [
		'has-sobol-image-icons',
		position === 'before' ? 'is-icon-before' : 'is-icon-after',
		attributes.sobolImageIconsOriginal ? 'is-icon-original' : '',
		idle ? `is-icon-idle-${ idle }` : '',
		animation ? 'is-icon-animated' : '',
		animation && animation !== 'slide' ? `is-icon-anim-${ animation }` : '',
	]
		.filter( Boolean )
		.join( ' ' );

	const style: Record< string, string > = {
		'--sobol-image-icons-image': `url(${ encodeURI( url ) })`,
		'--sobol-image-icons-size': ( attributes.sobolImageIconsSize as string ) || DEFAULTS.sobolImageIconsSize,
		'--sobol-image-icons-gap': ( attributes.sobolImageIconsGap as string ) || DEFAULTS.sobolImageIconsGap,
	};

	// Only written when the media library knew the dimensions, so a button saved before this
	// existed - or one masked with an SVG that reports no size - keeps exactly the markup it had
	// and falls back to the square box.
	const ratio = ( attributes.sobolImageIconsRatio as string ) || '';

	if ( ratio ) {
		style[ '--sobol-image-icons-ratio' ] = ratio;
	}

	// Only written when the animation that reads it is actually on, so a button carries no
	// declaration for something it does not do.
	if ( idle ) {
		style[ '--sobol-image-icons-idle-interval' ] = `${
			( attributes.sobolImageIconsIdleInterval as number ) ?? DEFAULT_IDLE_INTERVAL
		}s`;
	}

	if ( animation ) {
		style[ '--sobol-image-icons-hover-duration' ] = `${
			( attributes.sobolImageIconsDuration as number ) ?? DEFAULT_HOVER_DURATION
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
		const url = ( attributes.sobolImageIconsUrl as string ) || '';

		return (
			<>
				<BlockEdit { ...props } />

				<InspectorControls>
					<PanelBody title={ __( 'Icon', 'sobol-image-icons' ) } initialOpen={ false }>
						{ /* One row, so Replace and Remove are not two buttons stuck together. */ }
						<div className="sobol-image-icons-media-actions">
							<MediaUploadCheck>
								<MediaUpload
									allowedTypes={ [ 'image' ] }
									value={ attributes.sobolImageIconsId as number }
									onSelect={ ( media: SelectedMedia ) =>
										setAttributes( {
											sobolImageIconsUrl: media.url,
											sobolImageIconsId: media.id,
											sobolImageIconsRatio: ratioOf( media ),
										} )
									}
									render={ ( { open }: { open: () => void } ) => (
										<Button variant="secondary" onClick={ open }>
											{ url
												? __( 'Replace icon', 'sobol-image-icons' )
												: __( 'Choose icon', 'sobol-image-icons' ) }
										</Button>
									) }
								/>
							</MediaUploadCheck>

							{ url && (
								<Button
									variant="secondary"
									isDestructive
									onClick={ () =>
										setAttributes( { sobolImageIconsUrl: '', sobolImageIconsId: 0 } )
									}
								>
									{ __( 'Remove icon', 'sobol-image-icons' ) }
								</Button>
							) }
						</div>

						<p className="components-base-control__help">{ formatsHelp() }</p>

						{ url && (
							<>
								<SelectControl
									label={ __( 'Position', 'sobol-image-icons' ) }
									value={
										( attributes.sobolImageIconsPosition as string ) ||
										DEFAULTS.sobolImageIconsPosition
									}
									options={ POSITION_OPTIONS }
									onChange={ ( next: string ) =>
										setAttributes( { sobolImageIconsPosition: next } )
									}
								/>

								<UnitControl
									label={ __( 'Size', 'sobol-image-icons' ) }
									units={ LENGTH_UNITS }
									value={
										( attributes.sobolImageIconsSize as string ) || DEFAULTS.sobolImageIconsSize
									}
									onChange={ ( next?: string ) =>
										setAttributes( {
											sobolImageIconsSize:
												toLength(
													next,
													unitOf( attributes.sobolImageIconsSize as string )
												) || DEFAULTS.sobolImageIconsSize,
										} )
									}
								/>

								<UnitControl
									label={ __( 'Gap', 'sobol-image-icons' ) }
									units={ LENGTH_UNITS }
									value={
										( attributes.sobolImageIconsGap as string ) || DEFAULTS.sobolImageIconsGap
									}
									onChange={ ( next?: string ) =>
										setAttributes( {
											sobolImageIconsGap:
												toLength(
													next,
													unitOf( attributes.sobolImageIconsGap as string )
												) || DEFAULTS.sobolImageIconsGap,
										} )
									}
								/>

								<ToggleControl
									label={ __( 'Keep the original colours', 'sobol-image-icons' ) }
									help={ __(
										'Draws the file as it is instead of using it as a mask, so it keeps its own colours and stops following the text - including when the button changes colour on hover. Size, position, gap and the hover animation carry on working.',
										'sobol-image-icons'
									) }
									checked={ Boolean( attributes.sobolImageIconsOriginal ) }
									onChange={ ( next: boolean ) =>
										setAttributes( { sobolImageIconsOriginal: next } )
									}
								/>

								<SelectControl
									label={ __( 'Idle animation', 'sobol-image-icons' ) }
									help={ __(
										'Plays on its own, to draw the eye. Use it sparingly: on the page it never stops.',
										'sobol-image-icons'
									) }
									value={ ( attributes.sobolImageIconsIdle as string ) || '' }
									options={ IDLE_ANIMATION_OPTIONS }
									onChange={ ( next: string ) =>
										setAttributes( { sobolImageIconsIdle: next } )
									}
								/>

								{ Boolean( attributes.sobolImageIconsIdle ) && (
									<RangeControl
										label={ __( 'Repeat every', 'sobol-image-icons' ) }
										help={ __(
											'The icon moves at the start of each interval and rests for the remainder, so a longer interval means it twitches less often rather than more slowly.',
											'sobol-image-icons'
										) }
										min={ 0.5 }
										max={ 10 }
										step={ 0.5 }
										value={
											( attributes.sobolImageIconsIdleInterval as number ) ??
											DEFAULT_IDLE_INTERVAL
										}
										onChange={ ( next?: number ) =>
											setAttributes( {
												sobolImageIconsIdleInterval:
													next ?? DEFAULT_IDLE_INTERVAL,
											} )
										}
									/>
								) }

								<SelectControl
									label={ __( 'Hover animation', 'sobol-image-icons' ) }
									help={ __(
										'Plays while the pointer is on the button, and while somebody who reached it with the keyboard has it focused. It takes over from the idle one.',
										'sobol-image-icons'
									) }
									value={ animationOf( attributes ) }
									options={ HOVER_ANIMATION_OPTIONS }
									onChange={ ( next: string ) =>
										setAttributes( {
											sobolImageIconsAnimation: next,
											// The old boolean would otherwise keep the slide alive
											// underneath whatever was picked here.
											sobolImageIconsAnimate: false,
										} )
									}
								/>

								{ Boolean( animationOf( attributes ) ) && (
									<RangeControl
										label={ __( 'Speed', 'sobol-image-icons' ) }
										help={ __(
											'How long one cycle of the animation takes. Shorter is livelier.',
											'sobol-image-icons'
										) }
										min={ 0.1 }
										max={ 3 }
										step={ 0.1 }
										value={
											( attributes.sobolImageIconsDuration as number ) ??
											DEFAULT_HOVER_DURATION
										}
										onChange={ ( next?: number ) =>
											setAttributes( {
												sobolImageIconsDuration:
													next ?? DEFAULT_HOVER_DURATION,
											} )
										}
									/>
								) }

								<p className="components-base-control__help">
									{ __(
										'Readers who ask their system for reduced motion get none of these.',
										'sobol-image-icons'
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

addFilter( 'editor.BlockEdit', 'sobol-image-icons/button-controls', withIconControls );

/** Puts the icon on the saved markup. */
addFilter(
	'blocks.getSaveContent.extraProps',
	'sobol-image-icons/button-save',
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

addFilter( 'editor.BlockListBlock', 'sobol-image-icons/button-preview', withIconPreview );
