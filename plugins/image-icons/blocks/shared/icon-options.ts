/**
 * The option lists the icon controls share, and the defaults behind them.
 *
 * Kept apart from the components so the button inspector and the inline popover cannot drift into
 * offering different things for the same setting.
 */
import { __ } from '@wordpress/i18n';

import type { SelectOption } from './types';

/** How the icon sits against the text. Plain vertical-align keywords, resolved by the browser. */
export const ALIGN_OPTIONS: SelectOption[] = [
	{ label: __( 'Middle', 'image-icons' ), value: 'middle' },
	{ label: __( 'Text bottom', 'image-icons' ), value: 'text-bottom' },
	{ label: __( 'Text top', 'image-icons' ), value: 'text-top' },
];

export const DEFAULT_ALIGN = 'middle';

/**
 * Animations that play while the pointer is on the button.
 *
 * The handful people actually reach for: a nudge in the reading direction, a turn for anything
 * cross- or gear-shaped, a full spin for refresh icons, and two attention-seeking ones.
 */
export const HOVER_ANIMATION_OPTIONS: SelectOption[] = [
	{ label: __( 'None', 'image-icons' ), value: '' },
	{ label: __( 'Slide', 'image-icons' ), value: 'slide' },
	{ label: __( 'Rotate', 'image-icons' ), value: 'rotate' },
	{ label: __( 'Spin', 'image-icons' ), value: 'spin' },
	{ label: __( 'Grow', 'image-icons' ), value: 'grow' },
	{ label: __( 'Bounce', 'image-icons' ), value: 'bounce' },
	{ label: __( 'Wiggle', 'image-icons' ), value: 'wiggle' },
];

/**
 * Animations that play on their own, without anybody hovering.
 *
 * Only the ones that return to where they started belong here - a slide or a rotate would simply
 * leave the icon parked somewhere else, which is a position, not an animation.
 */
export const IDLE_ANIMATION_OPTIONS: SelectOption[] = [
	{ label: __( 'None', 'image-icons' ), value: '' },
	{ label: __( 'Bounce', 'image-icons' ), value: 'bounce' },
	{ label: __( 'Wiggle', 'image-icons' ), value: 'wiggle' },
	{ label: __( 'Pulse', 'image-icons' ), value: 'pulse' },
	{ label: __( 'Spin', 'image-icons' ), value: 'spin' },
];

export const DEFAULT_IDLE_INTERVAL = 3;
export const DEFAULT_HOVER_DURATION = 0.4;
